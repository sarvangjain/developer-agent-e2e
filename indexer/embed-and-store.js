'use strict';

/**
 * embed-and-store.js
 *
 * Phase 2, Step 2: Generate embeddings and store in Qdrant.
 *
 * Reads index/chunks.json (from chunk-and-describe.js), generates embeddings
 * using Ollama's nomic-embed-text model, and upserts into a Qdrant collection.
 *
 * Each point in Qdrant has:
 *   - id: numeric hash of the chunk ID
 *   - vector: 768-dim embedding from nomic-embed-text
 *   - payload: filePath, functionName, description, code, startLine, endLine, etc.
 *
 * Usage:
 *   node indexer/embed-and-store.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const http = require('http');
const { QdrantClient } = require('@qdrant/js-client-rest');
const config = require('./config');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHUNKS_PATH = path.join(config.projectRoot, 'index', 'chunks.json');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = 'codebase';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';
const EMBEDDING_DIMENSIONS = 768;

/** Batch size for embedding requests */
const EMBED_BATCH_SIZE = 10;

/** Max characters to send for embedding (nomic-embed-text context ~2048 tokens default) */
const MAX_EMBED_CHARS = 6000;

/** Batch size for Qdrant upserts */
const UPSERT_BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Qdrant client
// ---------------------------------------------------------------------------

const qdrant = new QdrantClient({ url: QDRANT_URL });

/**
 * Create or recreate the Qdrant collection.
 */
async function ensureCollection(recreate = false) {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === QDRANT_COLLECTION);

  if (exists && recreate) {
    console.log(`[embed] deleting existing collection: ${QDRANT_COLLECTION}`);
    await qdrant.deleteCollection(QDRANT_COLLECTION);
  }

  if (!exists || recreate) {
    console.log(`[embed] creating collection: ${QDRANT_COLLECTION} (${EMBEDDING_DIMENSIONS} dims)`);
    await qdrant.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: EMBEDDING_DIMENSIONS,
        distance: 'Cosine',
      },
      // Optimize for our use case
      optimizers_config: {
        indexing_threshold: 10000,
      },
    });
  } else {
    console.log(`[embed] collection ${QDRANT_COLLECTION} already exists`);
  }
}

// ---------------------------------------------------------------------------
// Ollama embedding
// ---------------------------------------------------------------------------

/**
 * Make an HTTP POST request (Node 18.14 compatible — no global fetch).
 */
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    http.get({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode }));
    }).on('error', reject);
  });
}

/**
 * Generate embedding for a single text using Ollama.
 * 
 * @param {string} text - text to embed
 * @returns {number[]} - embedding vector
 */
async function embedSingle(text) {
  const truncated = text.length > MAX_EMBED_CHARS ? text.slice(0, MAX_EMBED_CHARS) : text;
  const data = await httpPost(`${OLLAMA_URL}/api/embed`, {
    model: EMBEDDING_MODEL,
    input: truncated,
  });
  return data.embeddings[0];
}

// ---------------------------------------------------------------------------
// Stable numeric ID generation
// ---------------------------------------------------------------------------

/**
 * Use the chunk ID string directly as Qdrant point ID (Fix 4).
 * Qdrant supports string UUIDs, but also accepts any unique string via
 * a deterministic UUID v5 approach. We'll use a simple content-hash UUID.
 */
function chunkIdToUuid(str) {
  // Generate a deterministic UUID-like string from chunk ID
  // Format: 8-4-4-4-12 hex chars derived from the string hash
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),  // version 4 UUID format
    '8' + hash.slice(17, 20),  // variant
    hash.slice(20, 32),
  ].join('-');
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function embedAndStore() {
  console.log('[embed] starting embed-and-store pipeline...');

  // Load chunks
  if (!fs.existsSync(CHUNKS_PATH)) {
    throw new Error(`chunks.json not found at ${CHUNKS_PATH}. Run chunk-and-describe.js first.`);
  }
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  console.log(`[embed] loaded ${chunks.length} chunks`);

  // Verify Ollama is running
  try {
    console.log(`[embed] checking Ollama at ${OLLAMA_URL}...`);
    const healthResp = await httpGet(`${OLLAMA_URL}/api/tags`);
    if (!healthResp.ok) throw new Error(`Ollama returned status ${healthResp.status}`);
    console.log('[embed] Ollama is running');
  } catch (err) {
    console.error(`[embed] Ollama health check failed: ${err.message}`);
    throw new Error(`Ollama is not running at ${OLLAMA_URL}. Start it with: ollama serve`);
  }

  // Ensure Qdrant collection exists (recreate for full index)
  await ensureCollection(true);

  // Generate embeddings one at a time (avoids context length issues with batched input)
  console.log(`[embed] generating embeddings (one at a time, ${chunks.length} total)...`);

  const points = [];
  let embedded = 0;
  let truncated = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const text = chunk.textForEmbedding || chunk.code;

    if (text.length > MAX_EMBED_CHARS) truncated++;

    try {
      const embedding = await embedSingle(text);

      points.push({
        id: chunkIdToUuid(chunk.id),
        vector: embedding,
        payload: {
          chunk_id: chunk.id,
          file_path: chunk.filePath,
          function_name: chunk.functionName || null,
          description: chunk.description || null,
          code: chunk.code,
          start_line: chunk.startLine,
          end_line: chunk.endLine,
          is_exported: chunk.isExported || false,
          is_async: chunk.isAsync || false,
          symbol_type: chunk.symbolType || null,
          // Rich metadata (Fix 6)
          module: chunk.module || null,
          layer: chunk.layer || null,
          is_route_handler: chunk.isRouteHandler || false,
        },
      });
    } catch (err) {
      // Skip chunks that still fail (extremely large)
      console.warn(`\n[embed] skipping chunk ${chunk.id}: ${err.message.slice(0, 80)}`);
    }

    embedded++;
    if (embedded % 100 === 0 || embedded === chunks.length) {
      const pct = Math.round((embedded / chunks.length) * 100);
      process.stdout.write(`\r[embed] embedded: ${embedded}/${chunks.length} (${pct}%)`);
    }
  }

  console.log('');
  if (truncated > 0) console.log(`[embed] ${truncated} chunks were truncated to ${MAX_EMBED_CHARS} chars`);

  // Check for ID collisions (should be impossible with MD5-based UUIDs)
  const ids = new Set(points.map(p => p.id));
  if (ids.size !== points.length) {
    console.warn(`[embed] WARNING: ${points.length - ids.size} ID collisions detected. Some chunks may be overwritten.`);
  }

  // Upsert into Qdrant in batches
  console.log(`[embed] upserting ${points.length} points into Qdrant (batch size: ${UPSERT_BATCH_SIZE})...`);

  let upserted = 0;
  for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
    const batch = points.slice(i, i + UPSERT_BATCH_SIZE);
    await qdrant.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: batch,
    });

    upserted += batch.length;
    const pct = Math.round((upserted / points.length) * 100);
    process.stdout.write(`\r[embed] upserted: ${upserted}/${points.length} (${pct}%)`);
  }

  console.log(''); // newline after progress

  // Verify
  const collectionInfo = await qdrant.getCollection(QDRANT_COLLECTION);
  console.log(`[embed] Qdrant collection '${QDRANT_COLLECTION}': ${collectionInfo.points_count} points`);
  console.log('[embed] done');
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { embedAndStore, embedSingle, QDRANT_COLLECTION, QDRANT_URL };

if (require.main === module) {
  embedAndStore().catch(err => {
    console.error('[embed] fatal error:', err);
    process.exit(1);
  });
}
