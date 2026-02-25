'use strict';

/**
 * advanced-retrieval-local.js
 * 
 * Free (no API cost) advanced retrieval features.
 * Replaces Claude-dependent cross-encoder and agentic retrieval
 * with rule-based alternatives.
 * 
 * 1. Rule-based Reranking — boosts results matching detected layer/module/entity
 * 2. Diversity Enforcement — ensures results span multiple layers
 * 3. Layer 0 Filtering — uses query understanding to filter Qdrant results
 */

const { layer0QueryUnderstanding } = require('./query-enhancer-local');

// ---------------------------------------------------------------------------
// 1. Rule-based Reranking (FREE)
// ---------------------------------------------------------------------------

/**
 * Boost scores for results that match detected query attributes.
 * This is a lightweight alternative to cross-encoder reranking.
 */
function ruleBasedRerank(query, results, layer0, topK = 15) {
  if (results.length === 0) return [];

  const qLower = query.toLowerCase();

  const scored = results.map(r => {
    let boost = 0;

    // Boost if result layer matches detected layers
    if (layer0 && layer0.layers.length > 0) {
      if (layer0.layers.includes(r.layer)) {
        boost += 0.15;
      }
    }

    // Boost if result module matches detected modules
    if (layer0 && layer0.modules.length > 0) {
      if (layer0.modules.includes(r.module)) {
        boost += 0.10;
      }
    }

    // Boost exported functions (more likely to be relevant entry points)
    if (r.is_exported) {
      boost += 0.05;
    }

    // Boost if function name appears in query
    if (r.function_name && qLower.includes(r.function_name.toLowerCase())) {
      boost += 0.25;
    }

    // Boost if file path contains query keywords
    const pathParts = (r.file_path || '').toLowerCase().split('/');
    const queryWords = qLower.split(/\s+/).filter(w => w.length > 3);
    for (const word of queryWords) {
      if (pathParts.some(p => p.includes(word))) {
        boost += 0.05;
        break;
      }
    }

    return {
      ...r,
      original_score: r.rrf_score || r.score || 0,
      boosted_score: (r.rrf_score || r.score || 0) + boost,
    };
  });

  // Sort by boosted score
  scored.sort((a, b) => b.boosted_score - a.boosted_score);

  return scored.slice(0, topK);
}

// ---------------------------------------------------------------------------
// 2. Diversity Enforcement (FREE)
// ---------------------------------------------------------------------------

/**
 * Ensure results span multiple architectural layers.
 * If top results are all from the same layer, inject results from other layers.
 * 
 * Target distribution: at least one result from each relevant layer.
 */
function enforceDiversity(results, topK = 15) {
  if (results.length <= topK) return results;

  const byLayer = new Map();
  for (const r of results) {
    const layer = r.layer || 'other';
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push(r);
  }

  // If only 1-2 layers represented, no diversity needed
  if (byLayer.size <= 2) return results.slice(0, topK);

  const selected = [];
  const usedIds = new Set();

  // Round-robin: pick best from each layer first
  const layerOrder = ['controller', 'service', 'db_service', 'route', 'middleware', 'schema', 'config', 'util', 'other'];
  
  for (const layer of layerOrder) {
    const layerResults = byLayer.get(layer);
    if (layerResults && layerResults.length > 0) {
      const best = layerResults[0];
      if (!usedIds.has(best.chunk_id)) {
        selected.push(best);
        usedIds.add(best.chunk_id);
      }
    }
    if (selected.length >= topK) break;
  }

  // Fill remaining slots by score order
  for (const r of results) {
    if (selected.length >= topK) break;
    if (!usedIds.has(r.chunk_id)) {
      selected.push(r);
      usedIds.add(r.chunk_id);
    }
  }

  return selected;
}

// ---------------------------------------------------------------------------
// 3. Combined Advanced Search (FREE)
// ---------------------------------------------------------------------------

/**
 * Advanced search with all free features.
 * Drop-in replacement for advanced-retrieval.js's advancedSearch.
 */
async function advancedSearch(query, searchFn, options = {}) {
  const {
    limit = 15,
    useLayer0 = true,
    useCrossEncoder = true,  // uses rule-based reranking instead
    useAgentic = false,      // not supported in free version
  } = options;

  // Step 1: Layer 0 query understanding (free)
  let layer0Result = null;
  let processedQuery = query;

  if (useLayer0) {
    layer0Result = layer0QueryUnderstanding(query);
    processedQuery = layer0Result.enhancedQuery;
  }

  // Step 2: Search
  const searchResult = await searchFn(processedQuery, limit * 2);
  let results = searchResult.results;

  // Step 3: Rule-based reranking (free, replaces cross-encoder)
  if (useCrossEncoder && results.length > 0) {
    results = ruleBasedRerank(query, results, layer0Result, limit * 2);
  }

  // Step 4: Diversity enforcement (free)
  results = enforceDiversity(results, limit);

  return {
    results,
    metadata: {
      layer0: layer0Result,
      iterations: 1,
      followUpQueries: [],
      crossEncoderApplied: useCrossEncoder, // rule-based, not LLM
      ruleBasedReranking: true,
      diversityEnforced: true,
    },
  };
}

module.exports = {
  ruleBasedRerank,
  enforceDiversity,
  advancedSearch,
  ENABLE_CROSS_ENCODER: true,  // always available (free)
  ENABLE_AGENTIC_RETRIEVAL: false,
  ENABLE_LAYER0: true,
};
