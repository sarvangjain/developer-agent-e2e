'use strict';

/**
 * MCP Server — Developer Agent
 * 
 * Exposes codebase retrieval tools to Cursor via the Model Context Protocol.
 * Runs as a stdio process registered in ~/.cursor/mcp.json.
 * 
 * Tools:
 *   get_repo_map        — compressed structural overview of the codebase
 *   search_codebase     — hybrid BM25 + vector search with Phase 2 enhancements
 *   advanced_search     — Phase 3: cross-encoder, agentic multi-hop, Layer 0
 *   get_query_stats     — query logging statistics
 *   get_symbol          — exact symbol lookup from SQLite
 *   get_routes          — filtered Express route query
 *   get_dependencies    — dependency graph traversal
 *   search_prd_history  — search historical PRDs (Phase 5)
 *   get_prd             — get a full historical PRD (Phase 5)
 *   read_file           — read a specific file from the codebase
 *   list_directory      — list directory contents
 *   grep_codebase       — grep search across the codebase
 * 
 * Usage:
 *   node mcp-server/index.js
 *   (registered in ~/.cursor/mcp.json for automatic startup)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

// Tool implementations
const { getRepoMap } = require('./tools/get-repo-map');
const { searchCodebase } = require('./tools/search-codebase');
const { getSymbol } = require('./tools/get-symbol');
const { getRoutes } = require('./tools/get-routes');
const { getDependencies } = require('./tools/get-dependencies');
const { searchPrdHistory } = require('./tools/search-prd-history');
const { getPrd } = require('./tools/get-prd');
const { readFile } = require('./tools/read-file');
const { listDirectory } = require('./tools/list-directory');
const { grepCodebase } = require('./tools/grep-codebase');

// Phase 2 & 3: Advanced retrieval
const { getQueryLogStats } = require('./tools/query-enhancer');
const { advancedSearch } = require('./tools/advanced-retrieval');

// New tools: DB schema (hybrid with migrations), test patterns
const { listSchemas, getTable, searchSchema, getMigrationPatterns, getRecentMigrations } = require('./tools/get-db-schema');
const { getTestPatterns } = require('./tools/get-test-patterns');

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'developer-agent',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

// 1. get_repo_map — always called first
server.tool(
  'get_repo_map',
  'Get the compressed structural overview of the entire CargoFin backend codebase. Shows routes, controllers, services, middleware, config, and utils ranked by importance. Always call this first to orient yourself.',
  {},
  async () => {
    const result = getRepoMap();
    return { content: [{ type: 'text', text: result.error || result.content }] };
  }
);

// 2. search_codebase — hybrid search with graceful degradation
server.tool(
  'search_codebase',
  'Search the codebase using hybrid BM25 + semantic vector search with diversity re-ranking. Supports optional query enhancement (decomposition, HyDE). Use lambda=0.5 for broad PRD queries, lambda=0.8 for specific function lookups.',
  {
    query: z.string().describe('Natural language search query'),
    limit: z.number().optional().default(20).describe('Max results to return (default 20)'),
    lambda: z.number().optional().default(0.5).describe('MMR diversity: 0.5=diverse/broad, 0.8=relevant/specific'),
  },
  async ({ query, limit, lambda }) => {
    const { degraded, results, enhanced } = await searchCodebase(query, limit, lambda);

    let header = '';
    if (degraded) {
      header = '⚠️ DEGRADED MODE: Vector search unavailable. Results below are BM25 keyword-only.\n\n';
    }
    
    // Show enhancement info if any features were applied
    if (enhanced && (enhanced.decomposed || enhanced.hydeApplied)) {
      const enhancements = [];
      if (enhanced.decomposed) enhancements.push(`decomposed into ${enhanced.queryCount} sub-queries`);
      if (enhanced.hydeApplied) enhancements.push('HyDE applied');
      header += `🔍 Query enhanced: ${enhancements.join(', ')}\n\n`;
    }

    const formatted = results.map(r =>
      `[${r.rank}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}\n` +
      `    ${r.description || 'No description'}\n` +
      `    Layer: ${r.layer || 'unknown'} | Module: ${r.module || 'unknown'} | Lines: ${r.start_line}-${r.end_line}\n` +
      `    Code:\n${r.code.slice(0, 500)}${r.code.length > 500 ? '\n    ... (truncated)' : ''}`
    ).join('\n\n');

    return { content: [{ type: 'text', text: header + (formatted || 'No results found') }] };
  }
);

// 2b. advanced_search — Phase 3 features (cross-encoder, agentic, Layer 0)
server.tool(
  'advanced_search',
  'Advanced codebase search with all Phase 3 features: cross-encoder reranking for precision, agentic multi-hop for complex queries, and Layer 0 query understanding. Use for complex feature exploration or when basic search misses relevant code.',
  {
    query: z.string().describe('Natural language search query'),
    limit: z.number().optional().default(15).describe('Max results to return (default 15)'),
    use_cross_encoder: z.boolean().optional().default(true).describe('Use LLM to rerank top results for precision'),
    use_agentic: z.boolean().optional().default(false).describe('Enable iterative multi-hop retrieval (slower but more thorough)'),
    use_layer0: z.boolean().optional().default(true).describe('Extract intent and layer hints from query'),
  },
  async ({ query, limit, use_cross_encoder, use_agentic, use_layer0 }) => {
    const result = await advancedSearch(query, searchCodebase, {
      limit,
      useCrossEncoder: use_cross_encoder,
      useAgentic: use_agentic,
      useLayer0: use_layer0,
    });

    let header = '';
    
    // Show metadata
    const { metadata } = result;
    if (metadata.layer0) {
      const l0 = metadata.layer0;
      if (l0.intent !== 'find' || l0.layers.length > 0 || l0.entities.length > 0) {
        header += `🎯 Query Analysis: intent=${l0.intent}`;
        if (l0.layers.length > 0) header += `, layers=[${l0.layers.join(',')}]`;
        if (l0.entities.length > 0) header += `, entities=[${l0.entities.join(',')}]`;
        header += '\n';
      }
    }
    
    if (metadata.iterations > 1) {
      header += `🔄 Agentic: ${metadata.iterations} iterations`;
      if (metadata.followUpQueries.length > 0) {
        header += `, follow-ups: ${metadata.followUpQueries.map(q => `"${q.slice(0, 30)}..."`).join(', ')}`;
      }
      header += '\n';
    }
    
    if (metadata.crossEncoderApplied) {
      header += '✨ Cross-encoder reranking applied\n';
    }
    
    if (header) header += '\n';

    const formatted = result.results.map((r, i) =>
      `[${i + 1}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}\n` +
      `    ${r.description || 'No description'}\n` +
      `    Layer: ${r.layer || 'unknown'} | Module: ${r.module || 'unknown'} | Lines: ${r.start_line}-${r.end_line}\n` +
      `    Code:\n${r.code.slice(0, 500)}${r.code.length > 500 ? '\n    ... (truncated)' : ''}`
    ).join('\n\n');

    return { content: [{ type: 'text', text: header + (formatted || 'No results found') }] };
  }
);

// 2c. get_query_stats — query logging stats
server.tool(
  'get_query_stats',
  'Get statistics about logged search queries. Useful for understanding query patterns and tuning retrieval.',
  {},
  async () => {
    const stats = getQueryLogStats();
    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  }
);

// 3. get_symbol — exact name lookup
server.tool(
  'get_symbol',
  'Look up a specific function, class, or symbol by name. Returns the file path, full source, parameters, and what imports/is imported by this file. Faster than search when you know the exact name.',
  {
    name: z.string().describe('Symbol name to look up (exact or partial match)'),
  },
  async ({ name }) => {
    const result = getSymbol(name);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// 4. get_routes — Express route query
server.tool(
  'get_routes',
  'Get all Express routes for a domain area. Search by URL path, route name, controller, or file path. Returns method, path, handler function, and controller file.',
  {
    domain: z.string().describe('Domain to filter routes by (e.g. "credit", "auth", "finance"). Use "*" for all routes.'),
  },
  async ({ domain }) => {
    const result = getRoutes(domain);
    const formatted = result.routes.map(r =>
      `${r.method.padEnd(7)} ${r.path}\n` +
      `    Handler: ${r.handler || '?'}\n` +
      `    Controller: ${r.controller_file || '?'}\n` +
      `    Route file: ${r.file_path}${r.public_access ? ' [PUBLIC]' : ''}`
    ).join('\n\n');
    return { content: [{ type: 'text', text: `${result.count} routes found:\n\n${formatted}` }] };
  }
);

// 5. get_dependencies — graph traversal
server.tool(
  'get_dependencies',
  'Traverse the dependency graph from a starting file. Find what a file imports or what files import it, up to N hops away. Essential for understanding the full context of a feature.',
  {
    file_path: z.string().describe('Relative file path from codebase root (e.g. "backend/src/main/controllers/auth.js")'),
    direction: z.enum(['imports', 'imported_by']).optional().default('imports').describe('Direction: "imports" = what this file imports, "imported_by" = what imports this file'),
    depth: z.number().optional().default(2).describe('How many hops to traverse (default 2, max 3)'),
  },
  async ({ file_path, direction, depth }) => {
    const result = getDependencies(file_path, direction, Math.min(depth, 3));
    const formatted = result.files.map(f =>
      `${'  '.repeat(f.distance)}${f.file} (hop ${f.distance})` +
      (f.imported_names.length > 0 ? `\n${'  '.repeat(f.distance + 1)}imports: ${f.imported_names.join(', ')}` : '')
    ).join('\n');
    return { content: [{ type: 'text', text: `Dependencies for ${file_path} (${direction}, depth ${depth}):\n\n${formatted || 'No dependencies found'}` }] };
  }
);

// 6. search_prd_history — PRD search (Phase 5)
server.tool(
  'search_prd_history',
  'Search historical PRDs for similar past features, decisions, and edge cases. Returns matching PRD sections with feature name, date, and outcome.',
  {
    query: z.string().describe('Search query describing the feature or decision to look up'),
    limit: z.number().optional().default(10).describe('Max results'),
  },
  async ({ query, limit }) => {
    const result = await searchPrdHistory(query, limit);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// 7. get_prd — full PRD retrieval (Phase 5)
server.tool(
  'get_prd',
  'Get a complete historical PRD by feature name. Returns the full structured PRD document.',
  {
    feature_name: z.string().describe('Feature name to look up'),
  },
  async ({ feature_name }) => {
    const result = getPrd(feature_name);
    return { content: [{ type: 'text', text: result.error || result.content }] };
  }
);

// 8. read_file — Layer 4 agentic file access
server.tool(
  'read_file',
  'Read the full contents of a specific file from the codebase. Use this when search results point you to a file and you need to see the complete code.',
  {
    path: z.string().describe('File path relative to codebase root (e.g. "backend/src/main/controllers/auth.js")'),
  },
  async ({ path: filePath }) => {
    const result = readFile(filePath);
    return { content: [{ type: 'text', text: result.error || result.content }] };
  }
);

// 9. list_directory
server.tool(
  'list_directory',
  'List the contents of a directory in the codebase. Useful for exploring the project structure.',
  {
    path: z.string().describe('Directory path relative to codebase root (e.g. "backend/src/lending/controllers")'),
  },
  async ({ path: dirPath }) => {
    const result = listDirectory(dirPath);
    if (result.error) return { content: [{ type: 'text', text: result.error }] };
    const formatted = result.entries.map(e =>
      `${e.type === 'directory' ? '📁' : '📄'} ${e.name}`
    ).join('\n');
    return { content: [{ type: 'text', text: `${result.path}:\n\n${formatted}` }] };
  }
);

// 10. grep_codebase
server.tool(
  'grep_codebase',
  'Search for a text pattern across the codebase using grep. Returns matching file paths and line numbers. Good for finding exact string references, function calls, or config values.',
  {
    pattern: z.string().describe('Text pattern or regex to search for'),
    file_glob: z.string().optional().default('*.js').describe('File glob pattern to filter (default: "*.js")'),
  },
  async ({ pattern, file_glob }) => {
    const result = grepCodebase(pattern, file_glob);
    if (result.error) return { content: [{ type: 'text', text: result.error }] };
    const formatted = result.results.map(r =>
      r.file ? `${r.file}:${r.line}: ${r.content}` : r.raw
    ).join('\n');
    return {
      content: [{
        type: 'text',
        text: `Pattern: "${pattern}" — ${result.total_matches} matches${result.total_matches > 50 ? ' (showing first 50)' : ''}\n\n${formatted || 'No matches found'}`,
      }],
    };
  }
);

// 11. get_db_schema — database schema query (hybrid: schema snapshot + migration patterns)
server.tool(
  'get_db_schema',
  'Query the database schema (hybrid: current state + migration patterns). Actions: "list"=all schemas/tables, "table"=column details + migration info, "search"=find by keyword, "migrations"=migration patterns for a table, "recent"=recent migrations. Essential for Checkpoint 4 (Data Model & Contract Review).',
  {
    action: z.enum(['list', 'table', 'search', 'migrations', 'recent']).describe('Action: list/table/search (schema), migrations/recent (patterns)'),
    table_name: z.string().optional().describe('For action=table: schema.table_name or just table_name'),
    keyword: z.string().optional().describe('For action=search/migrations: keyword to search'),
  },
  async ({ action, table_name, keyword }) => {
    let result;
    switch (action) {
      case 'list':
        result = listSchemas();
        if (result.error) return { content: [{ type: 'text', text: result.error }] };
        const schemaList = Object.entries(result.schemas)
          .map(([schema, tables]) => `${schema} (${tables.length} tables):\n  ${tables.join(', ')}`)
          .join('\n\n');
        return { content: [{ type: 'text', text: `${result.total_schemas} schemas, ${result.total_tables} tables, ${result.total_columns} columns\n\n${schemaList}` }] };
      
      case 'table':
        if (!table_name) return { content: [{ type: 'text', text: 'table_name is required for action=table' }] };
        result = getTable(table_name);
        if (result.error) return { content: [{ type: 'text', text: result.error }] };
        const tableDetails = result.tables.map(t => {
          const cols = t.columns.map(c => 
            `  ${c.name.padEnd(30)} ${c.type.padEnd(25)} ${c.nullable ? 'NULL' : 'NOT NULL'}${c.default ? ` DEFAULT ${c.default.slice(0, 40)}` : ''}`
          ).join('\n');
          let output = `${t.full_name} (${t.columns.length} columns):\n${cols}`;
          
          // Include migration info if available
          if (t.migration) {
            output += `\n\n  Migration Info:`;
            if (t.migration.created_in) output += `\n    Created in: ${t.migration.created_in}`;
            if (t.migration.altered_in && t.migration.altered_in.length > 0) {
              output += `\n    Altered in: ${t.migration.altered_in.join(', ')}`;
            }
            if (t.migration.indexes && t.migration.indexes.length > 0) {
              output += `\n    Indexes: ${t.migration.indexes.map(i => i.columns.join('+') + (i.type === 'unique' ? ' (unique)' : '')).join(', ')}`;
            }
            if (t.migration.foreign_keys && t.migration.foreign_keys.length > 0) {
              output += `\n    FKs: ${t.migration.foreign_keys.map(fk => `${fk.column} -> ${fk.table}.${fk.references}`).join(', ')}`;
            }
          }
          return output;
        }).join('\n\n');
        return { content: [{ type: 'text', text: tableDetails }] };
      
      case 'search':
        if (!keyword) return { content: [{ type: 'text', text: 'keyword is required for action=search' }] };
        result = searchSchema(keyword);
        if (result.error) return { content: [{ type: 'text', text: result.error }] };
        let output = `Search: "${keyword}"\n\n`;
        if (result.matching_tables.length > 0) {
          output += `Tables (${result.matching_tables.length}):\n`;
          output += result.matching_tables.map(t => `  ${t.full_name} (${t.column_count} cols)`).join('\n');
          output += '\n\n';
        }
        if (result.matching_columns.length > 0) {
          output += `Columns (${result.matching_columns.length}):\n`;
          output += result.matching_columns.map(c => `  ${c.table}.${c.column} (${c.type}${c.nullable ? ', nullable' : ''})`).join('\n');
        }
        return { content: [{ type: 'text', text: output }] };
      
      case 'migrations':
        result = getMigrationPatterns(keyword || '');
        if (result.error) return { content: [{ type: 'text', text: result.error + (result.hint ? `\n\n${result.hint}` : '') }] };
        let migOutput = `Migration Patterns${keyword ? ` for "${keyword}"` : ''}\n\n`;
        
        if (result.common_patterns) {
          migOutput += 'Common Column Types:\n';
          const types = Object.entries(result.common_patterns.column_types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          migOutput += types.map(([type, count]) => `  ${type}: ${count}`).join('\n');
          migOutput += '\n\n';
        }
        
        if (result.matching_tables.length > 0) {
          migOutput += `Tables (${result.matching_tables.length}):\n`;
          for (const t of result.matching_tables.slice(0, 10)) {
            migOutput += `\n  ${t.table}:\n`;
            migOutput += `    Created: ${t.created_in || 'unknown'}\n`;
            if (t.altered_in.length > 0) migOutput += `    Altered: ${t.altered_in.slice(0, 3).join(', ')}\n`;
            migOutput += `    Stats: ${t.column_count} cols, ${t.index_count} indexes, ${t.fk_count} FKs\n`;
            if (t.columns.length > 0) {
              migOutput += `    Columns: ${t.columns.slice(0, 5).map(c => `${c.name}(${c.type})`).join(', ')}${t.columns.length > 5 ? '...' : ''}\n`;
            }
          }
        }
        
        if (result.matching_migrations.length > 0) {
          migOutput += `\nRecent Matching Migrations:\n`;
          for (const m of result.matching_migrations.slice(0, 5)) {
            migOutput += `  ${m.file}: creates=${m.tables_created.join(',')||'none'}, alters=${m.tables_altered.join(',')||'none'}\n`;
          }
        }
        
        return { content: [{ type: 'text', text: migOutput }] };
      
      case 'recent':
        result = getRecentMigrations(10);
        if (result.error) return { content: [{ type: 'text', text: result.error }] };
        let recentOutput = `Recent Migrations (${result.total_migrations} total):\n\n`;
        for (const m of result.recent) {
          recentOutput += `${m.file}\n`;
          recentOutput += `  ${m.timestamp || 'no timestamp'}\n`;
          if (m.tables_created.length > 0) recentOutput += `  Creates: ${m.tables_created.join(', ')}\n`;
          if (m.tables_altered.length > 0) recentOutput += `  Alters: ${m.tables_altered.join(', ')}\n`;
          recentOutput += `  Stats: ${m.column_count} cols, ${m.index_count} idx, ${m.fk_count} fk\n\n`;
        }
        return { content: [{ type: 'text', text: recentOutput }] };
      
      default:
        return { content: [{ type: 'text', text: 'Invalid action. Use: list, table, search, migrations, or recent' }] };
    }
  }
);

// 12. get_test_patterns — find existing test patterns by domain
server.tool(
  'get_test_patterns',
  'Find existing test patterns for a domain. Returns test files, mocks, describe blocks, test cases, and assertion patterns. Essential for Checkpoint 3 (Test Strategy) — follow existing test patterns exactly.',
  {
    domain: z.string().describe('Domain keyword to search for (e.g. "credit_note", "finance_application", "auth")'),
  },
  async ({ domain }) => {
    const result = getTestPatterns(domain);
    if (result.test_files_found === 0) {
      return { content: [{ type: 'text', text: result.message }] };
    }

    let output = `Test patterns for "${domain}": ${result.test_files_found} test files\n`;
    output += `Common mocks: ${result.common_mocks.join(', ')}\n\n`;

    for (const file of result.files) {
      if (file.error) {
        output += `${file.path}: ERROR - ${file.error}\n`;
        continue;
      }
      output += `--- ${file.path} (${file.line_count} lines) ---\n`;
      output += `Mocks: ${file.mocks.join(', ')}\n`;
      output += `Describes: ${file.describes.join(', ')}\n`;
      output += `Tests (${file.tests.length}): ${file.tests.slice(0, 10).join('; ')}${file.tests.length > 10 ? '...' : ''}\n`;
      output += `Setup: ${Object.entries(file.setup).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}\n`;
      output += `Assertions: ${file.assertion_patterns.join(', ')}\n`;
      output += `\nPreview (first 100 lines):\n${file.preview}\n\n`;
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  // Initialize BM25 index (preload)
  const bm25 = require('./db/bm25-client');
  await bm25.init();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[mcp] Developer Agent MCP server started (stdio)');
}

main().catch(err => {
  console.error('[mcp] Fatal error:', err);
  process.exit(1);
});
