'use strict';

/**
 * split-chunks.js
 * 
 * Splits chunks.json into 5 smaller files (~1000 chunks each)
 * for manual description generation in Cursor.
 * 
 * Each output file contains a simplified format:
 *   [{ id, filePath, functionName, code_preview }, ...]
 * 
 * Code is truncated to 800 chars to keep file sizes manageable.
 * 
 * Usage: node scripts/split-chunks.js
 * Output: scripts/cursor-batches/chunks-part-1.json ... chunks-part-5.json
 */

const fs = require('fs');
const path = require('path');

const CHUNKS_PATH = path.join(__dirname, '..', 'index', 'chunks.json');
const OUTPUT_DIR = path.join(__dirname, 'cursor-batches');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
console.log(`Loaded ${chunks.length} chunks`);

const PARTS = 5;
const partSize = Math.ceil(chunks.length / PARTS);

for (let p = 0; p < PARTS; p++) {
  const start = p * partSize;
  const end = Math.min(start + partSize, chunks.length);
  const batch = chunks.slice(start, end);

  const simplified = batch.map(chunk => ({
    id: chunk.id,
    filePath: chunk.filePath,
    functionName: chunk.functionName || null,
    module: chunk.module || null,
    layer: chunk.layer || null,
    code: chunk.code.length > 800 ? chunk.code.slice(0, 800) + '\n// ... truncated' : chunk.code,
  }));

  const filename = `chunks-part-${p + 1}.json`;
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(simplified, null, 2));

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ${filename}: ${batch.length} chunks (${sizeMB} MB)`);
}

console.log(`\nOutput: ${OUTPUT_DIR}/`);
console.log('Next: use the Cursor prompt for each part file');
