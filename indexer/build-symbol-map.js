'use strict';

/**
 * build-symbol-map.js
 *
 * Reads index/parsed-files.json (output of parse-codebase.js) and populates
 * a SQLite database with three tables:
 *
 *   symbols       — every function, class, export (name, file, type, line range)
 *   dependencies  — directed graph: source_file → imported_file
 *   routes        — CargoFin route definitions (name, method, path, handler, file)
 *
 * The database powers:
 *   - get_symbol tool (exact name lookup)
 *   - get_dependencies tool (graph traversal)
 *   - get_routes tool (filtered route queries)
 *   - PageRank calculation in build-repo-map.js
 *
 * Output: index/symbol-map.db
 *
 * Usage:
 *   node indexer/build-symbol-map.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------

const DB_PATH = path.join(config.projectRoot, 'index', 'symbol-map.db');

function createDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // Remove existing DB for a fresh build
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('[symbol-map] removed existing database');
  }

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance (MCP server reads while indexer writes)
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE symbols (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,          -- 'function' | 'class' | 'method' | 'export'
      file_path   TEXT NOT NULL,          -- relative path from codebase root
      start_line  INTEGER,
      end_line    INTEGER,
      params      TEXT,                   -- function/method signature
      is_exported INTEGER DEFAULT 0,      -- 1 if exported
      is_async    INTEGER DEFAULT 0,      -- 1 if async
      parent      TEXT                    -- for methods: class name
    );

    CREATE TABLE dependencies (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      source_file   TEXT NOT NULL,         -- file that contains the require/import
      target_file   TEXT NOT NULL,         -- file being imported
      raw_import    TEXT,                  -- original require string (e.g. '@main/routes/auth')
      imported_names TEXT                  -- JSON array of imported names
    );

    CREATE TABLE routes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,         -- route key name (e.g. 'login', 'getUsers')
      method          TEXT NOT NULL,         -- 'get' | 'post' | 'patch' | 'delete'
      path            TEXT NOT NULL,         -- URL path (e.g. '/login', '/users/:id')
      handler         TEXT,                  -- raw handler reference (e.g. 'authController.loginUser')
      handler_function TEXT,                 -- resolved function name (e.g. 'loginUser')
      controller_file TEXT,                  -- resolved controller file path (e.g. 'backend/src/main/controllers/auth.js')
      file_path       TEXT NOT NULL,         -- file where route is defined
      middlewares     TEXT,                  -- JSON string of middleware array
      public_access   INTEGER DEFAULT 0,    -- 1 if publicAccess: true
      start_line      INTEGER,
      end_line        INTEGER
    );

    -- Indexes for fast lookups
    CREATE INDEX idx_symbols_name ON symbols(name);
    CREATE INDEX idx_symbols_file ON symbols(file_path);
    CREATE INDEX idx_symbols_type ON symbols(type);
    CREATE INDEX idx_symbols_exported ON symbols(is_exported);

    CREATE INDEX idx_deps_source ON dependencies(source_file);
    CREATE INDEX idx_deps_target ON dependencies(target_file);

    CREATE INDEX idx_routes_method ON routes(method);
    CREATE INDEX idx_routes_path ON routes(path);
    CREATE INDEX idx_routes_file ON routes(file_path);
  `);

  console.log('[symbol-map] database created with tables: symbols, dependencies, routes');
  return db;
}

// ---------------------------------------------------------------------------
// Population
// ---------------------------------------------------------------------------

function populateDatabase(db, parsedFiles) {
  const insertSymbol = db.prepare(`
    INSERT INTO symbols (name, type, file_path, start_line, end_line, params, is_exported, is_async, parent)
    VALUES (@name, @type, @file_path, @start_line, @end_line, @params, @is_exported, @is_async, @parent)
  `);

  const insertDep = db.prepare(`
    INSERT INTO dependencies (source_file, target_file, raw_import, imported_names)
    VALUES (@source_file, @target_file, @raw_import, @imported_names)
  `);

  const insertRoute = db.prepare(`
    INSERT INTO routes (name, method, path, handler, handler_function, controller_file, file_path, middlewares, public_access, start_line, end_line)
    VALUES (@name, @method, @path, @handler, @handler_function, @controller_file, @file_path, @middlewares, @public_access, @start_line, @end_line)
  `);

  let symbolCount = 0;
  let depCount = 0;
  let routeCount = 0;

  // Use a transaction for performance (bulk inserts are 10-100x faster in a transaction)
  const populate = db.transaction(() => {
    for (const [filePath, fileData] of Object.entries(parsedFiles)) {
      // --- Symbols: functions ---
      for (const fn of fileData.functions) {
        insertSymbol.run({
          name: fn.name,
          type: 'function',
          file_path: filePath,
          start_line: fn.startLine,
          end_line: fn.endLine,
          params: fn.params,
          is_exported: fn.isExported ? 1 : 0,
          is_async: fn.isAsync ? 1 : 0,
          parent: null,
        });
        symbolCount++;
      }

      // --- Symbols: classes and their methods ---
      for (const cls of fileData.classes) {
        insertSymbol.run({
          name: cls.name,
          type: 'class',
          file_path: filePath,
          start_line: cls.startLine,
          end_line: cls.endLine,
          params: null,
          is_exported: 0,
          is_async: 0,
          parent: null,
        });
        symbolCount++;

        for (const method of cls.methods) {
          insertSymbol.run({
            name: method.name,
            type: 'method',
            file_path: filePath,
            start_line: method.startLine,
            end_line: method.endLine,
            params: method.params,
            is_exported: 0,
            is_async: method.isAsync ? 1 : 0,
            parent: cls.name,
          });
          symbolCount++;
        }
      }

      // --- Dependencies ---
      for (const imp of fileData.imports) {
        if (!imp.resolved) continue; // skip unresolvable (npm packages)

        // Normalize the target to a relative path from codebase root
        let targetRelative;
        if (path.isAbsolute(imp.resolved)) {
          targetRelative = path.relative(config.targetCodebase, imp.resolved);
        } else {
          targetRelative = imp.resolved;
        }

        insertDep.run({
          source_file: filePath,
          target_file: targetRelative,
          raw_import: imp.raw,
          imported_names: JSON.stringify(imp.names),
        });
        depCount++;
      }

      // --- Routes ---
      for (const route of fileData.routes) {
        insertRoute.run({
          name: route.name,
          method: route.method,
          path: route.path,
          handler: route.handler,
          handler_function: route.handlerFunction || null,
          controller_file: route.controllerFile || null,
          file_path: filePath,
          middlewares: route.middlewares ? JSON.stringify(route.middlewares) : null,
          public_access: route.publicAccess ? 1 : 0,
          start_line: route.startLine,
          end_line: route.endLine,
        });
        routeCount++;
      }
    }
  });

  populate();

  console.log(`[symbol-map] populated:`);
  console.log(`[symbol-map]   symbols: ${symbolCount}`);
  console.log(`[symbol-map]   dependencies: ${depCount}`);
  console.log(`[symbol-map]   routes: ${routeCount}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function buildSymbolMap(parsedFiles) {
  console.log('[symbol-map] building symbol map...');

  // If parsedFiles not passed, read from disk
  if (!parsedFiles) {
    const inputPath = path.join(config.projectRoot, 'index', 'parsed-files.json');
    if (!fs.existsSync(inputPath)) {
      throw new Error(
        `parsed-files.json not found at ${inputPath}. Run parse-codebase.js first.`
      );
    }
    parsedFiles = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  }

  const db = createDatabase();
  populateDatabase(db, parsedFiles);

  // Print some sample queries for verification
  printSampleQueries(db);

  db.close();
  console.log(`[symbol-map] database written to ${DB_PATH}`);
}

/**
 * Print sample queries to verify the database looks correct.
 */
function printSampleQueries(db) {
  console.log('\n[symbol-map] --- sample queries ---');

  // Top 5 most-imported files
  const topImported = db.prepare(`
    SELECT target_file, COUNT(*) as import_count
    FROM dependencies
    GROUP BY target_file
    ORDER BY import_count DESC
    LIMIT 5
  `).all();

  console.log('\n  Top 5 most-imported files:');
  for (const row of topImported) {
    console.log(`    ${row.import_count}x  ${row.target_file}`);
  }

  // Total routes by method
  const routesByMethod = db.prepare(`
    SELECT method, COUNT(*) as count
    FROM routes
    GROUP BY method
    ORDER BY count DESC
  `).all();

  console.log('\n  Routes by HTTP method:');
  for (const row of routesByMethod) {
    console.log(`    ${row.method.toUpperCase()}: ${row.count}`);
  }

  // Files with most exported functions
  const topExporters = db.prepare(`
    SELECT file_path, COUNT(*) as export_count
    FROM symbols
    WHERE is_exported = 1
    GROUP BY file_path
    ORDER BY export_count DESC
    LIMIT 5
  `).all();

  console.log('\n  Files with most exported functions:');
  for (const row of topExporters) {
    console.log(`    ${row.export_count}x  ${row.file_path}`);
  }

  console.log('\n[symbol-map] --- end samples ---\n');
}

// ---------------------------------------------------------------------------
// Incremental update
// ---------------------------------------------------------------------------

/**
 * Update symbol map for changed files only.
 * Deletes old entries for affected files and inserts new ones.
 * 
 * @param {object} parsedFiles - Full parsed files object (already merged with changes)
 * @param {string[]} affectedFiles - Relative paths of files that were changed or deleted
 */
function updateSymbolMap(parsedFiles, affectedFiles) {
  console.log('[symbol-map] updating symbol map incrementally...');
  console.log(`[symbol-map] affected files: ${affectedFiles.length}`);

  if (!fs.existsSync(DB_PATH)) {
    console.log('[symbol-map] no existing database found — falling back to full build');
    return buildSymbolMap(parsedFiles);
  }

  const db = new Database(DB_PATH);

  // Prepare delete statements
  const deleteSymbols = db.prepare('DELETE FROM symbols WHERE file_path = ?');
  const deleteDeps = db.prepare('DELETE FROM dependencies WHERE source_file = ?');
  const deleteRoutes = db.prepare('DELETE FROM routes WHERE file_path = ?');

  // Prepare insert statements (same as in populateDatabase)
  const insertSymbol = db.prepare(`
    INSERT INTO symbols (name, type, file_path, start_line, end_line, params, is_exported, is_async, parent)
    VALUES (@name, @type, @file_path, @start_line, @end_line, @params, @is_exported, @is_async, @parent)
  `);

  const insertDep = db.prepare(`
    INSERT INTO dependencies (source_file, target_file, raw_import, imported_names)
    VALUES (@source_file, @target_file, @raw_import, @imported_names)
  `);

  const insertRoute = db.prepare(`
    INSERT INTO routes (name, method, path, handler, handler_function, controller_file, file_path, middlewares, public_access, start_line, end_line)
    VALUES (@name, @method, @path, @handler, @handler_function, @controller_file, @file_path, @middlewares, @public_access, @start_line, @end_line)
  `);

  let deletedSymbols = 0;
  let deletedDeps = 0;
  let deletedRoutes = 0;
  let insertedSymbols = 0;
  let insertedDeps = 0;
  let insertedRoutes = 0;

  const update = db.transaction(() => {
    // Delete old entries for all affected files
    for (const filePath of affectedFiles) {
      const symbolResult = deleteSymbols.run(filePath);
      const depResult = deleteDeps.run(filePath);
      const routeResult = deleteRoutes.run(filePath);
      
      deletedSymbols += symbolResult.changes;
      deletedDeps += depResult.changes;
      deletedRoutes += routeResult.changes;
    }

    // Insert new entries for changed files (not deleted files)
    for (const filePath of affectedFiles) {
      const fileData = parsedFiles[filePath];
      if (!fileData) continue; // File was deleted, nothing to insert

      // Insert symbols: functions
      for (const fn of fileData.functions) {
        insertSymbol.run({
          name: fn.name,
          type: 'function',
          file_path: filePath,
          start_line: fn.startLine,
          end_line: fn.endLine,
          params: fn.params,
          is_exported: fn.isExported ? 1 : 0,
          is_async: fn.isAsync ? 1 : 0,
          parent: null,
        });
        insertedSymbols++;
      }

      // Insert symbols: classes and their methods
      for (const cls of fileData.classes) {
        insertSymbol.run({
          name: cls.name,
          type: 'class',
          file_path: filePath,
          start_line: cls.startLine,
          end_line: cls.endLine,
          params: null,
          is_exported: 0,
          is_async: 0,
          parent: null,
        });
        insertedSymbols++;

        for (const method of cls.methods) {
          insertSymbol.run({
            name: method.name,
            type: 'method',
            file_path: filePath,
            start_line: method.startLine,
            end_line: method.endLine,
            params: method.params,
            is_exported: 0,
            is_async: method.isAsync ? 1 : 0,
            parent: cls.name,
          });
          insertedSymbols++;
        }
      }

      // Insert dependencies
      for (const imp of fileData.imports) {
        if (!imp.resolved) continue;

        let targetRelative;
        if (path.isAbsolute(imp.resolved)) {
          targetRelative = path.relative(config.targetCodebase, imp.resolved);
        } else {
          targetRelative = imp.resolved;
        }

        insertDep.run({
          source_file: filePath,
          target_file: targetRelative,
          raw_import: imp.raw,
          imported_names: JSON.stringify(imp.names),
        });
        insertedDeps++;
      }

      // Insert routes
      for (const route of fileData.routes) {
        insertRoute.run({
          name: route.name,
          method: route.method,
          path: route.path,
          handler: route.handler,
          handler_function: route.handlerFunction || null,
          controller_file: route.controllerFile || null,
          file_path: filePath,
          middlewares: route.middlewares ? JSON.stringify(route.middlewares) : null,
          public_access: route.publicAccess ? 1 : 0,
          start_line: route.startLine,
          end_line: route.endLine,
        });
        insertedRoutes++;
      }
    }
  });

  update();

  console.log(`[symbol-map] incremental update complete:`);
  console.log(`[symbol-map]   deleted: ${deletedSymbols} symbols, ${deletedDeps} deps, ${deletedRoutes} routes`);
  console.log(`[symbol-map]   inserted: ${insertedSymbols} symbols, ${insertedDeps} deps, ${insertedRoutes} routes`);

  db.close();
  console.log(`[symbol-map] database updated at ${DB_PATH}`);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { buildSymbolMap, updateSymbolMap };

if (require.main === module) {
  buildSymbolMap();
}
