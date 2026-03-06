'use strict';

/**
 * run-indexer.js
 *
 * Orchestrator for the full and incremental indexing pipeline.
 *
 * Full mode runs all steps:
 *   1. parse-codebase.js     → index/parsed-files.json
 *   2. build-symbol-map.js   → index/symbol-map.db
 *   3. build-repo-map.js     → index/repo-map.txt
 *   4. chunk-and-describe.js → index/chunks.json
 *   5. embed-and-store.js    → Qdrant collection
 *   6. bm25-client.js        → index/bm25-index.json
 *
 * Incremental mode only processes changed files:
 *   1. Parse only changed files, merge with existing parsed-files.json
 *   2. Update symbol-map.db (delete old entries, insert new)
 *   3. Rebuild repo-map.txt (depends on full graph)
 *   4. Re-chunk only changed files, merge with existing chunks
 *   5. Delete old chunks from Qdrant, embed and upsert new
 *   6. Rebuild BM25 index (fast, ~3 seconds)
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
const minimatch = require('minimatch');
const config = require('./config');

const LAST_INDEXED_PATH = path.join(config.projectRoot, 'index', '.last-indexed');
const INCREMENTAL_THRESHOLD = 50;

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
// File exclusion check
// ---------------------------------------------------------------------------

function shouldExclude(relPath) {
  for (const pattern of config.excludePatterns) {
    if (minimatch(relPath, pattern, { dot: true })) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Git diff for incremental mode
// ---------------------------------------------------------------------------

/**
 * Returns changed files since last indexed commit.
 * @returns {{ changed: string[], deleted: string[] } | null} - null means fall back to full
 */
function getChangedFiles() {
  if (!fs.existsSync(LAST_INDEXED_PATH)) {
    console.log('[indexer] no .last-indexed found — falling back to full index');
    return null;
  }

  const lastCommit = fs.readFileSync(LAST_INDEXED_PATH, 'utf-8').trim();
  console.log(`[indexer] last indexed commit: ${lastCommit}`);

  try {
    const diffOutput = execSync(
      `git diff --name-status ${lastCommit} HEAD -- '*.js'`,
      { cwd: config.targetCodebase, encoding: 'utf-8' }
    );

    const changed = [];
    const deleted = [];

    for (const line of diffOutput.split('\n')) {
      if (!line.trim()) continue;

      const [status, ...pathParts] = line.split('\t');
      const relPath = pathParts.join('\t').trim();

      if (!relPath || shouldExclude(relPath)) continue;

      if (status === 'D') {
        deleted.push(relPath);
      } else {
        changed.push(relPath);
      }
    }

    console.log(`[indexer] ${changed.length} files changed, ${deleted.length} files deleted`);
    return { changed, deleted };
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
// Full Pipeline
// ---------------------------------------------------------------------------

async function runFullPipeline() {
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
}

// ---------------------------------------------------------------------------
// Incremental Pipeline
// ---------------------------------------------------------------------------

async function runIncrementalPipeline(changedFiles, deletedFiles) {
  const allAffectedFiles = [...changedFiles, ...deletedFiles];

  // Step 1: Parse only changed files and merge
  console.log('\n--- Step 1/6: Incremental parse ---');
  const { parseCodebaseIncremental } = require('./parse-codebase');
  const parsedFiles = await parseCodebaseIncremental(changedFiles, deletedFiles);

  // Step 2: Update symbol map (delete old, insert new)
  console.log('\n--- Step 2/6: Update symbol map ---');
  const { updateSymbolMap } = require('./build-symbol-map');
  updateSymbolMap(parsedFiles, allAffectedFiles);

  // Step 3: Rebuild repo map (fast, depends on full graph)
  console.log('\n--- Step 3/6: Rebuild repo map ---');
  const { buildRepoMap } = require('./build-repo-map');
  buildRepoMap();

  // Step 4: Re-chunk only changed files and merge
  console.log('\n--- Step 4/6: Incremental chunk and describe ---');
  const { chunkAndDescribeIncremental } = require('./chunk-and-describe');
  const { chunks, oldChunkIds, newChunks } = await chunkAndDescribeIncremental(changedFiles, deletedFiles);

  // Step 5: Delete old chunks from Qdrant, embed and upsert new
  console.log('\n--- Step 5/6: Incremental embed and store ---');
  const { embedAndStoreIncremental } = require('./embed-and-store');
  await embedAndStoreIncremental(oldChunkIds, newChunks);

  // Step 6: Rebuild BM25 index (fast, ~3 seconds)
  console.log('\n--- Step 6/6: Rebuild BM25 index ---');
  const { buildBm25Index } = require('./bm25-client');
  await buildBm25Index(chunks);
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

  let runIncremental = false;
  let changedFiles = [];
  let deletedFiles = [];

  if (mode === 'incremental') {
    const diffResult = getChangedFiles();

    if (diffResult === null) {
      console.log('[indexer] running full index (no baseline commit)');
    } else {
      const totalChanged = diffResult.changed.length + diffResult.deleted.length;

      if (totalChanged === 0) {
        console.log('[indexer] no files changed since last index. Nothing to do.');
        return;
      }

      if (totalChanged > INCREMENTAL_THRESHOLD) {
        console.log(`[indexer] ${totalChanged} files changed (threshold: ${INCREMENTAL_THRESHOLD}) — falling back to full index`);
      } else {
        runIncremental = true;
        changedFiles = diffResult.changed;
        deletedFiles = diffResult.deleted;
        console.log(`[indexer] incremental mode: ${changedFiles.length} changed, ${deletedFiles.length} deleted`);
      }
    }
  }

  if (runIncremental) {
    await runIncrementalPipeline(changedFiles, deletedFiles);
  } else {
    await runFullPipeline();
  }

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
