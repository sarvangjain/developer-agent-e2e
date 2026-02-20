'use strict';

/**
 * validate-index.js
 *
 * Smoke test for Phase 2: queries both Qdrant (vector) and BM25 (keyword)
 * to verify retrieval quality.
 *
 * Test queries:
 *   1. "Express middleware that handles authentication"  → should find auth middleware
 *   2. "loginUser"                                       → should find exact function
 *   3. "credit facility approval workflow"               → should find credit facility service
 *   4. "rate limiting middleware"                         → should find rate limit middleware
 *   5. "send email notification"                         → should find notification service
 *
 * Usage:
 *   node scripts/validate-index.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { QdrantClient } = require('@qdrant/js-client-rest');
const { loadBm25Index, searchBm25 } = require('../indexer/bm25-client');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = 'codebase';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';

const http = require('http');
const qdrant = new QdrantClient({ url: QDRANT_URL });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        else resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function embedQuery(text) {
  const data = await httpPost(`${OLLAMA_URL}/api/embed`, {
    model: EMBEDDING_MODEL,
    input: [text],
  });
  return data.embeddings[0];
}

async function vectorSearch(query, limit = 5) {
  const embedding = await embedQuery(query);
  const results = await qdrant.search(QDRANT_COLLECTION, {
    vector: embedding,
    limit,
    with_payload: true,
  });
  return results.map(r => ({
    score: r.score.toFixed(4),
    file_path: r.payload.file_path,
    function_name: r.payload.function_name,
    description: r.payload.description,
  }));
}

// ---------------------------------------------------------------------------
// Test queries
// ---------------------------------------------------------------------------

const TEST_QUERIES = [
  {
    query: 'Express middleware that handles authentication',
    expect: 'auth middleware or access control files',
  },
  {
    query: 'loginUser',
    expect: 'auth controller login function',
  },
  {
    query: 'credit facility approval workflow',
    expect: 'credit facility service or controller',
  },
  {
    query: 'rate limiting middleware',
    expect: 'rate limit middleware file',
  },
  {
    query: 'send email notification',
    expect: 'notification service',
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function validate() {
  console.log('=== Index Validation ===\n');

  // Check Qdrant
  try {
    const info = await qdrant.getCollection(QDRANT_COLLECTION);
    console.log(`Qdrant collection '${QDRANT_COLLECTION}': ${info.points_count} points\n`);
  } catch (err) {
    console.error(`Qdrant not available: ${err.message}`);
    console.error('Make sure Qdrant is running: docker compose up -d');
    process.exit(1);
  }

  // Load BM25
  let bm25Db;
  try {
    bm25Db = await loadBm25Index();
    console.log('BM25 index loaded\n');
  } catch (err) {
    console.error(`BM25 index not available: ${err.message}`);
    process.exit(1);
  }

  // Run test queries
  for (const test of TEST_QUERIES) {
    console.log(`${'─'.repeat(60)}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Expected: ${test.expect}`);
    console.log('');

    // Vector search
    console.log('  Vector (top 3):');
    try {
      const vectorResults = await vectorSearch(test.query, 3);
      for (const r of vectorResults) {
        console.log(`    [${r.score}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}`);
        if (r.description) console.log(`             "${r.description}"`);
      }
    } catch (err) {
      console.log(`    ERROR: ${err.message}`);
    }

    console.log('');

    // BM25 search
    console.log('  BM25 (top 3):');
    try {
      const bm25Results = await searchBm25(bm25Db, test.query, 3);
      for (const r of bm25Results) {
        console.log(`    [${r.bm25_score.toFixed(4)}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}`);
        if (r.description) console.log(`             "${r.description}"`);
      }
    } catch (err) {
      console.log(`    ERROR: ${err.message}`);
    }

    console.log('');
  }

  console.log(`${'─'.repeat(60)}`);
  console.log('\nValidation complete. Review the results above:');
  console.log('  ✓ Good: results match the expected content');
  console.log('  ✗ Bad: results are irrelevant or from wrong files');
  console.log('\nIf results are poor, tune the NL description prompt in chunk-and-describe.js');
}

validate().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
