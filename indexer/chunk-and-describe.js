'use strict';

/**
 * chunk-and-describe.js
 *
 * Phase 2, Step 1: AST-aware chunking + NL description generation.
 *
 * Reads index/parsed-files.json (from Phase 1 parser) and the actual source
 * files, then:
 *   1. Splits each file at function/class boundaries (never mid-function)
 *   2. Re-attaches relevant imports (capped at 500 chars for embedding quality)
 *   3. Includes 2-3 lines of surrounding context (JSDoc above, exports below)
 *   4. Adds rich metadata (module, layer, is_route_handler)
 *   5. Generates NL descriptions via Claude (or uses Cursor-generated fallbacks)
 *   6. Writes index/chunks.json with all chunks ready for embedding
 *
 * Usage:
 *   node indexer/chunk-and-describe.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PARSED_FILES_PATH = path.join(config.projectRoot, 'index', 'parsed-files.json');
const OUTPUT_PATH = path.join(config.projectRoot, 'index', 'chunks.json');
const API_LOG_PATH = path.join(config.projectRoot, 'index', 'claude-api-log.jsonl');

/** Max characters for import block in textForEmbedding (Fix 3) */
const MAX_IMPORT_BLOCK_CHARS = 500;

/** Lines of surrounding context to include above/below each function (Fix 5) */
const CONTEXT_LINES_ABOVE = 3;
const CONTEXT_LINES_BELOW = 2;

/** Max characters per chunk before we consider splitting further */
const MAX_CHUNK_CHARS = 2000;

/** Batch size for NL description generation (chunks per API call) */
const DESCRIPTION_BATCH_SIZE = parseInt(process.env.DESCRIPTION_BATCH_SIZE || '20', 10);

/** Delay between API calls to avoid rate limiting (ms) */
const API_DELAY_MS = parseInt(process.env.API_DELAY_MS || '500', 10);

/** Model for description generation (cheaper options: claude-3-haiku-20240307, claude-3-5-haiku-20241022) */
const DESCRIPTION_MODEL = process.env.DESCRIPTION_MODEL || 'claude-sonnet-4-20250514';

/** Max chunks to process (for testing). Set to 0 or omit for no limit. */
const MAX_CHUNKS = parseInt(process.env.MAX_CHUNKS || '0', 10);

/** Enable API logging (set LOG_CLAUDE_API=1 to enable) */
const LOG_CLAUDE_API = process.env.LOG_CLAUDE_API === '1' || process.env.LOG_CLAUDE_API === 'true';

// ---------------------------------------------------------------------------
// API Logging
// ---------------------------------------------------------------------------

let apiLogStream = null;

function initApiLog() {
  if (!LOG_CLAUDE_API) return;
  
  // Create/truncate log file at start
  fs.mkdirSync(path.dirname(API_LOG_PATH), { recursive: true });
  apiLogStream = fs.createWriteStream(API_LOG_PATH, { flags: 'w' });
  console.log(`[chunk] API logging enabled: ${API_LOG_PATH}`);
}

function logApiCall(batchIndex, chunkIds, prompt, response, matched, total) {
  if (!apiLogStream) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    batchIndex,
    chunkIds,
    model: DESCRIPTION_MODEL,
    promptLength: prompt.length,
    promptPreview: prompt.slice(0, 500) + (prompt.length > 500 ? '...' : ''),
    response: response,
    matchedDescriptions: matched,
    totalChunks: total,
  };
  
  apiLogStream.write(JSON.stringify(logEntry) + '\n');
}

function closeApiLog() {
  if (apiLogStream) {
    apiLogStream.end();
    console.log(`[chunk] API log written to ${API_LOG_PATH}`);
  }
}

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

let anthropic;

function initAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set. Create a .env file with your key.');
  }
  anthropic = new Anthropic({ apiKey });
  console.log('[chunk] Anthropic client initialized');
}

// ---------------------------------------------------------------------------
// Metadata helpers (Fix 6)
// ---------------------------------------------------------------------------

/**
 * Determine which module a file belongs to.
 */
function getModule(filePath) {
  if (filePath.includes('/lending/')) return 'lending';
  if (filePath.includes('/main/')) return 'main';
  return 'shared';
}

/**
 * Determine the architectural layer of a file.
 */
function getLayer(filePath) {
  if (filePath.includes('/controllers/')) return 'controller';
  if (filePath.includes('/routes/')) return 'route';
  if (filePath.includes('/db_service/')) return 'db_service';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/middlewares/')) return 'middleware';
  if (filePath.includes('/schemas/')) return 'schema';
  if (filePath.includes('/utils/')) return 'util';
  if (filePath.includes('/errors/')) return 'error';
  if (filePath.startsWith('backend/config/')) return 'config';
  return 'other';
}

/**
 * Check if a file is a route handler file (contains route definitions).
 */
function isRouteFile(filePath, fileData) {
  return fileData.routes && fileData.routes.length > 0;
}

/**
 * Get a human-readable description of the architectural layer.
 */
function getLayerDescription(layer) {
  const descriptions = {
    controller: 'Controller layer - handles HTTP request/response, calls services',
    service: 'Service layer - contains business logic, orchestrates operations',
    db_service: 'Database service layer - direct database queries via Knex',
    route: 'Route definition - maps HTTP endpoints to controller functions',
    middleware: 'Middleware - request processing, authentication, validation',
    schema: 'Validation schema - Joi schemas for request validation',
    util: 'Utility module - shared helper functions',
    error: 'Error handling - custom error classes and handlers',
    config: 'Configuration - app settings, constants, environment config',
    other: 'Application code',
  };
  return descriptions[layer] || descriptions.other;
}

/**
 * Build a rich contextual prefix for embedding (Anthropic Contextual Retrieval approach).
 * This context helps the embedding model understand the architectural role of the code.
 * 
 * @param {object} chunk - The chunk object with metadata
 * @param {object} fileData - The parsed file data (for imports info)
 * @returns {string} - Rich context prefix
 */
function buildContextualPrefix(chunk, fileData) {
  const parts = [];

  // 1. File location and architectural context
  parts.push(`FILE: ${chunk.filePath}`);
  parts.push(`MODULE: ${chunk.module} | LAYER: ${chunk.layer}`);
  parts.push(`ROLE: ${getLayerDescription(chunk.layer)}`);

  // 2. Function/class information
  if (chunk.functionName) {
    const funcType = chunk.isAsync ? 'Async function' : 'Function';
    const exportStatus = chunk.isExported ? 'exported' : 'internal';
    parts.push(`SYMBOL: ${funcType} "${chunk.functionName}" (${exportStatus})`);
  } else if (chunk.symbolType === 'class') {
    parts.push(`SYMBOL: Class definition`);
  } else {
    parts.push(`SYMBOL: Module-level code`);
  }

  // 3. Key dependencies (what this file imports)
  if (fileData && fileData.imports && fileData.imports.length > 0) {
    const keyImports = fileData.imports
      .filter(imp => imp.resolved && !imp.raw.includes('node_modules'))
      .slice(0, 5)
      .map(imp => {
        const shortPath = imp.resolved.split('/').slice(-2).join('/');
        return shortPath;
      });
    if (keyImports.length > 0) {
      parts.push(`IMPORTS: ${keyImports.join(', ')}`);
    }
  }

  // 4. Route handler indicator
  if (chunk.isRouteHandler) {
    parts.push(`TYPE: Route handler - processes HTTP requests`);
  }

  // 5. Business description (will be added later by Claude)
  // This is a placeholder that gets replaced with the actual description
  parts.push(`PURPOSE: {{DESCRIPTION}}`);

  return parts.join('\n');
}

/**
 * Build the full text for embedding with contextual prefix.
 * Format follows Anthropic's Contextual Retrieval best practices.
 * 
 * @param {object} chunk - The chunk object
 * @param {string} description - The NL description from Claude
 * @param {object} fileData - The parsed file data
 * @returns {string} - Full contextualized text for embedding
 */
function buildTextForEmbedding(chunk, description, fileData) {
  const contextPrefix = buildContextualPrefix(chunk, fileData)
    .replace('{{DESCRIPTION}}', description);

  // Format: Context block + separator + code
  return `/*
CONTEXT:
${contextPrefix}
*/

${chunk.code}`;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Read a source file and extract the import block (all require/import lines
 * at the top of the file).
 */
function extractImportBlock(source) {
  const lines = source.split('\n');
  const importLines = [];
  let pastImports = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip 'use strict', empty lines, and comments at the top
    if (!pastImports && (
      trimmed === '' ||
      trimmed === "'use strict';" ||
      trimmed === '"use strict";' ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    )) {
      continue;
    }

    // Detect require/import lines
    if (
      trimmed.includes('require(') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('const {') && trimmed.includes('require(') ||
      (importLines.length > 0 && !pastImports && (
        trimmed.startsWith('}') && trimmed.includes('require(') ||
        trimmed === ''
      ))
    ) {
      importLines.push(line);
      continue;
    }

    // Multi-line require continuations
    if (!pastImports && importLines.length > 0 && (
      trimmed.endsWith(',') ||
      trimmed.startsWith('}') ||
      /^[a-zA-Z_$]/.test(trimmed) && trimmed.includes('= require(')
    )) {
      importLines.push(line);
      continue;
    }

    pastImports = true;
    break;
  }

  return importLines.join('\n');
}

/**
 * Truncate import block for embedding purposes (Fix 3).
 * Keeps the most relevant imports within the character budget.
 */
function truncateImportBlock(importBlock, maxChars) {
  if (importBlock.length <= maxChars) return importBlock;

  const lines = importBlock.split('\n');
  let result = '';

  for (const line of lines) {
    if ((result + '\n' + line).length > maxChars) {
      result += '\n// ... more imports';
      break;
    }
    result += (result ? '\n' : '') + line;
  }

  return result;
}

/**
 * Extract surrounding context lines for a function (Fix 5).
 * Captures JSDoc comments above and module.exports references below.
 */
function getSurroundingContext(lines, startLine, endLine) {
  const above = [];
  const below = [];

  // Lines above: capture JSDoc comments and related annotations
  for (let i = Math.max(0, startLine - 1 - CONTEXT_LINES_ABOVE); i < startLine - 1; i++) {
    const trimmed = lines[i].trim();
    // Include JSDoc comments, regular comments, decorators
    if (trimmed.startsWith('/**') || trimmed.startsWith('*') ||
        trimmed.startsWith('//') || trimmed.startsWith('/*') ||
        trimmed === '') {
      above.push(lines[i]);
    }
  }

  // Lines below: capture closing brackets, module.exports, etc.
  for (let i = endLine; i < Math.min(lines.length, endLine + CONTEXT_LINES_BELOW); i++) {
    const trimmed = lines[i].trim();
    if (trimmed && trimmed !== '},' && trimmed !== '}') {
      below.push(lines[i]);
    }
  }

  return {
    above: above.join('\n'),
    below: below.join('\n'),
  };
}

/**
 * Chunk a single file based on its parsed function/class data.
 */
function chunkFile(filePath, fileData, source) {
  const chunks = [];
  const lines = source.split('\n');
  const importBlock = extractImportBlock(source);
  const truncatedImports = truncateImportBlock(importBlock, MAX_IMPORT_BLOCK_CHARS);
  const functions = fileData.functions || [];
  const classes = fileData.classes || [];

  // Metadata for all chunks from this file (Fix 6)
  const module = getModule(filePath);
  const layer = getLayer(filePath);
  const isRoute = isRouteFile(filePath, fileData);

  // Combine functions and classes, sort by startLine
  const symbols = [
    ...functions.map(f => ({ ...f, symbolType: 'function' })),
    ...classes.map(c => ({ ...c, symbolType: 'class' })),
  ].sort((a, b) => a.startLine - b.startLine);

  if (symbols.length === 0) {
    // No functions or classes — chunk the whole file
    const code = source.trim();
    if (code.length > 0) {
      chunks.push({
        id: `${filePath}#module`,
        filePath,
        functionName: null,
        code,
        startLine: 1,
        endLine: lines.length,
        module,
        layer,
        isRouteHandler: isRoute,
      });
    }
    return chunks;
  }

  // Track which lines are covered by symbols
  const coveredLines = new Set();
  for (const sym of symbols) {
    for (let i = sym.startLine; i <= sym.endLine; i++) {
      coveredLines.add(i);
    }
  }

  // Extract preamble (module-level code between imports and first function)
  const firstSymbolLine = symbols[0].startLine;
  let preambleStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.includes('require(') &&
        trimmed !== "'use strict';" && trimmed !== '"use strict";' &&
        !trimmed.startsWith('/*') && !trimmed.startsWith('*') &&
        !trimmed.startsWith('import ')) {
      preambleStart = i + 1;
      break;
    }
  }

  const preambleLines = [];
  for (let i = preambleStart; i < firstSymbolLine - 1; i++) {
    if (!coveredLines.has(i + 1)) {
      preambleLines.push(lines[i]);
    }
  }

  const preambleCode = preambleLines.join('\n').trim();
  if (preambleCode.length > 50) {
    chunks.push({
      id: `${filePath}#preamble`,
      filePath,
      functionName: null,
      code: truncatedImports + '\n\n' + preambleCode,
      startLine: preambleStart,
      endLine: firstSymbolLine - 1,
      module,
      layer,
      isRouteHandler: false,
    });
  }

  // Create a chunk for each function/class
  for (const sym of symbols) {
    // Get surrounding context (Fix 5)
    const context = getSurroundingContext(lines, sym.startLine, sym.endLine);

    const codeLines = lines.slice(sym.startLine - 1, sym.endLine);
    let code = codeLines.join('\n').trim();

    // Prepend JSDoc context if present
    if (context.above.trim()) {
      code = context.above.trim() + '\n' + code;
    }

    if (code.length === 0) continue;

    // Full code chunk: imports + surrounding context + function body
    const fullCode = truncatedImports + '\n\n' + code;

    const name = sym.name || `chunk_${sym.startLine}`;

    // Determine if this specific function is a route handler
    const isHandler = isRoute && layer === 'route' ? false :
      (layer === 'controller' && sym.isExported);

    chunks.push({
      id: `${filePath}#${name}`,
      filePath,
      functionName: sym.name,
      code: fullCode,
      startLine: sym.startLine,
      endLine: sym.endLine,
      isExported: sym.isExported || false,
      isAsync: sym.isAsync || false,
      symbolType: sym.symbolType,
      module,
      layer,
      isRouteHandler: isHandler,
    });
  }

  return chunks;
}

/**
 * Generate chunks for the entire codebase.
 */
function generateAllChunks(parsedFiles) {
  console.log('[chunk] generating AST-aware chunks...');
  const allChunks = [];
  let skipped = 0;

  for (const [filePath, fileData] of Object.entries(parsedFiles)) {
    const absolutePath = fileData.absolutePath;

    let source;
    try {
      source = fs.readFileSync(absolutePath, 'utf-8');
    } catch (err) {
      console.error(`[chunk] could not read ${absolutePath}: ${err.message}`);
      skipped++;
      continue;
    }

    const fileChunks = chunkFile(filePath, fileData, source);
    allChunks.push(...fileChunks);
  }

  console.log(`[chunk] generated ${allChunks.length} chunks from ${Object.keys(parsedFiles).length} files (${skipped} skipped)`);

  // Stats
  const sizes = allChunks.map(c => c.code.length);
  const avgSize = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
  const maxSize = Math.max(...sizes);
  const minSize = Math.min(...sizes);
  console.log(`[chunk] sizes: avg=${avgSize} chars, min=${minSize}, max=${maxSize}`);

  const oversized = allChunks.filter(c => c.code.length > MAX_CHUNK_CHARS).length;
  if (oversized > 0) {
    console.log(`[chunk] ${oversized} chunks exceed ${MAX_CHUNK_CHARS} chars (kept whole — never split mid-function)`);
  }

  // Metadata stats (Fix 6)
  const layerCounts = {};
  const moduleCounts = {};
  for (const chunk of allChunks) {
    layerCounts[chunk.layer] = (layerCounts[chunk.layer] || 0) + 1;
    moduleCounts[chunk.module] = (moduleCounts[chunk.module] || 0) + 1;
  }
  console.log(`[chunk] by module: ${Object.entries(moduleCounts).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  console.log(`[chunk] by layer: ${Object.entries(layerCounts).map(([k, v]) => `${k}:${v}`).join(', ')}`);

  return allChunks;
}

// ---------------------------------------------------------------------------
// NL Description Generation
// ---------------------------------------------------------------------------

async function generateDescriptions(batch, batchIndex = 0) {
  // Build code snippets with simple numeric IDs for reliable mapping
  const chunkIds = batch.map(c => c.id);
  const codeSnippets = batch.map((chunk, idx) => {
    const code = chunk.code.length > 1500
      ? chunk.code.slice(0, 1500) + '\n// ... (truncated)'
      : chunk.code;

    return `[${idx + 1}] File: ${chunk.filePath}${chunk.functionName ? ` | Function: ${chunk.functionName}` : ''} | Layer: ${chunk.layer}
\`\`\`javascript
${code}
\`\`\``;
  }).join('\n\n');

  const prompt = `You are a code documentation assistant. For each code chunk below, write ONE short sentence (max 15 words) describing what it does in plain English. Focus on the business purpose, not implementation details.

Return descriptions in this EXACT format - one per line with the chunk number:
[1] <description for chunk 1>
[2] <description for chunk 2>
...and so on

Example:
[1] Authenticates users via OAuth and returns JWT tokens
[2] Validates credit limit request payload using Joi schema
[3] Fetches organisation details by ID from the database

${codeSnippets}`;

  try {
    const response = await anthropic.messages.create({
      model: DESCRIPTION_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    
    // Parse responses by numeric index for reliable matching
    // Expected format: [1] description, [2] description, etc.
    const descriptionsByIndex = new Map();
    const lines = text.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      // Try multiple numeric formats:
      // Format 1: [1] description
      // Format 2: 1. description
      // Format 3: 1) description
      // Format 4: **1.** description
      
      let match = line.match(/^\[(\d+)\]\s*(.+)/);
      if (!match) {
        match = line.match(/^\*?\*?(\d+)[\.\)]\*?\*?\s*(.+)/);
      }
      
      if (match) {
        const idx = parseInt(match[1], 10);
        const desc = match[2].trim();
        if (idx >= 1 && idx <= batch.length && desc.length > 5) {
          descriptionsByIndex.set(idx, desc);
        }
      }
    }

    // Map descriptions back to batch order by index
    const descriptions = batch.map((chunk, idx) => {
      const desc = descriptionsByIndex.get(idx + 1); // 1-indexed
      if (desc) {
        return desc;
      }
      // Fallback if index not found in response
      if (chunk.functionName) {
        return `${chunk.isAsync ? 'Async f' : 'F'}unction ${chunk.functionName} in ${path.basename(chunk.filePath)}`;
      }
      return `Code from ${path.basename(chunk.filePath)}`;
    });

    const matched = descriptionsByIndex.size;
    if (matched < batch.length) {
      console.warn(`[chunk] matched ${matched}/${batch.length} descriptions by index`);
      // Debug: show first few lines of Claude's response when matching fails
      if (matched === 0 && process.env.DEBUG_DESCRIPTIONS) {
        console.warn(`[chunk] DEBUG - Claude response (first 500 chars):\n${text.slice(0, 500)}`);
      }
    }

    // Log API call for debugging
    logApiCall(batchIndex, chunkIds, prompt, text, matched, batch.length);

    return descriptions;
  } catch (err) {
    console.error(`[chunk] Claude API error: ${err.message}`);
    return batch.map(chunk => {
      if (chunk.functionName) {
        return `${chunk.isAsync ? 'Async f' : 'F'}unction ${chunk.functionName} in ${path.basename(chunk.filePath)}`;
      }
      return `Code from ${path.basename(chunk.filePath)}`;
    });
  }
}

/**
 * Generate descriptions and build contextualized embeddings for all chunks.
 * 
 * @param {object[]} chunks - Array of chunk objects
 * @param {object} parsedFiles - The full parsed files object (for import info)
 */
async function describeAllChunks(chunks, parsedFiles = {}) {
  console.log(`[chunk] generating NL descriptions for ${chunks.length} chunks...`);
  console.log(`[chunk] batch size: ${DESCRIPTION_BATCH_SIZE}, estimated API calls: ${Math.ceil(chunks.length / DESCRIPTION_BATCH_SIZE)}`);
  console.log(`[chunk] using enhanced contextual embeddings (Anthropic Contextual Retrieval approach)`);

  // Initialize API logging if enabled
  initApiLog();

  let described = 0;
  let batchIndex = 0;

  for (let i = 0; i < chunks.length; i += DESCRIPTION_BATCH_SIZE) {
    const batch = chunks.slice(i, i + DESCRIPTION_BATCH_SIZE);
    const descriptions = await generateDescriptions(batch, batchIndex);
    batchIndex++;

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const description = descriptions[j];
      const fileData = parsedFiles[chunk.filePath] || {};

      chunk.description = description;
      
      // Build rich contextual text for embedding (Contextual Retrieval)
      chunk.textForEmbedding = buildTextForEmbedding(chunk, description, fileData);
      
      // Also store a simplified context for BM25 (without code block formatting)
      chunk.contextualText = `${chunk.filePath} ${chunk.module} ${chunk.layer} ${chunk.functionName || ''} ${description}`;
    }

    described += batch.length;
    const pct = Math.round((described / chunks.length) * 100);
    process.stdout.write(`\r[chunk] described: ${described}/${chunks.length} (${pct}%)`);

    if (i + DESCRIPTION_BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
    }
  }

  // Close API log
  closeApiLog();

  console.log('');
  console.log(`[chunk] all descriptions and contextual embeddings generated`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function chunkAndDescribe() {
  console.log('[chunk] starting chunk-and-describe pipeline...');
  console.log(`[chunk] config: model=${DESCRIPTION_MODEL}, batch=${DESCRIPTION_BATCH_SIZE}, maxChunks=${MAX_CHUNKS || 'unlimited'}`);

  if (!fs.existsSync(PARSED_FILES_PATH)) {
    throw new Error(`parsed-files.json not found at ${PARSED_FILES_PATH}. Run parse-codebase.js first.`);
  }
  const parsedFiles = JSON.parse(fs.readFileSync(PARSED_FILES_PATH, 'utf-8'));

  // Step 1: Generate AST-aware chunks
  let chunks = generateAllChunks(parsedFiles);

  // Apply MAX_CHUNKS limit if set (for testing)
  if (MAX_CHUNKS > 0 && chunks.length > MAX_CHUNKS) {
    console.log(`[chunk] limiting to ${MAX_CHUNKS} chunks (from ${chunks.length}) for testing`);
    chunks = chunks.slice(0, MAX_CHUNKS);
  }

  // Step 2: Generate NL descriptions and contextual embeddings via Claude
  initAnthropic();
  await describeAllChunks(chunks, parsedFiles);

  // Step 3: Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(chunks, null, 2));
  console.log(`[chunk] output written to ${OUTPUT_PATH}`);
  console.log(`[chunk] total chunks: ${chunks.length}`);

  return chunks;
}

// ---------------------------------------------------------------------------
// Incremental chunk-and-describe
// ---------------------------------------------------------------------------

/**
 * Incremental version of chunk-and-describe.
 * Only re-chunks and re-describes files that changed.
 * 
 * @param {string[]} changedFiles - Relative paths of files that were added/modified
 * @param {string[]} deletedFiles - Relative paths of files that were deleted
 * @returns {{ chunks: object[], oldChunkIds: string[] }}
 */
async function chunkAndDescribeIncremental(changedFiles, deletedFiles) {
  console.log('[chunk] starting incremental chunk-and-describe...');
  console.log(`[chunk] changed files: ${changedFiles.length}, deleted files: ${deletedFiles.length}`);

  // Load existing chunks
  let existingChunks = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existingChunks = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
      console.log(`[chunk] loaded ${existingChunks.length} existing chunks`);
    } catch (err) {
      console.warn(`[chunk] could not load existing chunks: ${err.message}`);
    }
  }

  // Collect all affected files
  const affectedFiles = new Set([...changedFiles, ...deletedFiles]);

  // Collect old chunk IDs that need to be deleted from Qdrant
  const oldChunkIds = [];
  const preservedChunks = [];

  for (const chunk of existingChunks) {
    if (affectedFiles.has(chunk.filePath)) {
      oldChunkIds.push(chunk.id);
    } else {
      preservedChunks.push(chunk);
    }
  }

  console.log(`[chunk] removing ${oldChunkIds.length} old chunks from affected files`);
  console.log(`[chunk] preserving ${preservedChunks.length} unchanged chunks`);

  // If no changed files, just write and return
  if (changedFiles.length === 0) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(preservedChunks, null, 2));
    console.log(`[chunk] no changed files to process`);
    return { chunks: preservedChunks, oldChunkIds };
  }

  // Load parsed files to get info for changed files
  if (!fs.existsSync(PARSED_FILES_PATH)) {
    throw new Error(`parsed-files.json not found at ${PARSED_FILES_PATH}. Run parse step first.`);
  }
  const parsedFiles = JSON.parse(fs.readFileSync(PARSED_FILES_PATH, 'utf-8'));

  // Generate new chunks only for changed files
  const newChunks = [];
  let skipped = 0;

  for (const filePath of changedFiles) {
    const fileData = parsedFiles[filePath];
    if (!fileData) {
      console.warn(`[chunk] no parsed data for ${filePath}`);
      skipped++;
      continue;
    }

    const absolutePath = fileData.absolutePath;
    let source;
    try {
      source = fs.readFileSync(absolutePath, 'utf-8');
    } catch (err) {
      console.error(`[chunk] could not read ${absolutePath}: ${err.message}`);
      skipped++;
      continue;
    }

    const fileChunks = chunkFile(filePath, fileData, source);
    newChunks.push(...fileChunks);
  }

  console.log(`[chunk] generated ${newChunks.length} new chunks from ${changedFiles.length} changed files (${skipped} skipped)`);

  // Generate descriptions and contextual embeddings only for new chunks
  if (newChunks.length > 0) {
    initAnthropic();
    await describeAllChunks(newChunks, parsedFiles);
  }

  // Merge preserved + new chunks
  const allChunks = [...preservedChunks, ...newChunks];

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2));
  console.log(`[chunk] output written to ${OUTPUT_PATH}`);
  console.log(`[chunk] total chunks: ${allChunks.length}`);

  return { chunks: allChunks, oldChunkIds, newChunks };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { chunkAndDescribe, chunkAndDescribeIncremental, generateAllChunks };

if (require.main === module) {
  chunkAndDescribe().catch(err => {
    console.error('[chunk] fatal error:', err);
    process.exit(1);
  });
}
