'use strict';

/**
 * search-codebase.js
 * 
 * The core retrieval tool. Combines BM25 keyword search and Qdrant vector search
 * using RRF merge, then applies MMR re-ranking for diversity.
 * 
 * This is what makes the agent see one route + one service + one middleware
 * instead of 10 similar route handlers.
 */

const { vectorSearch, mmrRerank, embedQuery } = require('../db/qdrant-client');
const bm25 = require('../db/bm25-client');
const { mergeRRF } = require('../db/rrf');

/**
 * Hybrid codebase search.
 * 
 * @param {string} query - natural language search query
 * @param {number} limit - max results to return (default 20)
 * @param {number} lambda - MMR diversity parameter (0.5=diverse, 0.8=relevant)
 * @returns {Array} ranked, diverse code chunks
 */
async function searchCodebase(query, limit = 20, lambda = 0.5) {
  // Fire both searches in parallel (fetch top 50 candidates each)
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(query, 50).catch(err => {
      console.error('[search] vector search error:', err.message);
      return [];
    }),
    bm25.search(query, 50).catch(err => {
      console.error('[search] BM25 search error:', err.message);
      return [];
    }),
  ]);

  // Normalize BM25 results to match vector result format
  const normalizedBm25 = bm25Results.map(r => ({
    chunk_id: r.chunk_id,
    file_path: r.file_path,
    function_name: r.function_name,
    description: r.description,
    code: r.code,
    start_line: r.start_line,
    end_line: r.end_line,
    is_exported: r.is_exported,
    bm25_score: r.bm25_score,
  }));

  // Merge using RRF
  const merged = mergeRRF([vectorResults, normalizedBm25], 60, 50);

  // Apply MMR re-ranking for diversity
  // We need vectors for MMR — fetch them from the vector results
  const vectorMap = new Map();
  for (const r of vectorResults) {
    if (r.vector) vectorMap.set(r.chunk_id, r.vector);
  }

  // Add vectors back to merged results for MMR
  const mergedWithVectors = merged.map(r => ({
    ...r,
    vector: vectorMap.get(r.chunk_id) || null,
    score: r.rrf_score,
  }));

  // Get query vector for MMR
  let queryVector = null;
  try {
    queryVector = await embedQuery(query);
  } catch (err) {
    console.error('[search] could not embed query for MMR:', err.message);
  }

  let finalResults;
  if (queryVector && mergedWithVectors.some(r => r.vector)) {
    finalResults = mmrRerank(mergedWithVectors, queryVector, lambda, limit);
  } else {
    // Fallback: just use RRF order without MMR
    finalResults = merged.slice(0, limit).map(r => {
      const { vector, ...rest } = r;
      return rest;
    });
  }

  // Format output (strip vectors, add rank)
  return finalResults.map((r, i) => ({
    rank: i + 1,
    chunk_id: r.chunk_id,
    file_path: r.file_path,
    function_name: r.function_name,
    description: r.description,
    code: r.code,
    start_line: r.start_line,
    end_line: r.end_line,
    is_exported: r.is_exported,
    module: r.module,
    layer: r.layer,
    rrf_score: r.rrf_score,
  }));
}

module.exports = { searchCodebase };
