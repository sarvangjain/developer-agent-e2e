'use strict';

/**
 * symbol-client.js
 * 
 * SQLite client for the symbol map and dependency graph.
 * Used by get_symbol, get_routes, and get_dependencies MCP tools.
 */

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'index', 'symbol-map.db');

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    console.log('[mcp:symbol] SQLite symbol map loaded');
  }
  return db;
}

// ---------------------------------------------------------------------------
// Symbol lookup
// ---------------------------------------------------------------------------

/**
 * Find symbols by name (exact or partial match).
 */
function findSymbol(name, exact = false) {
  const d = getDb();
  if (exact) {
    return d.prepare(`
      SELECT s.*, GROUP_CONCAT(d.target_file) as imports_files
      FROM symbols s
      LEFT JOIN dependencies d ON d.source_file = s.file_path
      WHERE s.name = ?
      GROUP BY s.id
    `).all(name);
  }

  return d.prepare(`
    SELECT s.*, GROUP_CONCAT(d.target_file) as imports_files
    FROM symbols s
    LEFT JOIN dependencies d ON d.source_file = s.file_path
    WHERE s.name LIKE ?
    GROUP BY s.id
    LIMIT 20
  `).all(`%${name}%`);
}

/**
 * Get full symbol info including what imports it and what it imports.
 */
function getSymbolDetails(name) {
  const d = getDb();

  // Find the symbol
  const symbols = d.prepare(`
    SELECT * FROM symbols WHERE name = ? ORDER BY is_exported DESC
  `).all(name);

  if (symbols.length === 0) {
    // Try partial match
    const partial = d.prepare(`
      SELECT * FROM symbols WHERE name LIKE ? ORDER BY is_exported DESC LIMIT 10
    `).all(`%${name}%`);
    if (partial.length === 0) return null;
    return formatSymbolResult(partial, d);
  }

  return formatSymbolResult(symbols, d);
}

function formatSymbolResult(symbols, d) {
  return symbols.map(sym => {
    // What this file imports
    const imports = d.prepare(`
      SELECT target_file, raw_import, imported_names
      FROM dependencies WHERE source_file = ?
    `).all(sym.file_path);

    // What imports this file
    const importedBy = d.prepare(`
      SELECT source_file, raw_import
      FROM dependencies WHERE target_file = ?
    `).all(sym.file_path);

    return {
      name: sym.name,
      type: sym.type,
      file_path: sym.file_path,
      start_line: sym.start_line,
      end_line: sym.end_line,
      params: sym.params,
      is_exported: !!sym.is_exported,
      is_async: !!sym.is_async,
      parent: sym.parent,
      imports: imports.map(i => ({
        file: i.target_file,
        raw: i.raw_import,
        names: i.imported_names ? JSON.parse(i.imported_names) : [],
      })),
      imported_by: importedBy.map(i => ({
        file: i.source_file,
        raw: i.raw_import,
      })),
    };
  });
}

// ---------------------------------------------------------------------------
// Route queries
// ---------------------------------------------------------------------------

/**
 * Get routes filtered by domain/keyword.
 */
function getRoutes(domain) {
  const d = getDb();

  if (!domain || domain === '*') {
    return d.prepare(`
      SELECT * FROM routes ORDER BY file_path, path
    `).all();
  }

  // Search routes by path, name, file_path, or handler
  const pattern = `%${domain}%`;
  return d.prepare(`
    SELECT * FROM routes
    WHERE path LIKE ? OR name LIKE ? OR file_path LIKE ? OR handler LIKE ? OR controller_file LIKE ?
    ORDER BY file_path, path
  `).all(pattern, pattern, pattern, pattern, pattern);
}

// ---------------------------------------------------------------------------
// Dependency graph traversal
// ---------------------------------------------------------------------------

/**
 * Traverse the dependency graph from a starting file.
 * 
 * @param {string} filePath - starting file (relative path)
 * @param {string} direction - 'imports' (what this file imports) or 'imported_by' (what imports this)
 * @param {number} depth - how many hops to traverse (default 2)
 * @returns {Array} related files with distance from start
 */
function getDependencies(filePath, direction = 'imports', depth = 2) {
  const d = getDb();
  const visited = new Set();
  const result = [];

  function traverse(file, currentDepth) {
    if (currentDepth > depth) return;
    if (visited.has(file)) return;
    visited.add(file);

    let edges;
    if (direction === 'imports') {
      edges = d.prepare(`
        SELECT target_file as related_file, raw_import, imported_names
        FROM dependencies WHERE source_file = ?
      `).all(file);
    } else {
      edges = d.prepare(`
        SELECT source_file as related_file, raw_import, imported_names
        FROM dependencies WHERE target_file = ?
      `).all(file);
    }

    for (const edge of edges) {
      if (!visited.has(edge.related_file)) {
        result.push({
          file: edge.related_file,
          distance: currentDepth,
          raw_import: edge.raw_import,
          imported_names: edge.imported_names ? JSON.parse(edge.imported_names) : [],
        });
        traverse(edge.related_file, currentDepth + 1);
      }
    }
  }

  traverse(filePath, 1);

  // Cap at 10 files per the plan
  return result.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = {
  findSymbol,
  getSymbolDetails,
  getRoutes,
  getDependencies,
};
