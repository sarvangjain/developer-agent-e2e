'use strict';

/**
 * build-repo-map.js
 *
 * Reads the SQLite symbol map and produces a compressed, human-readable
 * repo map at index/repo-map.txt.
 *
 * The repo map includes:
 *   - Route files with route count AND their resolved controller file
 *   - Controllers with top exported functions
 *   - Business-logic services (not just db_service)
 *   - Schemas (compact file list)
 *   - Middleware, config, utils, errors
 *   - All ranked by PageRank on the dependency graph
 *
 * Usage:
 *   node indexer/build-repo-map.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

const DB_PATH = path.join(config.projectRoot, 'index', 'symbol-map.db');
const OUTPUT_PATH = path.join(config.projectRoot, 'index', 'repo-map.txt');

const MAX_TOKEN_TARGET = 12000;
const MAX_EXPORTS_PER_FILE = 3;
const MAX_EXPORTS_CONTROLLER = 5;

// ---------------------------------------------------------------------------
// PageRank
// ---------------------------------------------------------------------------

function pageRank(outEdges, damping = 0.85, iterations = 20) {
  const allNodes = new Set();
  const inEdges = new Map();

  for (const [source, targets] of outEdges) {
    allNodes.add(source);
    for (const target of targets) {
      allNodes.add(target);
      if (!inEdges.has(target)) inEdges.set(target, []);
      inEdges.get(target).push(source);
    }
  }

  const N = allNodes.size;
  if (N === 0) return new Map();

  const nodes = [...allNodes];
  const scores = new Map();
  const initial = 1 / N;

  for (const node of nodes) {
    scores.set(node, initial);
  }

  for (let i = 0; i < iterations; i++) {
    const newScores = new Map();
    for (const node of nodes) {
      let inScore = 0;
      const incoming = inEdges.get(node) || [];
      for (const src of incoming) {
        const srcOut = outEdges.get(src) || [];
        if (srcOut.length > 0) {
          inScore += scores.get(src) / srcOut.length;
        }
      }
      newScores.set(node, (1 - damping) / N + damping * inScore);
    }
    for (const [node, score] of newScores) {
      scores.set(node, score);
    }
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Repo map generation
// ---------------------------------------------------------------------------

function buildRepoMap() {
  console.log('[repo-map] building repo map...');

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`symbol-map.db not found at ${DB_PATH}. Run build-symbol-map.js first.`);
  }

  const db = new Database(DB_PATH, { readonly: true });

  // 1. Build dependency graph for PageRank
  const deps = db.prepare('SELECT source_file, target_file FROM dependencies').all();
  const outEdges = new Map();
  for (const dep of deps) {
    if (!outEdges.has(dep.source_file)) outEdges.set(dep.source_file, []);
    outEdges.get(dep.source_file).push(dep.target_file);
  }
  const ranks = pageRank(outEdges);

  // 2. Import counts
  const importCounts = new Map();
  for (const row of db.prepare('SELECT target_file, COUNT(*) as cnt FROM dependencies GROUP BY target_file').all()) {
    importCounts.set(row.target_file, row.cnt);
  }

  // 3. Route data — with controller file resolution (Fix B)
  const routeCountRows = db.prepare(`
    SELECT file_path,
           COUNT(*) as cnt,
           GROUP_CONCAT(DISTINCT method) as methods,
           GROUP_CONCAT(DISTINCT controller_file) as controller_files
    FROM routes
    GROUP BY file_path
  `).all();

  const routeSummaryByFile = new Map();
  for (const row of routeCountRows) {
    // Filter out nulls from controller_files
    const controllers = row.controller_files
      ? [...new Set(row.controller_files.split(',').filter(c => c && c !== 'null'))]
      : [];
    routeSummaryByFile.set(row.file_path, {
      count: row.cnt,
      methods: row.methods.toUpperCase().split(',').sort().join('/'),
      controllers,
    });
  }

  // 4. Total route stats
  const totalRoutes = db.prepare('SELECT COUNT(*) as cnt FROM routes').get().cnt;
  const routeMethodCounts = db.prepare(
    'SELECT method, COUNT(*) as cnt FROM routes GROUP BY method ORDER BY cnt DESC'
  ).all();

  // 5. Exported functions per file
  const exportedSymbols = db.prepare(`
    SELECT name, type, file_path, params, is_async
    FROM symbols WHERE is_exported = 1
    ORDER BY file_path, start_line
  `).all();
  const exportsByFile = new Map();
  for (const sym of exportedSymbols) {
    if (!exportsByFile.has(sym.file_path)) exportsByFile.set(sym.file_path, []);
    exportsByFile.get(sym.file_path).push(sym);
  }

  // 6. All known file paths from symbols table
  const allSymbolFiles = db.prepare('SELECT DISTINCT file_path FROM symbols').all().map(r => r.file_path);

  // -----------------------------------------------------------------------
  // File selection — mandatory categories + ranked fill
  // -----------------------------------------------------------------------
  const mandatoryFiles = new Set();

  // All route files
  for (const file of routeSummaryByFile.keys()) {
    mandatoryFiles.add(file);
  }

  // All controller files
  for (const file of allSymbolFiles) {
    if (file.includes('/controllers/')) {
      mandatoryFiles.add(file);
    }
  }

  // FIX A: All business-logic service files (not just db_service)
  // These sit between controllers and db_service — the core business logic layer
  for (const file of allSymbolFiles) {
    if (file.includes('/services/') && !file.includes('/db_service/')) {
      mandatoryFiles.add(file);
    }
  }

  // FIX C: All schema files
  for (const file of allSymbolFiles) {
    if (file.includes('/schemas/')) {
      mandatoryFiles.add(file);
    }
  }

  // Key infrastructure files (imported by 20+)
  for (const [file, count] of importCounts) {
    if (count >= 20) {
      mandatoryFiles.add(file);
    }
  }

  // DB service files (important but can be trimmed — just include top ones by import count)
  const dbServiceFiles = allSymbolFiles
    .filter(f => f.includes('/db_service/'))
    .sort((a, b) => (importCounts.get(b) || 0) - (importCounts.get(a) || 0))
    .slice(0, 10);
  for (const file of dbServiceFiles) {
    mandatoryFiles.add(file);
  }

  const selectedFiles = [...mandatoryFiles];
  console.log(`[repo-map] selected: ${selectedFiles.length} files`);

  // -----------------------------------------------------------------------
  // Categorize
  // -----------------------------------------------------------------------
  const modules = categorizeFiles(selectedFiles);

  // -----------------------------------------------------------------------
  // Generate output
  // -----------------------------------------------------------------------
  const lines = [];
  lines.push('# Repo Map — CargoFin Backend');
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# Total: ${ranks.size} files | ${totalRoutes} routes | ${exportedSymbols.length} exported symbols`);
  lines.push('');

  for (const [moduleName, files] of Object.entries(modules)) {
    if (files.length === 0) continue;

    lines.push(`## ${moduleName}`);

    // Sort by PageRank within module
    files.sort((a, b) => (ranks.get(b) || 0) - (ranks.get(a) || 0));

    for (const file of files) {
      const parts = [];

      // Import count
      const ic = importCounts.get(file);
      if (ic && ic > 1) parts.push(`imported by ${ic}`);

      // Route summary with controller linkage (Fix B)
      const rs = routeSummaryByFile.get(file);
      if (rs) {
        parts.push(`${rs.count} routes (${rs.methods})`);
        const suffix = parts.length > 0 ? `  [${parts.join(', ')}]` : '';
        lines.push(`  ${file}${suffix}`);

        // Show which controller(s) this route file points to
        if (rs.controllers.length > 0) {
          for (const ctrl of rs.controllers) {
            lines.push(`    → ${ctrl}`);
          }
        }
      } else if (file.includes('/schemas/')) {
        // Fix C: Schemas — compact, just file name, no exports
        lines.push(`  ${file}`);
      } else {
        // Non-route file — show exports
        const suffix = parts.length > 0 ? `  [${parts.join(', ')}]` : '';
        lines.push(`  ${file}${suffix}`);

        const fileExports = exportsByFile.get(file);
        if (fileExports) {
          const isController = file.includes('/controllers/');
          const maxShow = isController ? MAX_EXPORTS_CONTROLLER : MAX_EXPORTS_PER_FILE;
          const shown = fileExports.slice(0, maxShow);
          for (const sym of shown) {
            const asyncTag = sym.is_async ? 'async ' : '';
            if (sym.type === 'function') {
              lines.push(`    ${asyncTag}${sym.name}${sym.params || '()'}`);
            } else if (sym.type === 'class') {
              lines.push(`    class ${sym.name}`);
            }
          }
          if (fileExports.length > maxShow) {
            lines.push(`    ... +${fileExports.length - maxShow} more exports`);
          }
        }
      }
    }
    lines.push('');
  }

  // Summary
  lines.push('## Summary');
  lines.push(`  Routes: ${routeMethodCounts.map(r => `${r.method.toUpperCase()}:${r.cnt}`).join('  ')}`);
  lines.push(`  Top imports: config(${importCounts.get('backend/config/config.js') || '?'}), logger(${importCounts.get('backend/src/utils/logger.js') || '?'}), errors(${importCounts.get('backend/src/errors/argument_error.js') || '?'})`);
  lines.push('');

  const output = lines.join('\n');

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output);

  const tokenEstimate = Math.ceil(output.length / 4);
  console.log(`[repo-map] output: ${OUTPUT_PATH}`);
  console.log(`[repo-map] size: ${output.length} chars (~${tokenEstimate} tokens)`);
  console.log(`[repo-map] files included: ${selectedFiles.length}`);

  if (tokenEstimate > MAX_TOKEN_TARGET) {
    console.warn(`[repo-map] WARNING: ${tokenEstimate} tokens exceeds ${MAX_TOKEN_TARGET} target.`);
  } else {
    console.log(`[repo-map] ✓ within ${MAX_TOKEN_TARGET} token budget`);
  }

  db.close();
  return output;
}

/**
 * Categorize files into logical modules for organized display.
 */
function categorizeFiles(files) {
  const modules = {
    'Routes — Main':               [],
    'Routes — Lending':            [],
    'Controllers — Main':          [],
    'Controllers — Lending':       [],
    'Services — Main':             [],
    'Services — Lending':          [],
    'DB Services':                 [],
    'Schemas — Main':              [],
    'Schemas — Lending':           [],
    'Middleware':                   [],
    'Config':                      [],
    'Utils & Errors':              [],
    'Other':                       [],
  };

  for (const file of files) {
    if (file.includes('/main/routes/'))                  modules['Routes — Main'].push(file);
    else if (file.includes('/lending/routes/'))           modules['Routes — Lending'].push(file);
    else if (file.includes('/main/controllers/'))         modules['Controllers — Main'].push(file);
    else if (file.includes('/lending/controllers/'))      modules['Controllers — Lending'].push(file);
    else if (file.includes('/main/schemas/'))             modules['Schemas — Main'].push(file);
    else if (file.includes('/lending/schemas/'))          modules['Schemas — Lending'].push(file);
    else if (file.includes('/db_service/'))               modules['DB Services'].push(file);
    else if (file.includes('/lending/services/'))         modules['Services — Lending'].push(file);
    else if (file.includes('/services/'))                 modules['Services — Main'].push(file);
    else if (file.includes('/middlewares/'))              modules['Middleware'].push(file);
    else if (file.startsWith('backend/config/'))          modules['Config'].push(file);
    else if (file.includes('/utils/') || file.includes('/errors/')) modules['Utils & Errors'].push(file);
    else                                                  modules['Other'].push(file);
  }

  return modules;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { buildRepoMap };

if (require.main === module) {
  buildRepoMap();
}
