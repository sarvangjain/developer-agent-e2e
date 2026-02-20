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

/** Max characters for import block in textForEmbedding (Fix 3) */
const MAX_IMPORT_BLOCK_CHARS = 500;

/** Lines of surrounding context to include above/below each function (Fix 5) */
const CONTEXT_LINES_ABOVE = 3;
const CONTEXT_LINES_BELOW = 2;

/** Max characters per chunk before we consider splitting further */
const MAX_CHUNK_CHARS = 2000;

/** Batch size for NL description generation (chunks per API call) */
const DESCRIPTION_BATCH_SIZE = 20;

/** Delay between API calls to avoid rate limiting (ms) */
const API_DELAY_MS = 500;

/** Model for description generation */
const DESCRIPTION_MODEL = 'claude-sonnet-4-20250514';

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

async function generateDescriptions(batch) {
  const codeSnippets = batch.map((chunk, i) => {
    const code = chunk.code.length > 1500
      ? chunk.code.slice(0, 1500) + '\n// ... (truncated)'
      : chunk.code;

    return `[CHUNK ${i + 1}] File: ${chunk.filePath}${chunk.functionName ? ` | Function: ${chunk.functionName}` : ''} | Layer: ${chunk.layer}
\`\`\`javascript
${code}
\`\`\``;
  }).join('\n\n');

  const prompt = `You are a code documentation assistant. For each code chunk below, write ONE short sentence (max 15 words) describing what it does in plain English. Focus on the business purpose, not implementation details.

Return ONLY a numbered list with one description per chunk. No other text.

Example output format:
1. Authenticates users via OAuth and returns JWT tokens
2. Validates credit limit request payload using Joi schema
3. Fetches organisation details by ID from the database

${codeSnippets}`;

  try {
    const response = await anthropic.messages.create({
      model: DESCRIPTION_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const descriptions = [];
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^\d+[\.\)]\s*(.+)/);
      if (match) {
        descriptions.push(match[1].trim());
      }
    }

    if (descriptions.length !== batch.length) {
      console.warn(`[chunk] description count mismatch: got ${descriptions.length}, expected ${batch.length}. Using fallback.`);
      while (descriptions.length < batch.length) {
        descriptions.push('Code chunk from ' + batch[descriptions.length]?.filePath || 'unknown file');
      }
    }

    return descriptions.slice(0, batch.length);
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

async function describeAllChunks(chunks) {
  console.log(`[chunk] generating NL descriptions for ${chunks.length} chunks...`);
  console.log(`[chunk] batch size: ${DESCRIPTION_BATCH_SIZE}, estimated API calls: ${Math.ceil(chunks.length / DESCRIPTION_BATCH_SIZE)}`);

  let described = 0;

  for (let i = 0; i < chunks.length; i += DESCRIPTION_BATCH_SIZE) {
    const batch = chunks.slice(i, i + DESCRIPTION_BATCH_SIZE);
    const descriptions = await generateDescriptions(batch);

    for (let j = 0; j < batch.length; j++) {
      batch[j].description = descriptions[j];
      batch[j].textForEmbedding = `// ${descriptions[j]}\n${batch[j].code}`;
    }

    described += batch.length;
    const pct = Math.round((described / chunks.length) * 100);
    process.stdout.write(`\r[chunk] described: ${described}/${chunks.length} (${pct}%)`);

    if (i + DESCRIPTION_BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
    }
  }

  console.log('');
  console.log(`[chunk] all descriptions generated`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function chunkAndDescribe() {
  console.log('[chunk] starting chunk-and-describe pipeline...');

  if (!fs.existsSync(PARSED_FILES_PATH)) {
    throw new Error(`parsed-files.json not found at ${PARSED_FILES_PATH}. Run parse-codebase.js first.`);
  }
  const parsedFiles = JSON.parse(fs.readFileSync(PARSED_FILES_PATH, 'utf-8'));

  // Step 1: Generate AST-aware chunks
  const chunks = generateAllChunks(parsedFiles);

  // Step 2: Generate NL descriptions via Claude
  initAnthropic();
  await describeAllChunks(chunks);

  // Step 3: Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(chunks, null, 2));
  console.log(`[chunk] output written to ${OUTPUT_PATH}`);
  console.log(`[chunk] total chunks: ${chunks.length}`);

  return chunks;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { chunkAndDescribe, generateAllChunks };

if (require.main === module) {
  chunkAndDescribe().catch(err => {
    console.error('[chunk] fatal error:', err);
    process.exit(1);
  });
}
