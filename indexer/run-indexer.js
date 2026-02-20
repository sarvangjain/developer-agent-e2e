'use strict';

/**
 * run-indexer.js
 *
 * Orchestrator for the full indexing pipeline. Runs all steps in order:
 *   1. parse-codebase.js     → index/parsed-files.json
 *   2. build-symbol-map.js   → index/symbol-map.db
 *   3. build-repo-map.js     → index/repo-map.txt
 *   4. chunk-and-describe.js → index/chunks.json
 *   5. embed-and-store.js    → Qdrant collection
 *   6. bm25-client.js        → index/bm25-index.json
 *
 * Modes:
 *   --mode=full         Full re-index of the entire codebase
 *   --mode=incremental  Only re-index files changed since last index (via git diff)
 *
 * Usage:
 *   node indexer/run-indexer.js --mode=full
 *   node indexer/run-indexer.js --mode=incremental
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');

const LAST_INDEXED_PATH = path.join(config.projectRoot, 'index', '.last-indexed');

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let mode = 'full';

  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      mode = arg.split('=')[1];
    }
  }

  if (!['full', 'incremental'].includes(mode)) {
    console.error(`Invalid mode: ${mode}. Use --mode=full or --mode=incremental`);
    process.exit(1);
  }

  return { mode };
}

// ---------------------------------------------------------------------------
// Git diff for incremental mode
// ---------------------------------------------------------------------------

function getChangedFiles() {
  if (!fs.existsSync(LAST_INDEXED_PATH)) {
    console.log('[indexer] no .last-indexed found — falling back to full index');
    return null; // null means full index
  }

  const lastCommit = fs.readFileSync(LAST_INDEXED_PATH, 'utf-8').trim();
  console.log(`[indexer] last indexed commit: ${lastCommit}`);

  try {
    const diff = execSync(
      `git diff --name-only ${lastCommit} HEAD -- '*.js'`,
      { cwd: config.targetCodebase, encoding: 'utf-8' }
    );

    const files = diff.split('\n').filter(f => f.trim());
    console.log(`[indexer] ${files.length} files changed since last index`);
    return files;
  } catch (err) {
    console.warn(`[indexer] git diff failed: ${err.message}. Falling back to full index.`);
    return null;
  }
}

function saveCurrentCommit() {
  try {
    const commit = execSync('git rev-parse HEAD', {
      cwd: config.targetCodebase,
      encoding: 'utf-8',
    }).trim();

    fs.mkdirSync(path.dirname(LAST_INDEXED_PATH), { recursive: true });
    fs.writeFileSync(LAST_INDEXED_PATH, commit);
    console.log(`[indexer] saved commit hash: ${commit}`);
  } catch (err) {
    console.warn(`[indexer] could not save commit hash: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { mode } = parseArgs();
  const startTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Developer Agent Indexer — ${mode.toUpperCase()} mode`);
  console.log(`  Target: ${config.targetCodebase}`);
  console.log(`${'='.repeat(60)}\n`);

  if (mode === 'incremental') {
    const changedFiles = getChangedFiles();
    if (changedFiles === null || changedFiles.length > 50) {
      // Fall back to full if too many changes or no baseline
      console.log('[indexer] running full index (incremental not viable)');
    } else if (changedFiles.length === 0) {
      console.log('[indexer] no files changed since last index. Nothing to do.');
      return;
    } else {
      // TODO: implement incremental — for now, fall back to full
      console.log(`[indexer] incremental mode: ${changedFiles.length} changed files`);
      console.log('[indexer] NOTE: incremental update not yet implemented — running full index');
    }
  }

  // Step 1: Parse codebase
  console.log('\n--- Step 1/6: Parse codebase ---');
  const { parseCodebase } = require('./parse-codebase');
  const parsedFiles = await parseCodebase();

  // Step 2: Build symbol map
  console.log('\n--- Step 2/6: Build symbol map ---');
  const { buildSymbolMap } = require('./build-symbol-map');
  buildSymbolMap(parsedFiles);

  // Step 3: Build repo map
  console.log('\n--- Step 3/6: Build repo map ---');
  const { buildRepoMap } = require('./build-repo-map');
  buildRepoMap();

  // Step 4: Chunk and describe
  console.log('\n--- Step 4/6: Chunk and describe ---');
  const { chunkAndDescribe } = require('./chunk-and-describe');
  const chunks = await chunkAndDescribe();

  // Step 5: Embed and store in Qdrant
  console.log('\n--- Step 5/6: Embed and store ---');
  const { embedAndStore } = require('./embed-and-store');
  await embedAndStore();

  // Step 6: Build BM25 index
  console.log('\n--- Step 6/6: Build BM25 index ---');
  const { buildBm25Index } = require('./bm25-client');
  await buildBm25Index(chunks);

  // Save commit hash
  saveCurrentCommit();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Indexing complete in ${elapsed}s`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
  console.error('[indexer] fatal error:', err);
  process.exit(1);
});
