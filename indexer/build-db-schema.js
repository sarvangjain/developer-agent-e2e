'use strict';

/**
 * build-db-schema.js
 * 
 * Hybrid schema indexer that combines:
 * 1. Schema snapshot from CSV (accurate current state from DB)
 * 2. Migration patterns (how tables were created/modified)
 * 
 * The schema file is the source of truth for WHAT exists.
 * The migrations show HOW and WHEN tables were created.
 * 
 * Usage: node indexer/build-db-schema.js
 * Input:  index/db-schema.csv, index/migration-patterns.json (optional)
 * Output: index/db-schema.json
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'index', 'db-schema.csv');
const JSON_PATH = path.join(__dirname, '..', 'index', 'db-schema.json');
const MIGRATIONS_PATH = path.join(__dirname, '..', 'index', 'migration-patterns.json');

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j];
      }
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function buildSchema() {
  console.log('[db-schema] building structured schema...');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[db-schema] CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(content);
  console.log(`[db-schema] parsed ${rows.length} columns`);

  // Group by schema → table → columns
  const schemas = {};

  for (const row of rows) {
    const schemaName = row.table_schema;
    const tableName = row.table_name;

    if (!schemas[schemaName]) schemas[schemaName] = {};
    if (!schemas[schemaName][tableName]) schemas[schemaName][tableName] = { columns: [] };

    schemas[schemaName][tableName].columns.push({
      name: row.column_name,
      type: row.data_type,
      max_length: row.character_maximum_length || null,
      nullable: row.is_nullable === 'YES',
      default: row.column_default || null,
    });
  }

  // Stats
  const schemaNames = Object.keys(schemas);
  let totalTables = 0;
  for (const schema of schemaNames) {
    totalTables += Object.keys(schemas[schema]).length;
  }

  console.log(`[db-schema] schemas: ${schemaNames.length}`);
  console.log(`[db-schema] tables: ${totalTables}`);
  console.log(`[db-schema] schemas found: ${schemaNames.join(', ')}`);

  // Per-schema table counts
  for (const schema of schemaNames) {
    const tables = Object.keys(schemas[schema]);
    console.log(`  ${schema}: ${tables.length} tables`);
  }

  // Load migration patterns if available
  let migrationData = null;
  if (fs.existsSync(MIGRATIONS_PATH)) {
    try {
      migrationData = JSON.parse(fs.readFileSync(MIGRATIONS_PATH, 'utf-8'));
      console.log(`[db-schema] loaded ${migrationData.total_migrations} migration patterns`);
    } catch (err) {
      console.warn(`[db-schema] could not load migrations: ${err.message}`);
    }
  } else {
    console.log('[db-schema] no migration patterns found (run: node indexer/index-migrations.js)');
  }

  // Merge migration info into schema tables
  if (migrationData && migrationData.tables) {
    for (const [schemaName, schemaTables] of Object.entries(schemas)) {
      for (const [tableName, tableData] of Object.entries(schemaTables)) {
        // Try to find migration info for this table
        // Migrations might use schema-prefixed names or just table names
        const migInfo = migrationData.tables[tableName] || 
                        migrationData.tables[`${schemaName}.${tableName}`];
        
        if (migInfo) {
          tableData.migration = {
            created_in: migInfo.created_in,
            altered_in: migInfo.altered_in || [],
            indexes: migInfo.indexes || [],
            foreign_keys: migInfo.foreign_keys || [],
          };
        }
      }
    }
  }

  // Write output
  const output = {
    generated: new Date().toISOString(),
    total_schemas: schemaNames.length,
    total_tables: totalTables,
    total_columns: rows.length,
    schemas,
    // Include migration summary
    migrations: migrationData ? {
      total: migrationData.total_migrations,
      common_patterns: migrationData.common_patterns,
      recent: migrationData.migrations ? migrationData.migrations.slice(-10) : [],
    } : null,
  };

  fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2));
  console.log(`[db-schema] written to ${JSON_PATH}`);

  return output;
}

module.exports = { buildSchema };

if (require.main === module) {
  buildSchema();
}
