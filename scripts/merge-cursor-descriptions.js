'use strict';

/**
 * merge-cursor-descriptions.js
 * 
 * Merges Cursor-generated description files back into chunks.json.
 * Reads descriptions-part-X.json files from cursor-batches/, matches by chunk ID,
 * and updates description + textForEmbedding fields.
 * 
 * Usage: node scripts/merge-cursor-descriptions.js
 */

const fs = require('fs');
const path = require('path');

const CHUNKS_PATH = path.join(__dirname, '..', 'index', 'chunks.json');
const BATCHES_DIR = path.join(__dirname, 'cursor-batches');

// Load chunks
const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
console.log(`Loaded ${chunks.length} chunks`);

// Build lookup map
const chunkMap = new Map();
for (let i = 0; i < chunks.length; i++) {
  chunkMap.set(chunks[i].id, i);
}

// Find all description files
const descFiles = fs.readdirSync(BATCHES_DIR)
  .filter(f => f.startsWith('descriptions-part-') && f.endsWith('.json'))
  .sort();

if (descFiles.length === 0) {
  console.error('No descriptions-part-X.json files found in', BATCHES_DIR);
  process.exit(1);
}

let updated = 0;
let notFound = 0;
let skipped = 0;

for (const file of descFiles) {
  const filePath = path.join(BATCHES_DIR, file);
  let descriptions;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    // Handle both clean JSON and markdown-wrapped JSON
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    descriptions = JSON.parse(cleaned);
  } catch (err) {
    console.error(`Failed to parse ${file}: ${err.message}`);
    continue;
  }

  if (!Array.isArray(descriptions)) {
    console.error(`${file} is not an array`);
    continue;
  }

  for (const item of descriptions) {
    if (!item.id || !item.description) {
      skipped++;
      continue;
    }

    const idx = chunkMap.get(item.id);
    if (idx !== undefined) {
      chunks[idx].description = item.description;
      chunks[idx].textForEmbedding = `// ${item.description}\n${chunks[idx].code}`;
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(`  ${file}: ${descriptions.length} entries`);
}

// Save updated chunks
fs.writeFileSync(CHUNKS_PATH, JSON.stringify(chunks, null, 2));
console.log(`\nResults: ${updated} updated, ${notFound} IDs not found, ${skipped} skipped`);
console.log(`Saved to ${CHUNKS_PATH}`);
console.log(`\nNext: node indexer/embed-and-store.js`);
