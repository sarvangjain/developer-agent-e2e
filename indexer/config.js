'use strict';

/**
 * indexer/config.js
 * 
 * Central configuration for the indexing pipeline.
 * All project-specific values live here — paths, aliases, exclude patterns.
 * 
 * To adapt this system to a different project, only this file needs to change
 * (plus .agent-rules.json for the Cursor agent).
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Absolute path to the target codebase root */
const targetCodebase = '/Users/sarvang.jain/Work/Repos/CargoFin_Backend';

/** Absolute path to the backend directory (where package.json and src/ live) */
const backendRoot = path.join(targetCodebase, 'backend');

/** Absolute path to this agent project */
const projectRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Module aliases (from CargoFin's package.json _moduleAliases)
// These map @alias → relative path from backendRoot
// ---------------------------------------------------------------------------

const moduleAliases = {
  '@root':       '.',
  '@config':     'config',
  '@seeds':      'db/seeds',
  '@errors':     'src/errors',
  '@main':       'src/main',
  '@middlewares': 'src/middlewares',
  '@lending':    'src/lending',
  '@services':   'src/services',
  '@scripts':    'scripts',
  '@staticData': 'src/static_data',
  '@utils':      'src/utils',
};

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/** Glob patterns to exclude from indexing (relative to targetCodebase) */
const excludePatterns = [
  '**/node_modules/**',
  '**/.git/**',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/*.log',
  'DevOps_Scripts/**',
  'Devops_Scripts_V2/**',
  '**/.vscode/**',
  'backend/test/**',
  'backend/db/seeds/**',
  '**/*.map',
  '**/.DS_Store',
  '**/*.env',
  // Non-JS directories at the repo root
  'sonar/**',
  'veracode/**',
  'DBPatch/**',
  // Migration files — not useful for feature generation
  'backend/db/migrations/**',
];

// ---------------------------------------------------------------------------
// Indexer settings
// ---------------------------------------------------------------------------

/** Target chunk size for AST-aware chunking (Phase 2) — characters, not tokens */
const targetChunkSize = 500;

/** Maximum files to add via dependency graph traversal */
const maxDependencyHops = 2;
const maxDependencyFiles = 10;

// ---------------------------------------------------------------------------
// Route detection
// ---------------------------------------------------------------------------

/**
 * Paths that contain route definition files.
 * Used to prioritize route extraction during parsing.
 */
const routePaths = [
  'backend/config/routes.js',
  'backend/src/main/routes',
  'backend/src/lending/routes',
];

/**
 * The central route aggregator file.
 * This file imports all route modules and merges them.
 */
const routeAggregator = 'backend/config/routes.js';

/**
 * The router file that registers routes with Express.
 */
const routeRegistrar = 'backend/src/router.js';

// ---------------------------------------------------------------------------
// Codebase structure (used by repo map builder)
// ---------------------------------------------------------------------------

const structure = {
  routes:       ['backend/src/main/routes', 'backend/src/lending/routes'],
  controllers:  ['backend/src/main/controllers', 'backend/src/lending/controllers'],
  services:     ['backend/src/services', 'backend/src/lending/services'],
  schemas:      ['backend/src/main/schemas', 'backend/src/lending/schemas'],
  middlewares:   'backend/src/middlewares',
  errors:       'backend/src/errors',
  utils:        'backend/src/utils',
  config:       'backend/config',
  staticData:   'backend/src/static_data',
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = {
  targetCodebase,
  backendRoot,
  projectRoot,
  moduleAliases,
  excludePatterns,
  targetChunkSize,
  maxDependencyHops,
  maxDependencyFiles,
  routePaths,
  routeAggregator,
  routeRegistrar,
  structure,
};
