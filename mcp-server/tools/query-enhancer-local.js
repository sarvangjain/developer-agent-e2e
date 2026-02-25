'use strict';

/**
 * query-enhancer-local.js
 * 
 * Free (no API cost) query enhancement using rule-based techniques.
 * Replaces the Claude-dependent query-enhancer.js for cost-free operation.
 * 
 * Implements:
 *   1. Query Logging (same as before)
 *   2. Rule-based Query Decomposition (replaces Claude decomposition)
 *   3. Template-based HyDE (replaces Claude HyDE)
 *   4. Regex-based Layer 0 Query Understanding (replaces Claude Layer 0)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const QUERY_LOG_PATH = process.env.QUERY_LOG_PATH || 
  path.join(__dirname, '..', '..', 'index', 'query-log.jsonl');

const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING !== '0';
const ENABLE_QUERY_DECOMPOSITION = process.env.ENABLE_QUERY_DECOMPOSITION !== '0'; // ON by default now
const ENABLE_HYDE = process.env.ENABLE_HYDE !== '0'; // ON by default now
const ENABLE_LAYER0 = process.env.ENABLE_LAYER0 !== '0'; // ON by default now

// ---------------------------------------------------------------------------
// 1. Query Logging (unchanged — always free)
// ---------------------------------------------------------------------------

let queryLogStream = null;

function initQueryLog() {
  if (!ENABLE_QUERY_LOGGING) return;
  try {
    fs.mkdirSync(path.dirname(QUERY_LOG_PATH), { recursive: true });
    queryLogStream = fs.createWriteStream(QUERY_LOG_PATH, { flags: 'a' });
  } catch (err) {
    console.error('[query-local] Could not init query log:', err.message);
  }
}

function logQuery(originalQuery, options = {}) {
  if (!queryLogStream) return;
  try {
    queryLogStream.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      query: originalQuery,
      ...options,
    }) + '\n');
  } catch (err) { /* ignore */ }
}

function getQueryLogStats() {
  if (!fs.existsSync(QUERY_LOG_PATH)) {
    return { totalQueries: 0, logPath: QUERY_LOG_PATH };
  }
  try {
    const content = fs.readFileSync(QUERY_LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    return { totalQueries: lines.length, logPath: QUERY_LOG_PATH };
  } catch (err) {
    return { error: err.message, logPath: QUERY_LOG_PATH };
  }
}

// ---------------------------------------------------------------------------
// 2. Rule-based Query Decomposition (FREE)
// ---------------------------------------------------------------------------

/** Conjunction patterns that indicate multi-aspect queries */
const SPLIT_PATTERNS = [
  /\s+and\s+/i,
  /\s+with\s+/i,
  /\s+including\s+/i,
  /\s+plus\s+/i,
  /,\s+/,
];

/** Domain keywords — if a query mentions multiple, decompose by domain */
const DOMAIN_KEYWORDS = [
  'workflow', 'notification', 'email', 'oracle', 'service bus',
  'validation', 'schema', 'migration', 'authentication', 'authorization',
  'credit facility', 'credit note', 'finance application', 'settlement',
  'insurance', 'portfolio', 'compliance', 'kyc', 'aecb',
];

/**
 * Rule-based query decomposition.
 * Splits complex queries on conjunctions and domain boundaries.
 */
function decomposeQuery(query) {
  if (!ENABLE_QUERY_DECOMPOSITION) return [query];

  const words = query.split(/\s+/);
  if (words.length < 6) return [query]; // Short queries don't need decomposition

  // Try splitting on conjunctions
  for (const pattern of SPLIT_PATTERNS) {
    if (pattern.test(query)) {
      const parts = query.split(pattern)
        .map(p => p.trim())
        .filter(p => p.length > 3);
      
      if (parts.length >= 2 && parts.length <= 4) {
        // Keep original + sub-queries
        return [query, ...parts];
      }
    }
  }

  // Check if query mentions multiple domains
  const mentionedDomains = DOMAIN_KEYWORDS.filter(kw => 
    query.toLowerCase().includes(kw)
  );

  if (mentionedDomains.length >= 2) {
    // Create sub-queries focused on each domain
    const subQueries = mentionedDomains.slice(0, 3).map(domain => {
      // Extract the core subject (first few words) + this domain
      const coreSubject = words.slice(0, 3).join(' ');
      return `${coreSubject} ${domain}`;
    });
    return [query, ...subQueries];
  }

  return [query];
}

// ---------------------------------------------------------------------------
// 3. Template-based HyDE (FREE)
// ---------------------------------------------------------------------------

/** Layer-specific code templates */
const HYDE_TEMPLATES = {
  controller: (entity, action) => 
    `// ${action} ${entity} controller endpoint
module.exports = {
  ${action}${capitalize(entity)}: async (req, res) => {
    try {
      const payload = req.body;
      const { validatedPayload, error } = joiValidation.validate(schema, payload);
      if (error) throw new JoiSchemaError(error.message);
      const data = await ${entity}Service.${action}${capitalize(entity)}(db, validatedPayload);
      res.status(200).json(data);
    } catch (err) {
      respondError(res, err);
    }
  }
};`,

  service: (entity, action) =>
    `// ${action} ${entity} service business logic
async function ${action}${capitalize(entity)}(trx, payload) {
  const result = await db_service.${action}${capitalize(entity)}(trx, payload);
  await processWorkflow(trx, result.id, workflow, workType, action);
  await sendNotification(trx, usersToNotify, result.id, ownerType, message);
  return result;
}`,

  db_service: (entity, action) =>
    `// ${action} ${entity} database query
async function ${action}${capitalize(entity)}(trx, params) {
  return trx.select('*')
    .from('lending.${entity}')
    .where(params)
    .orderBy('created_at', 'desc');
}`,

  middleware: (entity) =>
    `// ${entity} middleware
const ${entity}Middleware = (req, res, next) => {
  try {
    // validate, authenticate, or process request
    next();
  } catch (err) {
    respondError(res, err);
  }
};`,

  schema: (entity) =>
    `// ${entity} validation schema
const Joi = require('@hapi/joi');
const schema = Joi.object({
  id: Joi.number().integer().required(),
  status: Joi.string().valid('ACTIVE', 'PENDING', 'CLOSED').required(),
});
module.exports = schema;`,
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Template-based HyDE generation (FREE).
 * Detects the likely layer and entity from the query,
 * then generates a hypothetical code snippet using templates.
 */
function generateHyDE(query) {
  if (!ENABLE_HYDE) return query;

  const qLower = query.toLowerCase();

  // Detect layer
  let layer = null;
  if (qLower.includes('controller') || qLower.includes('endpoint') || qLower.includes('route handler')) {
    layer = 'controller';
  } else if (qLower.includes('db_service') || qLower.includes('database query') || qLower.includes('knex')) {
    layer = 'db_service';
  } else if (qLower.includes('middleware')) {
    layer = 'middleware';
  } else if (qLower.includes('schema') || qLower.includes('validation')) {
    layer = 'schema';
  } else if (qLower.includes('service') || qLower.includes('business logic')) {
    layer = 'service';
  }

  // Detect action
  let action = 'get';
  if (qLower.includes('create') || qLower.includes('add') || qLower.includes('insert')) action = 'create';
  else if (qLower.includes('update') || qLower.includes('modify') || qLower.includes('patch')) action = 'update';
  else if (qLower.includes('delete') || qLower.includes('remove')) action = 'delete';
  else if (qLower.includes('validate') || qLower.includes('check')) action = 'validate';
  else if (qLower.includes('send') || qLower.includes('notify')) action = 'send';
  else if (qLower.includes('process') || qLower.includes('handle')) action = 'process';

  // Detect entity (largest domain keyword found)
  const entities = [
    'creditNote', 'creditFacility', 'financeApplication', 'insurance',
    'portfolio', 'compliance', 'notification', 'workflow', 'settlement',
    'transaction', 'organization', 'user', 'document', 'report',
  ];
  
  let entity = 'entity';
  for (const e of entities) {
    if (qLower.includes(e.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase())) {
      entity = e;
      break;
    }
  }

  // Generate hypothetical code if we detected a layer
  if (layer && HYDE_TEMPLATES[layer]) {
    const template = HYDE_TEMPLATES[layer];
    const hydeCode = typeof template === 'function' 
      ? template(entity, action) 
      : template;
    return `// Query: ${query}\n${hydeCode}`;
  }

  // No layer detected — return original query
  return query;
}

// ---------------------------------------------------------------------------
// 4. Regex-based Layer 0 Query Understanding (FREE)
// ---------------------------------------------------------------------------

/** Map of keywords to layer identifiers */
const LAYER_KEYWORDS = {
  controller: ['controller', 'endpoint', 'handler', 'api', 'request', 'response', 'req', 'res'],
  service: ['service', 'business logic', 'orchestrat', 'process workflow'],
  db_service: ['db_service', 'database', 'query', 'knex', 'select', 'insert', 'table', 'column'],
  middleware: ['middleware', 'auth', 'rate limit', 'cors', 'helmet'],
  schema: ['schema', 'joi', 'validation', 'validate payload'],
  route: ['route', 'endpoint definition', 'url path', 'http method'],
  config: ['config', 'configuration', 'environment', 'settings'],
  util: ['util', 'helper', 'common function', 'shared'],
};

/** Map of keywords to module identifiers */
const MODULE_KEYWORDS = {
  lending: ['lending', 'credit facility', 'credit note', 'finance application', 'insurance', 'portfolio', 'aecb', 'oracle', 'settlement'],
  main: ['main', 'registration', 'auth', 'login', 'organisation', 'kyc', 'compliance', 'cargo'],
};

/** Intent patterns */
const INTENT_PATTERNS = {
  find: ['find', 'search', 'where is', 'show me', 'get', 'look up', 'locate'],
  understand: ['how does', 'explain', 'what does', 'understand', 'trace', 'flow'],
  modify: ['modify', 'change', 'update', 'add', 'implement', 'create', 'build'],
  debug: ['debug', 'fix', 'error', 'bug', 'issue', 'failing', 'broken', 'wrong'],
};

/**
 * Regex-based Layer 0 query understanding (FREE).
 * Extracts intent, entities, layers, and modules from the query.
 */
function layer0QueryUnderstanding(query) {
  const qLower = query.toLowerCase();

  // Extract intent
  let intent = 'find';
  for (const [intentName, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (keywords.some(kw => qLower.includes(kw))) {
      intent = intentName;
      break;
    }
  }

  // Extract layers
  const layers = [];
  for (const [layer, keywords] of Object.entries(LAYER_KEYWORDS)) {
    if (keywords.some(kw => qLower.includes(kw))) {
      layers.push(layer);
    }
  }

  // Extract modules
  const modules = [];
  for (const [mod, keywords] of Object.entries(MODULE_KEYWORDS)) {
    if (keywords.some(kw => qLower.includes(kw))) {
      modules.push(mod);
    }
  }

  // Extract entities (function/class names — camelCase or PascalCase words)
  const entities = [];
  const entityMatch = query.match(/\b([a-z][a-zA-Z]{5,})\b/g);
  if (entityMatch) {
    // Filter out common words
    const commonWords = ['search', 'codebase', 'implement', 'function', 'method', 'create', 'update', 'delete', 'handle', 'process', 'return', 'should', 'would', 'could'];
    const filtered = entityMatch.filter(w => !commonWords.includes(w.toLowerCase()));
    entities.push(...filtered.slice(0, 3));
  }

  // Build enhanced query with context hints
  let enhancedQuery = query;
  const contextParts = [];
  if (layers.length > 0) contextParts.push(`layer:${layers.join(',')}`);
  if (modules.length > 0) contextParts.push(`module:${modules.join(',')}`);
  if (contextParts.length > 0) {
    enhancedQuery = `${query} ${contextParts.join(' ')}`;
  }

  return {
    originalQuery: query,
    intent,
    entities,
    layers,
    modules,
    enhancedQuery,
  };
}

// ---------------------------------------------------------------------------
// Combined Enhancement (ALL FREE)
// ---------------------------------------------------------------------------

/**
 * Apply all query enhancements — completely free, no API calls.
 */
function enhanceQuery(query) {
  const result = {
    originalQuery: query,
    queries: [query],
    hydeText: null,
    decomposed: false,
    hydeApplied: false,
    layer0: null,
  };

  // Layer 0 analysis
  if (ENABLE_LAYER0) {
    result.layer0 = layer0QueryUnderstanding(query);
  }

  // Query decomposition
  const decomposed = decomposeQuery(query);
  if (decomposed.length > 1) {
    result.queries = decomposed;
    result.decomposed = true;
  }

  // HyDE
  const hydeText = generateHyDE(query);
  if (hydeText !== query) {
    result.hydeText = hydeText;
    result.hydeApplied = true;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

initQueryLog();

// ---------------------------------------------------------------------------
// Exports (same interface as query-enhancer.js for drop-in replacement)
// ---------------------------------------------------------------------------

module.exports = {
  logQuery,
  getQueryLogStats,
  decomposeQuery,
  generateHyDE,
  enhanceQuery,
  layer0QueryUnderstanding,
  ENABLE_QUERY_LOGGING,
  ENABLE_QUERY_DECOMPOSITION,
  ENABLE_HYDE,
  ENABLE_LAYER0,
};
