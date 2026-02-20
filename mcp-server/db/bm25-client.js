'use strict';

/**
 * bm25-client.js (MCP server)
 * 
 * Wraps the indexer's BM25 client for use by the MCP server.
 * Loads the serialized Orama index on startup and exposes search.
 */

const { loadBm25Index, searchBm25 } = require('../../indexer/bm25-client');

let db = null;

async function init() {
  if (!db) {
    db = await loadBm25Index();
    console.log('[mcp:bm25] BM25 index loaded');
  }
  return db;
}

async function search(query, limit = 50) {
  if (!db) await init();
  return searchBm25(db, query, limit);
}

module.exports = { init, search };
