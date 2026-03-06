'use strict';

/**
 * query-enhancer.js
 * 
 * Advanced query processing for improved retrieval accuracy.
 * Implements three key techniques:
 * 
 * 1. Query Logging - Track queries for analysis and tuning
 * 2. Query Decomposition - Break complex queries into sub-queries
 * 3. HyDE (Hypothetical Document Embeddings) - Generate hypothetical code to embed
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const QUERY_LOG_PATH = process.env.QUERY_LOG_PATH || 
  path.join(__dirname, '..', '..', 'index', 'query-log.jsonl');

const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING !== '0';
const ENABLE_QUERY_DECOMPOSITION = process.env.ENABLE_QUERY_DECOMPOSITION === '1';
const ENABLE_HYDE = process.env.ENABLE_HYDE === '1';

const CLAUDE_MODEL = process.env.QUERY_ENHANCER_MODEL || 'claude-3-haiku-20240307';

// ---------------------------------------------------------------------------
// Anthropic Client (lazy initialization)
// ---------------------------------------------------------------------------

let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[query-enhancer] ANTHROPIC_API_KEY not set, advanced features disabled');
      return null;
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// ---------------------------------------------------------------------------
// 1. Query Logging
// ---------------------------------------------------------------------------

let queryLogStream = null;

function initQueryLog() {
  if (!ENABLE_QUERY_LOGGING) return;
  
  try {
    fs.mkdirSync(path.dirname(QUERY_LOG_PATH), { recursive: true });
    queryLogStream = fs.createWriteStream(QUERY_LOG_PATH, { flags: 'a' });
    console.error(`[query-enhancer] Query logging enabled: ${QUERY_LOG_PATH}`);
  } catch (err) {
    console.error('[query-enhancer] Could not init query log:', err.message);
  }
}

/**
 * Log a query for analysis.
 * 
 * @param {string} originalQuery - The original query
 * @param {object} options - Additional context (decomposed queries, hyde output, results count, etc.)
 */
function logQuery(originalQuery, options = {}) {
  if (!queryLogStream) return;
  
  const entry = {
    timestamp: new Date().toISOString(),
    query: originalQuery,
    ...options,
  };
  
  try {
    queryLogStream.write(JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[query-enhancer] Failed to write query log:', err.message);
  }
}

/**
 * Get query log statistics.
 * 
 * @returns {object} Stats about logged queries
 */
function getQueryLogStats() {
  if (!fs.existsSync(QUERY_LOG_PATH)) {
    return { totalQueries: 0, logPath: QUERY_LOG_PATH };
  }
  
  try {
    const content = fs.readFileSync(QUERY_LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    return {
      totalQueries: lines.length,
      logPath: QUERY_LOG_PATH,
    };
  } catch (err) {
    return { error: err.message, logPath: QUERY_LOG_PATH };
  }
}

// ---------------------------------------------------------------------------
// 2. Query Decomposition
// ---------------------------------------------------------------------------

/**
 * Decompose a complex query into simpler sub-queries.
 * Useful for multi-aspect searches like "implement credit limit with approval workflow and notifications"
 * 
 * @param {string} query - The complex query
 * @returns {Promise<string[]>} - Array of sub-queries (includes original)
 */
async function decomposeQuery(query) {
  if (!ENABLE_QUERY_DECOMPOSITION) {
    return [query];
  }
  
  const client = getAnthropicClient();
  if (!client) {
    return [query];
  }
  
  // Simple heuristic: if query is short, don't decompose
  const wordCount = query.split(/\s+/).length;
  if (wordCount < 6) {
    return [query];
  }
  
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Break this code search query into 2-4 simpler sub-queries that together cover the main concepts. Return ONLY the sub-queries, one per line, no numbering or explanation.

Query: "${query}"

Sub-queries:`
      }],
    });
    
    const text = response.content[0].text;
    const subQueries = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && l.length > 3 && !l.startsWith('-') && !l.match(/^\d/));
    
    // Always include original query + sub-queries
    const allQueries = [query, ...subQueries.slice(0, 3)];
    const unique = [...new Set(allQueries)];
    
    console.error(`[query-enhancer] decomposed "${query.slice(0, 50)}..." into ${unique.length} queries`);
    return unique;
  } catch (err) {
    console.error('[query-enhancer] decomposition failed:', err.message);
    return [query];
  }
}

// ---------------------------------------------------------------------------
// 3. HyDE (Hypothetical Document Embeddings)
// ---------------------------------------------------------------------------

/**
 * Generate a hypothetical code snippet that would answer the query.
 * The embedding of this hypothetical code often matches actual code better
 * than embedding the natural language query directly.
 * 
 * @param {string} query - The natural language query
 * @returns {Promise<string>} - Hypothetical code snippet (or original query if HyDE fails)
 */
async function generateHyDE(query) {
  if (!ENABLE_HYDE) {
    return query;
  }
  
  const client = getAnthropicClient();
  if (!client) {
    return query;
  }
  
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a code search assistant. Given a query about code, generate a SHORT hypothetical JavaScript code snippet (max 15 lines) that would be a relevant search result. Include realistic function names, parameters, and comments that match what the user is looking for.

Query: "${query}"

Hypothetical code snippet:
\`\`\`javascript`
      }],
    });
    
    const text = response.content[0].text;
    
    // Extract code from response
    let code = text;
    
    // Remove markdown code fences if present
    if (code.includes('```')) {
      const match = code.match(/```(?:javascript)?\s*([\s\S]*?)(?:```|$)/);
      if (match) {
        code = match[1].trim();
      }
    }
    
    // Combine query context with hypothetical code for embedding
    const hydeText = `// Query: ${query}\n${code}`;
    
    console.error(`[query-enhancer] HyDE generated ${code.split('\n').length} lines for "${query.slice(0, 40)}..."`);
    return hydeText;
  } catch (err) {
    console.error('[query-enhancer] HyDE generation failed:', err.message);
    return query;
  }
}

// ---------------------------------------------------------------------------
// Combined Enhancement
// ---------------------------------------------------------------------------

/**
 * Apply all enabled query enhancements.
 * 
 * @param {string} query - Original query
 * @returns {Promise<{ queries: string[], hydeText: string|null }>}
 */
async function enhanceQuery(query) {
  const result = {
    originalQuery: query,
    queries: [query],
    hydeText: null,
    decomposed: false,
    hydeApplied: false,
  };
  
  // Run decomposition and HyDE in parallel
  const [decomposedQueries, hydeText] = await Promise.all([
    decomposeQuery(query),
    generateHyDE(query),
  ]);
  
  result.queries = decomposedQueries;
  result.decomposed = decomposedQueries.length > 1;
  
  if (hydeText !== query) {
    result.hydeText = hydeText;
    result.hydeApplied = true;
  }
  
  return result;
}

// ---------------------------------------------------------------------------
// Initialize on module load
// ---------------------------------------------------------------------------

initQueryLog();

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  logQuery,
  getQueryLogStats,
  decomposeQuery,
  generateHyDE,
  enhanceQuery,
  ENABLE_QUERY_LOGGING,
  ENABLE_QUERY_DECOMPOSITION,
  ENABLE_HYDE,
};
