'use strict';

/**
 * get-db-schema.js
 * 
 * MCP tool for querying the database schema.
 * Supports:
 *   - List all schemas and tables
 *   - Get columns for a specific table
 *   - Search for tables/columns by name
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'index', 'db-schema.json');

let schemaData = null;

function loadSchema() {
  if (!schemaData) {
    if (!fs.existsSync(SCHEMA_PATH)) {
      return null;
    }
    schemaData = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  }
  return schemaData;
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
      results.push({
        schema: schemaName,
        table: targetTable,
        full_name: `${schemaName}.${targetTable}`,
        columns: tables[targetTable].columns,
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

module.exports = { listSchemas, getTable, searchSchema };
