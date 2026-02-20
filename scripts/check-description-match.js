'use strict';

/**
 * Quick check: do chunk IDs in description files match current chunks.json?
 */

const fs = require('fs');
const path = require('path');

const CHUNKS_PATH = path.join(__dirname, '..', 'index', 'chunks.json');
const BATCHES_DIR = path.join(__dirname, 'cursor-batches');

const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
const chunkIds = new Set(chunks.map(c => c.id));
console.log(`chunks.json: ${chunks.length} chunks`);

let totalDescs = 0;
let matched = 0;
let unmatched = 0;

for (let i = 1; i <= 5; i++) {
  const file = path.join(BATCHES_DIR, `descriptions-part-${i}.json`);
  if (!fs.existsSync(file)) { console.log(`  part-${i}: MISSING`); continue; }

  const descs = JSON.parse(fs.readFileSync(file, 'utf-8'));
  let partMatched = 0;
  let partUnmatched = 0;

  for (const d of descs) {
    if (chunkIds.has(d.id)) partMatched++;
    else partUnmatched++;
  }

  totalDescs += descs.length;
  matched += partMatched;
  unmatched += partUnmatched;
  console.log(`  part-${i}: ${descs.length} descriptions, ${partMatched} matched, ${partUnmatched} unmatched`);
}

console.log(`\nTotal: ${totalDescs} descriptions, ${matched} matched, ${unmatched} unmatched`);
console.log(`Coverage: ${(matched / chunks.length * 100).toFixed(1)}% of chunks have Cursor descriptions`);
