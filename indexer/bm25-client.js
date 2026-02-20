'use strict';

/**
 * bm25-client.js
 *
 * Phase 2, Step 3: Build and persist a BM25 keyword index using @orama/orama.
 *
 * Reads index/chunks.json, indexes each chunk's code + description + function
 * name into Orama for keyword/symbol-exact search.
 *
 * When the PRD says "modify the getUserById function," BM25 finds it by name.
 * When vector search handles the semantic side, BM25 handles the exact-match side.
 *
 * The index is serialized to index/bm25-index.json for fast reload by the MCP server.
 *
 * Usage:
 *   node indexer/bm25-client.js           # build index
 *   (imported by MCP server for search)
 */

const fs = require('fs');
const path = require('path');
const { create, insert, save, load, search } = require('@orama/orama');
const config = require('./config');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHUNKS_PATH = path.join(config.projectRoot, 'index', 'chunks.json');
const BM25_INDEX_PATH = path.join(config.projectRoot, 'index', 'bm25-index.json');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ORAMA_SCHEMA = {
  chunk_id: 'string',
  file_path: 'string',
  function_name: 'string',
  description: 'string',
  code: 'string',
  start_line: 'number',
  end_line: 'number',
  is_exported: 'boolean',
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function buildBm25Index(chunks) {
  console.log('[bm25] building BM25 index...');

  // Load chunks if not passed
  if (!chunks) {
    if (!fs.existsSync(CHUNKS_PATH)) {
      throw new Error(`chunks.json not found at ${CHUNKS_PATH}. Run chunk-and-describe.js first.`);
    }
    chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  }

  // Create Orama instance
  const db = await create({
    schema: ORAMA_SCHEMA,
  });

  // Insert all chunks
  let inserted = 0;
  for (const chunk of chunks) {
    await insert(db, {
      chunk_id: chunk.id,
      file_path: chunk.filePath,
      function_name: chunk.functionName || '',
      description: chunk.description || '',
      code: chunk.code,
      start_line: chunk.startLine || 0,
      end_line: chunk.endLine || 0,
      is_exported: chunk.isExported || false,
    });
    inserted++;
  }

  console.log(`[bm25] indexed ${inserted} chunks`);

  // Serialize to disk
  const serialized = await save(db);
  fs.mkdirSync(path.dirname(BM25_INDEX_PATH), { recursive: true });
  fs.writeFileSync(BM25_INDEX_PATH, JSON.stringify(serialized));
  const sizeMB = (fs.statSync(BM25_INDEX_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`[bm25] index saved to ${BM25_INDEX_PATH} (${sizeMB} MB)`);

  return db;
}

// ---------------------------------------------------------------------------
// Load (for MCP server)
// ---------------------------------------------------------------------------

async function loadBm25Index() {
  if (!fs.existsSync(BM25_INDEX_PATH)) {
    throw new Error(`BM25 index not found at ${BM25_INDEX_PATH}. Run the indexer first.`);
  }

  const serialized = JSON.parse(fs.readFileSync(BM25_INDEX_PATH, 'utf-8'));
  const db = await create({ schema: ORAMA_SCHEMA });
  await load(db, serialized);

  return db;
}

// ---------------------------------------------------------------------------
// Search (for MCP server)
// ---------------------------------------------------------------------------

/**
 * Search the BM25 index.
 * 
 * @param {object} db - Orama database instance
 * @param {string} query - search query
 * @param {number} limit - max results (default 50)
 * @returns {Array} - results with chunk data and BM25 score
 */
async function searchBm25(db, query, limit = 50) {
  const results = await search(db, {
    term: query,
    limit,
    properties: ['function_name', 'description', 'code', 'file_path'],
  });

  return results.hits.map(hit => ({
    chunk_id: hit.document.chunk_id,
    file_path: hit.document.file_path,
    function_name: hit.document.function_name,
    description: hit.document.description,
    code: hit.document.code,
    start_line: hit.document.start_line,
    end_line: hit.document.end_line,
    is_exported: hit.document.is_exported,
    bm25_score: hit.score,
  }));
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { buildBm25Index, loadBm25Index, searchBm25, BM25_INDEX_PATH };

if (require.main === module) {
  buildBm25Index().catch(err => {
    console.error('[bm25] fatal error:', err);
    process.exit(1);
  });
}
