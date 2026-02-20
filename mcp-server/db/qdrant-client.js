'use strict';

/**
 * qdrant-client.js
 * 
 * Qdrant vector search client for the MCP server.
 * Provides semantic search with optional MMR re-ranking for diversity.
 */

const http = require('http');
const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';
const COLLECTION = 'codebase';
const PRD_COLLECTION = 'prd_history';

const qdrant = new QdrantClient({ url: QDRANT_URL });

// ---------------------------------------------------------------------------
// HTTP helper (Node 18.14 compatible)
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

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

async function embedQuery(text) {
  const data = await httpPost(`${OLLAMA_URL}/api/embed`, {
    model: EMBEDDING_MODEL,
    input: text,
  });
  return data.embeddings[0];
}

// ---------------------------------------------------------------------------
// Vector search
// ---------------------------------------------------------------------------

/**
 * Semantic search using Qdrant.
 * 
 * @param {string} query - natural language query
 * @param {number} limit - max results (default 50)
 * @param {object} filter - optional Qdrant filter
 * @returns {Array} results with score + payload
 */
async function vectorSearch(query, limit = 50, filter = null) {
  const embedding = await embedQuery(query);

  const searchParams = {
    vector: embedding,
    limit,
    with_payload: true,
    with_vectors: true,  // needed for MMR re-ranking
  };

  if (filter) {
    searchParams.filter = filter;
  }

  const results = await qdrant.search(COLLECTION, searchParams);

  return results.map(r => ({
    id: r.id,
    score: r.score,
    vector: r.vector,
    chunk_id: r.payload.chunk_id,
    file_path: r.payload.file_path,
    function_name: r.payload.function_name,
    description: r.payload.description,
    code: r.payload.code,
    start_line: r.payload.start_line,
    end_line: r.payload.end_line,
    is_exported: r.payload.is_exported,
    module: r.payload.module,
    layer: r.payload.layer,
    is_route_handler: r.payload.is_route_handler,
  }));
}

// ---------------------------------------------------------------------------
// MMR re-ranking
// ---------------------------------------------------------------------------

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Apply MMR (Maximal Marginal Relevance) re-ranking.
 * 
 * Selects results that are both relevant to the query AND diverse
 * (not redundant with already-selected results).
 * 
 * Formula: score = λ · sim(doc, query) − (1−λ) · max(sim(doc, selected))
 * 
 * @param {Array} results - vector search results (must have .vector and .score)
 * @param {number[]} queryVector - the query embedding
 * @param {number} lambda - diversity parameter (0.5 = balanced, 0.8 = relevance-focused)
 * @param {number} topK - how many results to return after MMR
 * @returns {Array} MMR-reranked results
 */
function mmrRerank(results, queryVector, lambda = 0.5, topK = 20) {
  if (results.length === 0) return [];
  if (results.length <= topK) return results;

  const selected = [];
  const remaining = [...results];

  // Select first result (highest relevance)
  remaining.sort((a, b) => b.score - a.score);
  selected.push(remaining.shift());

  // Iteratively select next best by MMR score
  while (selected.length < topK && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmrScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      // Relevance to query
      const queryRelevance = candidate.score;

      // Max similarity to any already-selected result
      let maxSimToSelected = -Infinity;
      for (const sel of selected) {
        if (candidate.vector && sel.vector) {
          const sim = cosineSimilarity(candidate.vector, sel.vector);
          if (sim > maxSimToSelected) maxSimToSelected = sim;
        }
      }

      // MMR score
      const mmrScore = lambda * queryRelevance - (1 - lambda) * maxSimToSelected;

      if (mmrScore > bestMmrScore) {
        bestMmrScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  // Strip vectors from output (not needed downstream)
  return selected.map(r => {
    const { vector, ...rest } = r;
    return rest;
  });
}

// ---------------------------------------------------------------------------
// PRD history search (stub for Phase 5)
// ---------------------------------------------------------------------------

async function searchPrdHistory(query, limit = 10) {
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === PRD_COLLECTION);
    if (!exists) return [];

    const embedding = await embedQuery(query);
    const results = await qdrant.search(PRD_COLLECTION, {
      vector: embedding,
      limit,
      with_payload: true,
    });

    return results.map(r => ({
      score: r.score,
      ...r.payload,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = {
  vectorSearch,
  mmrRerank,
  embedQuery,
  searchPrdHistory,
  COLLECTION,
  PRD_COLLECTION,
};
