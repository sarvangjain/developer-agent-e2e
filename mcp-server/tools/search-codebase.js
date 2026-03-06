'use strict';

/**
 * search-codebase.js
 * 
 * The core retrieval tool. Combines BM25 keyword search and Qdrant vector search
 * using RRF merge, then applies MMR re-ranking for diversity.
 * 
 * This is what makes the agent see one route + one service + one middleware
 * instead of 10 similar route handlers.
 * 
 * Enhanced Features (Phase 2):
 * - Query Logging: Track queries for analysis
 * - Query Decomposition: Break complex queries into sub-queries
 * - HyDE: Generate hypothetical code for better vector matching
 * 
 * Graceful Degradation:
 * - If vector search fails (Qdrant/Ollama down), returns BM25-only results with degraded=true
 * - If BM25 fails, falls back to vector-only results
 * - If both fail, returns empty results with degraded=true
 */

const { vectorSearch, mmrRerank, embedQuery } = require('../db/qdrant-client');
const bm25 = require('../db/bm25-client');
const { mergeRRF } = require('../db/rrf');
const { 
  logQuery, 
  enhanceQuery, 
  ENABLE_QUERY_DECOMPOSITION, 
  ENABLE_HYDE 
} = require('./query-enhancer');

/**
 * Hybrid codebase search with graceful degradation and query enhancement.
 * 
 * @param {string} query - natural language search query
 * @param {number} limit - max results to return (default 20)
 * @param {number} lambda - MMR diversity parameter (0.5=diverse, 0.8=relevant)
 * @returns {{ degraded: boolean, results: Array, enhanced?: object }} ranked code chunks with degradation status
 */
async function searchCodebase(query, limit = 20, lambda = 0.5) {
  const startTime = Date.now();
  
  // Step 1: Apply query enhancements (decomposition + HyDE)
  let enhancement = { queries: [query], hydeText: null, decomposed: false, hydeApplied: false };
  try {
    enhancement = await enhanceQuery(query);
  } catch (err) {
    console.error('[search] query enhancement failed:', err.message);
  }
  
  // Determine what to use for vector search
  // If HyDE is enabled and generated, use hypothetical code for better semantic matching
  const vectorQuery = enhancement.hydeText || query;
  
  // For BM25, we use the original query (keywords matter more than semantics)
  // If decomposed, we'll merge results from multiple queries
  const bm25Queries = enhancement.queries;
  
  // Fire searches in parallel with explicit error tracking
  let vectorResults = null;
  let vectorError = null;
  let bm25Results = null;
  let bm25Error = null;

  // Vector search (using HyDE-enhanced query if available)
  const vectorPromise = vectorSearch(vectorQuery, 50)
    .then(results => ({ success: true, results }))
    .catch(err => {
      console.error('[search] vector search failed:', err.message);
      return { success: false, error: err.message };
    });
  
  // BM25 search (potentially with multiple decomposed queries)
  const bm25Promise = (async () => {
    try {
      if (bm25Queries.length === 1) {
        // Single query
        const results = await bm25.search(bm25Queries[0], 50);
        return { success: true, results };
      } else {
        // Multiple queries - merge results
        const allResults = await Promise.all(
          bm25Queries.map(q => bm25.search(q, 30).catch(() => []))
        );
        
        // Deduplicate by chunk_id, keeping highest score
        const resultMap = new Map();
        for (const results of allResults) {
          for (const r of results) {
            const existing = resultMap.get(r.chunk_id);
            if (!existing || r.bm25_score > existing.bm25_score) {
              resultMap.set(r.chunk_id, r);
            }
          }
        }
        
        // Sort by score and return
        const merged = Array.from(resultMap.values())
          .sort((a, b) => b.bm25_score - a.bm25_score)
          .slice(0, 50);
        
        return { success: true, results: merged };
      }
    } catch (err) {
      console.error('[search] BM25 search failed:', err.message);
      return { success: false, error: err.message };
    }
  })();

  const [vectorOutcome, bm25Outcome] = await Promise.all([vectorPromise, bm25Promise]);

  if (vectorOutcome.success) {
    vectorResults = vectorOutcome.results;
  } else {
    vectorError = vectorOutcome.error;
  }

  if (bm25Outcome.success) {
    bm25Results = bm25Outcome.results;
  } else {
    bm25Error = bm25Outcome.error;
  }

  // Determine degradation status
  const vectorFailed = vectorResults === null;
  const bm25Failed = bm25Results === null;
  const degraded = vectorFailed || bm25Failed;

  // Both failed — return empty with degraded flag
  if (vectorFailed && bm25Failed) {
    console.error('[search] both search backends failed — returning empty results');
    return { degraded: true, results: [] };
  }

  // BM25-only mode (vector failed)
  if (vectorFailed) {
    console.warn('[search] running in degraded mode (BM25 only)');
    const results = bm25Results.slice(0, limit).map((r, i) => ({
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
      bm25_score: r.bm25_score,
      rrf_score: null,
    }));
    return { degraded: true, results };
  }

  // Vector-only mode (BM25 failed)
  if (bm25Failed) {
    console.warn('[search] running in partial-degraded mode (vector only)');
    bm25Results = [];
  }

  // Normal hybrid mode (or vector-only fallback)
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
    module: r.module,
    layer: r.layer,
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
  const results = finalResults.map((r, i) => ({
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

  // Log query for analysis
  const elapsedMs = Date.now() - startTime;
  logQuery(query, {
    resultCount: results.length,
    degraded,
    decomposed: enhancement.decomposed,
    hydeApplied: enhancement.hydeApplied,
    subQueries: enhancement.queries.length > 1 ? enhancement.queries : undefined,
    elapsedMs,
  });

  return { 
    degraded, 
    results,
    // Include enhancement metadata for debugging/transparency
    enhanced: {
      decomposed: enhancement.decomposed,
      hydeApplied: enhancement.hydeApplied,
      queryCount: enhancement.queries.length,
    },
  };
}

module.exports = { searchCodebase };
