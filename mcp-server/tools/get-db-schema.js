'use strict';

/**
 * get-db-schema.js
 * 
 * MCP tool for querying the database schema (hybrid approach).
 * 
 * Supports:
 *   - List all schemas and tables
 *   - Get columns for a specific table (with migration info if available)
 *   - Search for tables/columns by name
 *   - Get migration patterns for a table
 *   - Search recent migrations
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'index', 'db-schema.json');
const MIGRATIONS_PATH = path.join(__dirname, '..', '..', 'index', 'migration-patterns.json');

let schemaData = null;
let migrationsData = null;

function loadSchema() {
  if (!schemaData) {
    if (!fs.existsSync(SCHEMA_PATH)) {
      return null;
    }
    schemaData = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  }
  return schemaData;
}

function loadMigrations() {
  if (!migrationsData) {
    if (!fs.existsSync(MIGRATIONS_PATH)) {
      return null;
    }
    migrationsData = JSON.parse(fs.readFileSync(MIGRATIONS_PATH, 'utf-8'));
  }
  return migrationsData;
}

/**
 * List all schemas and their tables.
 */
function listSchemas() {
  const data = loadSchema();
  if (!data) return { error: 'db-schema.json not found. Run: node indexer/build-db-schema.js' };

  const result = {};
  for (const [schemaName, tables] of Object.entries(data.schemas)) {
    result[schemaName] = Object.keys(tables).sort();
  }

  return {
    total_schemas: data.total_schemas,
    total_tables: data.total_tables,
    total_columns: data.total_columns,
    schemas: result,
  };
}

/**
 * Get detailed column info for a specific table.
 * Accepts "schema.table" or just "table" (searches all schemas).
 * Includes migration info if available.
 */
function getTable(tableName) {
  const data = loadSchema();
  if (!data) return { error: 'db-schema.json not found. Run: node indexer/build-db-schema.js' };

  // Parse schema.table format
  let targetSchema = null;
  let targetTable = tableName;

  if (tableName.includes('.')) {
    [targetSchema, targetTable] = tableName.split('.');
  }

  const results = [];

  for (const [schemaName, tables] of Object.entries(data.schemas)) {
    if (targetSchema && schemaName !== targetSchema) continue;

    if (tables[targetTable]) {
      const tableData = tables[targetTable];
      results.push({
        schema: schemaName,
        table: targetTable,
        full_name: `${schemaName}.${targetTable}`,
        columns: tableData.columns,
        migration: tableData.migration || null,
      });
    }
  }

  if (results.length === 0) {
    // Try partial match
    for (const [schemaName, tables] of Object.entries(data.schemas)) {
      for (const [tName, tData] of Object.entries(tables)) {
        if (tName.includes(targetTable)) {
          results.push({
            schema: schemaName,
            table: tName,
            full_name: `${schemaName}.${tName}`,
            columns: tData.columns,
            migration: tData.migration || null,
          });
        }
      }
    }
  }

  if (results.length === 0) {
    return { error: `Table '${tableName}' not found` };
  }

  return { matches: results.length, tables: results };
}

/**
 * Search for tables or columns by keyword.
 */
function searchSchema(keyword) {
  const data = loadSchema();
  if (!data) return { error: 'db-schema.json not found. Run: node indexer/build-db-schema.js' };

  const kw = keyword.toLowerCase();
  const matchingTables = [];
  const matchingColumns = [];

  for (const [schemaName, tables] of Object.entries(data.schemas)) {
    for (const [tableName, tableData] of Object.entries(tables)) {
      // Table name match
      if (tableName.toLowerCase().includes(kw)) {
        matchingTables.push({
          full_name: `${schemaName}.${tableName}`,
          column_count: tableData.columns.length,
        });
      }

      // Column name match
      for (const col of tableData.columns) {
        if (col.name.toLowerCase().includes(kw)) {
          matchingColumns.push({
            table: `${schemaName}.${tableName}`,
            column: col.name,
            type: col.type,
            nullable: col.nullable,
          });
        }
      }
    }
  }

  return {
    keyword,
    matching_tables: matchingTables.slice(0, 20),
    matching_columns: matchingColumns.slice(0, 30),
  };
}

/**
 * Get migration patterns for creating/modifying tables.
 * Shows how similar tables were created in existing migrations.
 */
function getMigrationPatterns(keyword) {
  const migrations = loadMigrations();
  if (!migrations) {
    return { 
      error: 'migration-patterns.json not found. Run: node indexer/index-migrations.js',
      hint: 'Migration patterns show HOW tables are created/modified in Knex migrations',
    };
  }

  const kw = keyword ? keyword.toLowerCase() : '';
  const results = {
    keyword,
    common_patterns: migrations.common_patterns,
    matching_tables: [],
    matching_migrations: [],
  };

  // Search tables in migration patterns
  if (migrations.tables) {
    for (const [tableName, tableData] of Object.entries(migrations.tables)) {
      if (!kw || tableName.toLowerCase().includes(kw)) {
        results.matching_tables.push({
          table: tableName,
          created_in: tableData.created_in,
          altered_in: tableData.altered_in || [],
          column_count: tableData.columns ? tableData.columns.length : 0,
          index_count: tableData.indexes ? tableData.indexes.length : 0,
          fk_count: tableData.foreign_keys ? tableData.foreign_keys.length : 0,
          columns: tableData.columns ? tableData.columns.slice(0, 10) : [],
        });
      }
    }
  }

  // Search migrations by filename
  if (migrations.migrations) {
    for (const mig of migrations.migrations) {
      if (!kw || 
          mig.file.toLowerCase().includes(kw) || 
          mig.tables_created.some(t => t.toLowerCase().includes(kw)) ||
          mig.tables_altered.some(t => t.toLowerCase().includes(kw))) {
        results.matching_migrations.push(mig);
      }
    }
  }

  // Limit results
  results.matching_tables = results.matching_tables.slice(0, 15);
  results.matching_migrations = results.matching_migrations.slice(0, 20);

  return results;
}

/**
 * Get recent migrations (useful for understanding current patterns).
 */
function getRecentMigrations(limit = 10) {
  const migrations = loadMigrations();
  if (!migrations) {
    return { error: 'migration-patterns.json not found. Run: node indexer/index-migrations.js' };
  }

  const recent = migrations.migrations ? migrations.migrations.slice(-limit).reverse() : [];

  return {
    total_migrations: migrations.total_migrations,
    recent,
    common_patterns: migrations.common_patterns,
  };
}

module.exports = { 
  listSchemas, 
  getTable, 
  searchSchema,
  getMigrationPatterns,
  getRecentMigrations,
};
