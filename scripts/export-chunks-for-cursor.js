'use strict';

/**
 * export-chunks-for-cursor.js
 * 
 * Exports chunks in batches as markdown files that can be pasted into Cursor
 * for NL description generation. Each batch file contains 20 chunks with
 * instructions for Cursor to generate descriptions.
 * 
 * Usage:
 *   node scripts/export-chunks-for-cursor.js [--batches=10]
 * 
 * Output: scripts/cursor-batches/batch-001.md, batch-002.md, etc.
 */

const fs = require('fs');
const path = require('path');

const CHUNKS_PATH = path.join(__dirname, '..', 'index', 'chunks.json');
const OUTPUT_DIR = path.join(__dirname, 'cursor-batches');
const BATCH_SIZE = 20;

// Parse args
const args = process.argv.slice(2);
let maxBatches = 10;
for (const arg of args) {
  if (arg.startsWith('--batches=')) maxBatches = parseInt(arg.split('=')[1]);
}

// Load chunks
const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
console.log(`Loaded ${chunks.length} chunks`);

// Create output dir
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Export batches
const totalBatches = Math.min(maxBatches, Math.ceil(chunks.length / BATCH_SIZE));

for (let b = 0; b < totalBatches; b++) {
  const start = b * BATCH_SIZE;
  const batch = chunks.slice(start, start + BATCH_SIZE);

  let md = `# Batch ${b + 1}/${totalBatches} — Generate NL Descriptions\n\n`;
  md += `For each code chunk below, write ONE short sentence (max 15 words) describing what it does in **plain English business terms**. Focus on the business purpose, not implementation details.\n\n`;
  md += `Return ONLY a JSON array with exactly ${batch.length} objects in this format:\n`;
  md += '```json\n[\n  { "id": "chunk_id_here", "description": "One sentence description here" },\n  ...\n]\n```\n\n';
  md += `---\n\n`;

  for (let i = 0; i < batch.length; i++) {
    const chunk = batch[i];
    // Truncate code for readability
    const code = chunk.code.length > 800
      ? chunk.code.slice(0, 800) + '\n// ... (truncated)'
      : chunk.code;

    md += `### Chunk ${i + 1}: \`${chunk.id}\`\n`;
    md += `File: ${chunk.filePath}${chunk.functionName ? ` | Function: ${chunk.functionName}` : ''}\n\n`;
    md += '```javascript\n' + code + '\n```\n\n';
  }

  const filename = `batch-${String(b + 1).padStart(3, '0')}.md`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), md);
}

// Also create a merge template
const idsFile = [];
for (let b = 0; b < totalBatches; b++) {
  const start = b * BATCH_SIZE;
  const batch = chunks.slice(start, start + BATCH_SIZE);
  for (const chunk of batch) {
    idsFile.push({ id: chunk.id, description: chunk.description });
  }
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'current-descriptions.json'),
  JSON.stringify(idsFile, null, 2)
);

console.log(`\nExported ${totalBatches} batches to ${OUTPUT_DIR}/`);
console.log(`Each batch has ${BATCH_SIZE} chunks.`);
console.log(`\nWorkflow:`);
console.log(`  1. Open each batch-XXX.md in Cursor`);
console.log(`  2. Ask Cursor to generate descriptions following the instructions`);
console.log(`  3. Save each JSON response to cursor-batches/response-XXX.json`);
console.log(`  4. Run: node scripts/merge-cursor-descriptions.js`);
