'use strict';

/**
 * rrf.js
 * 
 * Reciprocal Rank Fusion (RRF) merge for combining BM25 and vector search results.
 * 
 * RRF formula: score(d) = Σ 1 / (k + rank_i(d))
 * where k is a constant (default 60) and rank_i(d) is the rank of document d
 * in the i-th result list.
 * 
 * RRF has no hyperparameters to tune (k=60 is standard) and consistently
 * outperforms simple weighted sum approaches.
 */

/**
 * Merge multiple ranked result lists using Reciprocal Rank Fusion.
 * 
 * @param {Array<Array>} resultLists - array of ranked result arrays
 *        Each result must have a `chunk_id` field for deduplication
 * @param {number} k - RRF constant (default 60)
 * @param {number} limit - max results to return
 * @returns {Array} merged and re-ranked results
 */
function mergeRRF(resultLists, k = 60, limit = 50) {
  const scores = new Map();    // chunk_id -> RRF score
  const resultMap = new Map();  // chunk_id -> result object (keep richest)

  for (const results of resultLists) {
    for (let rank = 0; rank < results.length; rank++) {
      const result = results[rank];
      const id = result.chunk_id;

      // Accumulate RRF score
      const rrfScore = 1 / (k + rank + 1);  // rank is 0-indexed, formula uses 1-indexed
      scores.set(id, (scores.get(id) || 0) + rrfScore);

      // Keep the result object with the most information
      if (!resultMap.has(id)) {
        resultMap.set(id, { ...result });
      } else {
        // Merge: keep fields from whichever result has them
        const existing = resultMap.get(id);
        for (const [key, value] of Object.entries(result)) {
          if (value !== null && value !== undefined && !existing[key]) {
            existing[key] = value;
          }
        }
      }
    }
  }

  // Sort by RRF score descending
  const merged = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([chunkId, rrfScore]) => ({
      ...resultMap.get(chunkId),
      rrf_score: rrfScore,
    }));

  return merged;
}

module.exports = { mergeRRF };
