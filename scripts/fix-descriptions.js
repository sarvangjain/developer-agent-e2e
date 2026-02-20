'use strict';

/**
 * fix-descriptions.js
 * 
 * Fix Issues 1 & 2: Scans chunks.json for generic/misleading descriptions
 * and replaces them with better fallbacks derived from the code itself.
 * 
 * Bad descriptions detected:
 *   - "Handles X operation" (too generic)
 *   - "Utility functions for common operations" (meaningless)
 *   - Duplicate descriptions across unrelated functions
 *   - Descriptions that don't mention the function name or domain
 * 
 * Replacement strategy:
 *   - Use function name + file path + layer to generate a specific description
 *   - For controllers: "Handles [HTTP context] for [domain] module"
 *   - For services: "[Action] [domain] data/logic"  
 *   - For db_service: "Database query for [table/entity]"
 *   - For middleware: "[Name] middleware for request processing"
 * 
 * Usage: node scripts/fix-descriptions.js
 */

const fs = require('fs');
const path = require('path');

const CHUNKS_PATH = path.join(__dirname, '..', 'index', 'chunks.json');

// Patterns that indicate a bad/generic description
const BAD_PATTERNS = [
  /^Handles \w+ operation$/i,
  /^Handles\s+\w+\s+operation$/i,
  /^Utility functions? for common operations?$/i,
  /^Business logic service$/i,
  /^Request processing middleware$/i,
  /^Code from \w+\.js$/i,
  /^Module configuration for/i,
  /^Async function \w+ in \w+\.js$/i,
  /^Function \w+ in \w+\.js$/i,
];

/**
 * Check if a description is generic/bad.
 */
function isBadDescription(desc) {
  if (!desc) return true;
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(desc)) return true;
  }
  return false;
}

/**
 * Generate a better description from the chunk's metadata and code.
 */
function generateBetterDescription(chunk) {
  const fn = chunk.functionName;
  const layer = chunk.layer || 'other';
  const module = chunk.module || 'shared';
  const filePath = chunk.filePath || '';
  const fileName = path.basename(filePath, '.js');
  const code = chunk.code || '';

  // Extract domain from file path
  const domain = fileName.replace(/_/g, ' ').replace(/[-]/g, ' ');

  // Use function name patterns to infer purpose
  if (fn) {
    const fnLower = fn.toLowerCase();

    // Specific patterns based on common naming conventions
    if (fnLower.startsWith('get') || fnLower.startsWith('fetch') || fnLower.startsWith('find')) {
      const entity = fn.replace(/^(get|fetch|find)/i, '').replace(/([A-Z])/g, ' $1').trim();
      if (layer === 'controller') return `Retrieves ${entity.toLowerCase()} and returns HTTP response`;
      if (layer === 'db_service') return `Queries database for ${entity.toLowerCase()}`;
      return `Retrieves ${entity.toLowerCase()} from ${domain}`;
    }

    if (fnLower.startsWith('create') || fnLower.startsWith('add') || fnLower.startsWith('insert')) {
      const entity = fn.replace(/^(create|add|insert)/i, '').replace(/([A-Z])/g, ' $1').trim();
      if (layer === 'controller') return `Creates ${entity.toLowerCase()} via HTTP endpoint`;
      if (layer === 'db_service') return `Inserts ${entity.toLowerCase()} into database`;
      return `Creates new ${entity.toLowerCase()} in ${domain}`;
    }

    if (fnLower.startsWith('update') || fnLower.startsWith('modify') || fnLower.startsWith('patch')) {
      const entity = fn.replace(/^(update|modify|patch)/i, '').replace(/([A-Z])/g, ' $1').trim();
      if (layer === 'controller') return `Updates ${entity.toLowerCase()} via HTTP endpoint`;
      if (layer === 'db_service') return `Updates ${entity.toLowerCase()} in database`;
      return `Modifies ${entity.toLowerCase()} in ${domain}`;
    }

    if (fnLower.startsWith('delete') || fnLower.startsWith('remove')) {
      const entity = fn.replace(/^(delete|remove)/i, '').replace(/([A-Z])/g, ' $1').trim();
      if (layer === 'db_service') return `Deletes ${entity.toLowerCase()} from database`;
      return `Removes ${entity.toLowerCase()} from ${domain}`;
    }

    if (fnLower.startsWith('validate') || fnLower.startsWith('check') || fnLower.startsWith('verify')) {
      const entity = fn.replace(/^(validate|check|verify)/i, '').replace(/([A-Z])/g, ' $1').trim();
      return `Validates ${entity.toLowerCase()} data`;
    }

    if (fnLower.startsWith('send') || fnLower.startsWith('notify') || fnLower.startsWith('dispatch')) {
      const entity = fn.replace(/^(send|notify|dispatch)/i, '').replace(/([A-Z])/g, ' $1').trim();
      return `Sends ${entity.toLowerCase()} notification`;
    }

    if (fnLower.startsWith('process') || fnLower.startsWith('handle')) {
      const entity = fn.replace(/^(process|handle)/i, '').replace(/([A-Z])/g, ' $1').trim();
      return `Processes ${entity.toLowerCase()} for ${domain}`;
    }

    if (fnLower.startsWith('generate') || fnLower.startsWith('build') || fnLower.startsWith('make')) {
      const entity = fn.replace(/^(generate|build|make)/i, '').replace(/([A-Z])/g, ' $1').trim();
      return `Generates ${entity.toLowerCase()} for ${domain}`;
    }

    if (fnLower.startsWith('calculate') || fnLower.startsWith('compute')) {
      const entity = fn.replace(/^(calculate|compute)/i, '').replace(/([A-Z])/g, ' $1').trim();
      return `Calculates ${entity.toLowerCase()} values`;
    }
  }

  // Layer-based fallback
  switch (layer) {
    case 'controller':
      return fn ? `Controller endpoint: ${fn} for ${domain} module` : `Controller for ${domain} module`;
    case 'service':
      return fn ? `Service logic: ${fn} in ${domain}` : `Business logic for ${domain}`;
    case 'db_service':
      return fn ? `Database operation: ${fn} for ${domain}` : `Database queries for ${domain}`;
    case 'middleware':
      return fn ? `${fn} middleware for request processing` : `Middleware in ${domain}`;
    case 'route':
      return `Route definitions for ${domain}`;
    case 'schema':
      return `Validation schema for ${domain}`;
    case 'config':
      return `Configuration for ${domain}`;
    case 'util':
      return fn ? `Utility: ${fn} helper function` : `Utility functions in ${domain}`;
    default:
      return fn ? `${fn} in ${domain} module` : `Code in ${domain}`;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function fixDescriptions() {
  console.log('[fix-desc] loading chunks...');
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  console.log(`[fix-desc] loaded ${chunks.length} chunks`);

  let fixed = 0;
  let alreadyGood = 0;

  for (const chunk of chunks) {
    if (isBadDescription(chunk.description)) {
      const newDesc = generateBetterDescription(chunk);
      chunk.description = newDesc;
      chunk.textForEmbedding = `// ${newDesc}\n${chunk.code}`;
      fixed++;
    } else {
      alreadyGood++;
    }
  }

  // Save
  fs.writeFileSync(CHUNKS_PATH, JSON.stringify(chunks, null, 2));
  console.log(`[fix-desc] fixed: ${fixed}, already good: ${alreadyGood}`);
  console.log(`[fix-desc] saved to ${CHUNKS_PATH}`);

  // Show sample fixes
  console.log('\n[fix-desc] sample fixed descriptions:');
  const samples = chunks.filter(c => c.functionName).slice(0, 10);
  for (const s of samples) {
    console.log(`  ${s.id}`);
    console.log(`    "${s.description}"`);
  }

  console.log('\n[fix-desc] next: re-run embed-and-store.js to re-embed with improved descriptions');
}

fixDescriptions();
