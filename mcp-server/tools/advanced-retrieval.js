'use strict';

/**
 * advanced-retrieval.js
 * 
 * Phase 3 advanced retrieval features:
 * 
 * 1. Cross-Encoder Reranking - Use LLM to rerank results for precision
 * 2. Agentic Multi-Hop Retrieval - Iterative refinement with LLM guidance
 * 3. Layer 0 Query Understanding - Extract intent, entities, and layer hints
 */

const Anthropic = require('@anthropic-ai/sdk');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ENABLE_CROSS_ENCODER = process.env.ENABLE_CROSS_ENCODER === '1';
const ENABLE_AGENTIC_RETRIEVAL = process.env.ENABLE_AGENTIC_RETRIEVAL === '1';
const ENABLE_LAYER0 = process.env.ENABLE_LAYER0 === '1';

const RERANKER_MODEL = process.env.RERANKER_MODEL || 'claude-3-haiku-20240307';
const MAX_AGENTIC_ITERATIONS = parseInt(process.env.MAX_AGENTIC_ITERATIONS || '3', 10);

// ---------------------------------------------------------------------------
// Anthropic Client (lazy initialization)
// ---------------------------------------------------------------------------

let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[advanced-retrieval] ANTHROPIC_API_KEY not set');
      return null;
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// ---------------------------------------------------------------------------
// 1. Cross-Encoder Reranking
// ---------------------------------------------------------------------------

/**
 * Rerank search results using an LLM as a cross-encoder.
 * The LLM scores each result's relevance to the query considering full context.
 * 
 * This is slower but more accurate than embedding-based similarity.
 * 
 * @param {string} query - The search query
 * @param {Array} results - Array of search results with code snippets
 * @param {number} topK - Number of top results to return after reranking
 * @returns {Promise<Array>} - Reranked results
 */
async function crossEncoderRerank(query, results, topK = 10) {
  if (!ENABLE_CROSS_ENCODER || results.length === 0) {
    return results.slice(0, topK);
  }
  
  const client = getAnthropicClient();
  if (!client) {
    return results.slice(0, topK);
  }
  
  // Only rerank top candidates to save cost
  const candidates = results.slice(0, Math.min(20, results.length));
  
  try {
    // Build prompt with candidates
    const candidateList = candidates.map((r, i) => {
      const codePreview = r.code.slice(0, 300) + (r.code.length > 300 ? '...' : '');
      return `[${i + 1}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}
Description: ${r.description || 'N/A'}
\`\`\`javascript
${codePreview}
\`\`\``;
    }).join('\n\n');
    
    const response = await client.messages.create({
      model: RERANKER_MODEL,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a code search reranker. Given a query and code snippets, rank them by relevance.

Query: "${query}"

Candidates:
${candidateList}

Return ONLY the numbers of the top ${topK} most relevant results in order, comma-separated.
Example: 3, 1, 7, 2, 5

Most relevant results:`
      }],
    });
    
    const text = response.content[0].text;
    
    // Parse the ranking
    const rankNumbers = text.match(/\d+/g);
    if (!rankNumbers) {
      console.warn('[advanced-retrieval] could not parse reranking response');
      return results.slice(0, topK);
    }
    
    // Reorder results based on ranking
    const reranked = [];
    const seen = new Set();
    
    for (const numStr of rankNumbers) {
      const idx = parseInt(numStr, 10) - 1;
      if (idx >= 0 && idx < candidates.length && !seen.has(idx)) {
        reranked.push(candidates[idx]);
        seen.add(idx);
      }
      if (reranked.length >= topK) break;
    }
    
    // Fill remaining slots with unranked candidates if needed
    for (let i = 0; i < candidates.length && reranked.length < topK; i++) {
      if (!seen.has(i)) {
        reranked.push(candidates[i]);
      }
    }
    
    console.log(`[advanced-retrieval] cross-encoder reranked ${candidates.length} candidates`);
    return reranked;
  } catch (err) {
    console.error('[advanced-retrieval] cross-encoder reranking failed:', err.message);
    return results.slice(0, topK);
  }
}

// ---------------------------------------------------------------------------
// 2. Agentic Multi-Hop Retrieval
// ---------------------------------------------------------------------------

/**
 * Perform iterative retrieval with LLM guidance.
 * The LLM examines results and decides if more information is needed,
 * generating follow-up queries to fill gaps.
 * 
 * @param {string} query - The initial query
 * @param {Function} searchFn - The search function to call (searchCodebase)
 * @param {number} maxIterations - Maximum number of iterations
 * @returns {Promise<{ results: Array, iterations: number, followUpQueries: string[] }>}
 */
async function agenticMultiHopRetrieval(query, searchFn, maxIterations = MAX_AGENTIC_ITERATIONS) {
  if (!ENABLE_AGENTIC_RETRIEVAL) {
    const searchResult = await searchFn(query);
    return { 
      results: searchResult.results, 
      iterations: 1, 
      followUpQueries: [],
      degraded: searchResult.degraded,
    };
  }
  
  const client = getAnthropicClient();
  if (!client) {
    const searchResult = await searchFn(query);
    return { 
      results: searchResult.results, 
      iterations: 1, 
      followUpQueries: [],
      degraded: searchResult.degraded,
    };
  }
  
  const allResults = new Map();
  const followUpQueries = [];
  let currentQuery = query;
  let iterations = 0;
  let degraded = false;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Search with current query
    const searchResult = await searchFn(currentQuery, 15);
    degraded = degraded || searchResult.degraded;
    
    // Add new results to collection
    for (const r of searchResult.results) {
      if (!allResults.has(r.chunk_id)) {
        allResults.set(r.chunk_id, r);
      }
    }
    
    // Check if we need more information
    if (iterations >= maxIterations) break;
    
    // Summarize what we've found
    const resultSummary = Array.from(allResults.values())
      .slice(0, 10)
      .map(r => `- ${r.file_path}${r.function_name ? '#' + r.function_name : ''}: ${r.description || 'N/A'}`)
      .join('\n');
    
    try {
      const response = await client.messages.create({
        model: RERANKER_MODEL,
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `You are helping search a codebase. Given the original query and current search results, determine if we need to search for more specific information.

Original Query: "${query}"

Current Results:
${resultSummary}

If the results fully answer the query, respond with: DONE
If we need more information, respond with a single follow-up search query (no explanation).

Response:`
        }],
      });
      
      const text = response.content[0].text.trim();
      
      if (text.toUpperCase().includes('DONE') || text.length < 5) {
        console.log(`[advanced-retrieval] agentic retrieval complete after ${iterations} iterations`);
        break;
      }
      
      // Use the follow-up query
      currentQuery = text.replace(/^["']|["']$/g, '').slice(0, 200);
      followUpQueries.push(currentQuery);
      console.log(`[advanced-retrieval] iteration ${iterations}: follow-up query: "${currentQuery.slice(0, 50)}..."`);
      
    } catch (err) {
      console.error('[advanced-retrieval] agentic iteration failed:', err.message);
      break;
    }
  }
  
  // Return all collected results, sorted by original score
  const results = Array.from(allResults.values())
    .sort((a, b) => (b.rrf_score || 0) - (a.rrf_score || 0));
  
  return { results, iterations, followUpQueries, degraded };
}

// ---------------------------------------------------------------------------
// 3. Layer 0 Query Understanding
// ---------------------------------------------------------------------------

/**
 * Pre-process query to extract intent, entities, and architectural hints.
 * This helps route the query to the right parts of the codebase.
 * 
 * @param {string} query - The raw query
 * @returns {Promise<{ 
 *   originalQuery: string,
 *   intent: string,           // 'find', 'understand', 'modify', 'debug'
 *   entities: string[],       // extracted function/class/file names
 *   layers: string[],         // controller, service, db_service, etc.
 *   modules: string[],        // lending, main, shared
 *   enhancedQuery: string,    // query with extracted context
 * }>}
 */
async function layer0QueryUnderstanding(query) {
  const result = {
    originalQuery: query,
    intent: 'find',
    entities: [],
    layers: [],
    modules: [],
    enhancedQuery: query,
  };
  
  if (!ENABLE_LAYER0) {
    return result;
  }
  
  const client = getAnthropicClient();
  if (!client) {
    return result;
  }
  
  try {
    const response = await client.messages.create({
      model: RERANKER_MODEL,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Analyze this code search query and extract structured information.

Query: "${query}"

Respond in this EXACT format (JSON):
{
  "intent": "find|understand|modify|debug",
  "entities": ["function or class names mentioned"],
  "layers": ["controller", "service", "db_service", "middleware", "schema", "route", "util"],
  "modules": ["lending", "main", "shared"]
}

Only include layers/modules if explicitly or implicitly mentioned. Keep entities list short (max 3).

JSON:`
      }],
    });
    
    const text = response.content[0].text.trim();
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      result.intent = parsed.intent || 'find';
      result.entities = (parsed.entities || []).slice(0, 3);
      result.layers = (parsed.layers || []).filter(l => 
        ['controller', 'service', 'db_service', 'middleware', 'schema', 'route', 'util', 'config'].includes(l)
      );
      result.modules = (parsed.modules || []).filter(m => 
        ['lending', 'main', 'shared'].includes(m)
      );
      
      // Build enhanced query with context
      const contextParts = [];
      if (result.layers.length > 0) {
        contextParts.push(`layer:${result.layers.join(',')}`);
      }
      if (result.modules.length > 0) {
        contextParts.push(`module:${result.modules.join(',')}`);
      }
      
      if (contextParts.length > 0) {
        result.enhancedQuery = `${query} ${contextParts.join(' ')}`;
      }
      
      console.log(`[advanced-retrieval] Layer 0: intent=${result.intent}, entities=${result.entities.length}, layers=${result.layers.join(',') || 'any'}`);
    }
  } catch (err) {
    console.error('[advanced-retrieval] Layer 0 analysis failed:', err.message);
  }
  
  return result;
}

// ---------------------------------------------------------------------------
// Combined Advanced Search
// ---------------------------------------------------------------------------

/**
 * Perform advanced search with all Phase 3 features.
 * 
 * @param {string} query - The search query
 * @param {Function} searchFn - The base search function
 * @param {object} options - Options { limit, lambda, useAgentic, useCrossEncoder, useLayer0 }
 * @returns {Promise<object>} - Search results with metadata
 */
async function advancedSearch(query, searchFn, options = {}) {
  const {
    limit = 20,
    useAgentic = ENABLE_AGENTIC_RETRIEVAL,
    useCrossEncoder = ENABLE_CROSS_ENCODER,
    useLayer0 = ENABLE_LAYER0,
  } = options;
  
  // Step 1: Layer 0 Query Understanding
  let processedQuery = query;
  let layer0Result = null;
  
  if (useLayer0) {
    layer0Result = await layer0QueryUnderstanding(query);
    processedQuery = layer0Result.enhancedQuery;
  }
  
  // Step 2: Agentic Multi-Hop or regular search
  let searchResults;
  let iterations = 1;
  let followUpQueries = [];
  
  if (useAgentic) {
    const agenticResult = await agenticMultiHopRetrieval(processedQuery, searchFn);
    searchResults = agenticResult.results;
    iterations = agenticResult.iterations;
    followUpQueries = agenticResult.followUpQueries;
  } else {
    const result = await searchFn(processedQuery, limit * 2);
    searchResults = result.results;
  }
  
  // Step 3: Cross-Encoder Reranking
  let finalResults = searchResults;
  if (useCrossEncoder && searchResults.length > 0) {
    finalResults = await crossEncoderRerank(query, searchResults, limit);
  } else {
    finalResults = searchResults.slice(0, limit);
  }
  
  return {
    results: finalResults,
    metadata: {
      layer0: layer0Result,
      iterations,
      followUpQueries,
      crossEncoderApplied: useCrossEncoder && searchResults.length > 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  crossEncoderRerank,
  agenticMultiHopRetrieval,
  layer0QueryUnderstanding,
  advancedSearch,
  ENABLE_CROSS_ENCODER,
  ENABLE_AGENTIC_RETRIEVAL,
  ENABLE_LAYER0,
};
