'use strict';

/**
 * index-migrations.js
 * 
 * Parses Knex migration files to extract patterns:
 *   - Table creates (createTable)
 *   - Column definitions (table.string, table.integer, etc.)
 *   - Index creates (table.index, table.unique)
 *   - Foreign keys (table.foreign)
 *   - Table alterations (alterTable)
 * 
 * These patterns help the agent understand HOW tables are created/modified,
 * complementing the schema snapshot which shows WHAT exists.
 * 
 * Incremental Indexing:
 *   - Tracks file modification times in migration-patterns.json
 *   - Only re-parses new or modified migration files
 *   - Use --full flag to force full re-index
 * 
 * Usage: 
 *   node indexer/index-migrations.js           # incremental (default)
 *   node indexer/index-migrations.js --full    # full re-index
 * 
 * Output: index/migration-patterns.json
 */

const fs = require('fs');
const path = require('path');
const { targetCodebase } = require('./config');

const MIGRATIONS_PATH = path.join(targetCodebase, 'backend', 'db', 'migrations');
const OUTPUT_PATH = path.join(__dirname, '..', 'index', 'migration-patterns.json');
const CACHE_PATH = path.join(__dirname, '..', 'index', '.migration-cache.json');

/**
 * Extract patterns from a migration file.
 */
function parseMigrationFile(filePath, content) {
  const patterns = {
    file: path.basename(filePath),
    timestamp: extractTimestamp(path.basename(filePath)),
    tables_created: [],
    tables_altered: [],
    columns: [],
    indexes: [],
    foreign_keys: [],
    raw_sql: [],
  };

  // Extract createTable calls (multiple patterns)
  // Pattern 1: knex.schema.createTable('table')
  // Pattern 2: knex.schema.withSchema('schema').createTable('table')
  const createTablePatterns = [
    /knex\.schema\.createTable\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /knex\.schema\.withSchema\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.createTable\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];
  
  let match;
  for (const regex of createTablePatterns) {
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      // For withSchema pattern, match[1] is schema, match[2] is table
      const tableName = match[2] || match[1];
      const schemaName = match[2] ? match[1] : null;
      const fullName = schemaName ? `${schemaName}.${tableName}` : tableName;
      if (!patterns.tables_created.includes(fullName)) {
        patterns.tables_created.push(fullName);
      }
    }
  }

  // Also match createTableIfNotExists
  const createIfNotExistsPatterns = [
    /knex\.schema\.createTableIfNotExists\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /knex\.schema\.withSchema\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.createTableIfNotExists\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];
  for (const regex of createIfNotExistsPatterns) {
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const tableName = match[2] || match[1];
      const schemaName = match[2] ? match[1] : null;
      const fullName = schemaName ? `${schemaName}.${tableName}` : tableName;
      if (!patterns.tables_created.includes(fullName)) {
        patterns.tables_created.push(fullName);
      }
    }
  }

  // Extract alterTable calls (multiple patterns)
  const alterTablePatterns = [
    /knex\.schema\.alterTable\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /knex\.schema\.withSchema\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.alterTable\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];
  for (const regex of alterTablePatterns) {
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const tableName = match[2] || match[1];
      const schemaName = match[2] ? match[1] : null;
      const fullName = schemaName ? `${schemaName}.${tableName}` : tableName;
      if (!patterns.tables_altered.includes(fullName)) {
        patterns.tables_altered.push(fullName);
      }
    }
  }

  // Extract column definitions with their types
  const columnPatterns = [
    { regex: /table\.increments\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'increments' },
    { regex: /table\.bigIncrements\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'bigIncrements' },
    { regex: /table\.integer\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'integer' },
    { regex: /table\.bigInteger\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'bigInteger' },
    { regex: /table\.string\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*(\d+))?\s*\)/g, type: 'string' },
    { regex: /table\.text\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'text' },
    { regex: /table\.boolean\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'boolean' },
    { regex: /table\.decimal\s*\(\s*['"`]([^'"`]+)['"`]/g, type: 'decimal' },
    { regex: /table\.float\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'float' },
    { regex: /table\.datetime\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'datetime' },
    { regex: /table\.timestamp\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'timestamp' },
    { regex: /table\.timestamps\s*\(/g, type: 'timestamps' },
    { regex: /table\.date\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'date' },
    { regex: /table\.json\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'json' },
    { regex: /table\.jsonb\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'jsonb' },
    { regex: /table\.uuid\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'uuid' },
    { regex: /table\.enu\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\[([^\]]+)\]/g, type: 'enum' },
    { regex: /table\.specificType\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g, type: 'specificType' },
  ];

  for (const { regex, type } of columnPatterns) {
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      if (type === 'timestamps') {
        patterns.columns.push({ name: 'created_at', type: 'timestamp' });
        patterns.columns.push({ name: 'updated_at', type: 'timestamp' });
      } else if (type === 'enum') {
        patterns.columns.push({ 
          name: match[1], 
          type: 'enum', 
          values: match[2].replace(/['"`\s]/g, '').split(',') 
        });
      } else if (type === 'specificType') {
        patterns.columns.push({ name: match[1], type: match[2] });
      } else if (type === 'string' && match[2]) {
        patterns.columns.push({ name: match[1], type: `string(${match[2]})` });
      } else {
        patterns.columns.push({ name: match[1], type });
      }
    }
  }

  // Extract index definitions
  const indexRegex = /table\.index\s*\(\s*\[?['"`]?([^\]'"`\)]+)['"`]?\]?\s*(?:,\s*['"`]([^'"`]+)['"`])?\)/g;
  while ((match = indexRegex.exec(content)) !== null) {
    patterns.indexes.push({
      columns: match[1].replace(/['"`\s]/g, '').split(','),
      name: match[2] || null,
      type: 'index',
    });
  }

  // Extract unique indexes
  const uniqueRegex = /table\.unique\s*\(\s*\[?['"`]?([^\]'"`\)]+)['"`]?\]?\s*(?:,\s*['"`]([^'"`]+)['"`])?\)/g;
  while ((match = uniqueRegex.exec(content)) !== null) {
    patterns.indexes.push({
      columns: match[1].replace(/['"`\s]/g, '').split(','),
      name: match[2] || null,
      type: 'unique',
    });
  }

  // Extract foreign keys
  const foreignRegex = /table\.foreign\s*\(\s*['"`]([^'"`]+)['"`]\s*\)[\s\S]*?\.references\s*\(\s*['"`]([^'"`]+)['"`]\s*\)[\s\S]*?\.inTable\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((match = foreignRegex.exec(content)) !== null) {
    patterns.foreign_keys.push({
      column: match[1],
      references: match[2],
      table: match[3],
    });
  }

  // Extract raw SQL (for special operations)
  const rawRegex = /knex\.raw\s*\(\s*['"`]([^'"`]{10,100})/g;
  while ((match = rawRegex.exec(content)) !== null) {
    patterns.raw_sql.push(match[1].trim());
  }

  return patterns;
}

/**
 * Extract timestamp from migration filename (e.g., 20231201120000_create_users.js)
 */
function extractTimestamp(filename) {
  const match = filename.match(/^(\d{14})/);
  if (match) {
    const ts = match[1];
    return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}`;
  }
  return null;
}

/**
 * Get all migration files recursively.
 */
function getMigrationFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMigrationFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Build aggregated patterns by table.
 */
function aggregateByTable(migrations) {
  const tables = {};

  for (const mig of migrations) {
    // Tables created
    for (const tableName of mig.tables_created) {
      if (!tables[tableName]) {
        tables[tableName] = {
          created_in: null,
          altered_in: [],
          columns: [],
          indexes: [],
          foreign_keys: [],
        };
      }
      tables[tableName].created_in = mig.file;
      
      // Add columns from this migration
      for (const col of mig.columns) {
        tables[tableName].columns.push({ ...col, migration: mig.file });
      }
      
      // Add indexes
      for (const idx of mig.indexes) {
        tables[tableName].indexes.push({ ...idx, migration: mig.file });
      }
      
      // Add foreign keys
      for (const fk of mig.foreign_keys) {
        tables[tableName].foreign_keys.push({ ...fk, migration: mig.file });
      }
    }

    // Tables altered
    for (const tableName of mig.tables_altered) {
      if (!tables[tableName]) {
        tables[tableName] = {
          created_in: null,
          altered_in: [],
          columns: [],
          indexes: [],
          foreign_keys: [],
        };
      }
      tables[tableName].altered_in.push(mig.file);
      
      // Add columns from this alteration
      for (const col of mig.columns) {
        tables[tableName].columns.push({ ...col, migration: mig.file });
      }
    }
  }

  return tables;
}

/**
 * Load cached file modification times.
 */
function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    return { files: {}, migrations: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch (err) {
    console.warn('[migrations] could not load cache:', err.message);
    return { files: {}, migrations: [] };
  }
}

/**
 * Save cache with file modification times.
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.warn('[migrations] could not save cache:', err.message);
  }
}

/**
 * Get file modification time as ISO string.
 */
function getFileMtime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (err) {
    return null;
  }
}

/**
 * Main indexing function.
 * @param {boolean} forceFullIndex - If true, re-parse all files
 */
function indexMigrations(forceFullIndex = false) {
  console.log('[migrations] scanning migration files...');
  console.log(`[migrations] path: ${MIGRATIONS_PATH}`);

  const files = getMigrationFiles(MIGRATIONS_PATH);
  console.log(`[migrations] found ${files.length} migration files`);

  if (files.length === 0) {
    console.log('[migrations] no migrations found, creating empty index');
    const output = {
      generated: new Date().toISOString(),
      total_migrations: 0,
      migrations: [],
      tables: {},
      common_patterns: {},
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    saveCache({ files: {}, migrations: [] });
    return output;
  }

  // Load cache for incremental indexing
  const cache = forceFullIndex ? { files: {}, migrations: [] } : loadCache();
  const cachedMtimes = cache.files || {};
  const cachedMigrations = cache.migrations || [];
  
  // Build map of cached migrations by filename for quick lookup
  const cachedMigrationMap = new Map();
  for (const mig of cachedMigrations) {
    cachedMigrationMap.set(mig.file, mig);
  }

  // Determine which files need parsing
  const filesToParse = [];
  const unchangedFiles = [];
  const newMtimes = {};

  for (const file of files) {
    const filename = path.basename(file);
    const currentMtime = getFileMtime(file);
    newMtimes[filename] = currentMtime;

    if (!forceFullIndex && cachedMtimes[filename] === currentMtime && cachedMigrationMap.has(filename)) {
      // File unchanged, reuse cached patterns
      unchangedFiles.push(filename);
    } else {
      // File is new or modified
      filesToParse.push(file);
    }
  }

  if (filesToParse.length === 0 && !forceFullIndex) {
    console.log(`[migrations] all ${files.length} files unchanged, using cache`);
    // Still regenerate output in case aggregation logic changed
  } else if (forceFullIndex) {
    console.log(`[migrations] full re-index: parsing all ${files.length} files`);
  } else {
    console.log(`[migrations] incremental: ${filesToParse.length} new/modified, ${unchangedFiles.length} cached`);
  }

  const migrations = [];

  // Add cached migrations for unchanged files
  for (const filename of unchangedFiles) {
    const cached = cachedMigrationMap.get(filename);
    if (cached) {
      migrations.push(cached);
    }
  }

  // Parse new/modified files
  for (const file of filesToParse) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const patterns = parseMigrationFile(file, content);
      migrations.push(patterns);
    } catch (err) {
      console.error(`[migrations] error parsing ${file}: ${err.message}`);
    }
  }

  // Sort by timestamp
  migrations.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  // Aggregate by table
  const tables = aggregateByTable(migrations);

  // Extract common patterns
  const commonPatterns = {
    column_types: {},
    naming_conventions: {
      id_columns: [],
      timestamp_columns: [],
      foreign_keys: [],
    },
  };

  for (const mig of migrations) {
    for (const col of mig.columns) {
      commonPatterns.column_types[col.type] = (commonPatterns.column_types[col.type] || 0) + 1;
      
      if (col.name === 'id' || col.name.endsWith('_id')) {
        if (!commonPatterns.naming_conventions.id_columns.includes(col.name)) {
          commonPatterns.naming_conventions.id_columns.push(col.name);
        }
      }
      if (col.name.includes('_at') || col.type === 'timestamp' || col.type === 'datetime') {
        if (!commonPatterns.naming_conventions.timestamp_columns.includes(col.name)) {
          commonPatterns.naming_conventions.timestamp_columns.push(col.name);
        }
      }
    }
    
    for (const fk of mig.foreign_keys) {
      const pattern = `${fk.column} -> ${fk.table}.${fk.references}`;
      if (!commonPatterns.naming_conventions.foreign_keys.includes(pattern)) {
        commonPatterns.naming_conventions.foreign_keys.push(pattern);
      }
    }
  }

  // Limit arrays
  commonPatterns.naming_conventions.id_columns = commonPatterns.naming_conventions.id_columns.slice(0, 20);
  commonPatterns.naming_conventions.timestamp_columns = commonPatterns.naming_conventions.timestamp_columns.slice(0, 10);
  commonPatterns.naming_conventions.foreign_keys = commonPatterns.naming_conventions.foreign_keys.slice(0, 30);

  // Stats
  console.log(`[migrations] tables created: ${Object.keys(tables).length}`);
  console.log(`[migrations] total columns defined: ${migrations.reduce((sum, m) => sum + m.columns.length, 0)}`);
  console.log(`[migrations] total indexes: ${migrations.reduce((sum, m) => sum + m.indexes.length, 0)}`);
  console.log(`[migrations] total foreign keys: ${migrations.reduce((sum, m) => sum + m.foreign_keys.length, 0)}`);

  const output = {
    generated: new Date().toISOString(),
    migrations_path: MIGRATIONS_PATH,
    total_migrations: migrations.length,
    migrations: migrations.map(m => ({
      file: m.file,
      timestamp: m.timestamp,
      tables_created: m.tables_created,
      tables_altered: m.tables_altered,
      column_count: m.columns.length,
      index_count: m.indexes.length,
      fk_count: m.foreign_keys.length,
    })),
    tables,
    common_patterns: commonPatterns,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`[migrations] written to ${OUTPUT_PATH}`);

  // Save cache for incremental indexing
  // Store full migration patterns (with columns, indexes, etc.) for reuse
  saveCache({
    files: newMtimes,
    migrations: migrations,
  });

  return output;
}

module.exports = { indexMigrations, parseMigrationFile };

if (require.main === module) {
  const args = process.argv.slice(2);
  const forceFullIndex = args.includes('--full') || args.includes('-f');
  
  if (forceFullIndex) {
    console.log('[migrations] forced full re-index');
  }
  
  indexMigrations(forceFullIndex);
}
