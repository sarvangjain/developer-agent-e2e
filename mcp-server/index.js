'use strict';

/**
 * MCP Server — Developer Agent
 * 
 * Exposes codebase retrieval tools to Cursor via the Model Context Protocol.
 * Runs as a stdio process registered in ~/.cursor/mcp.json.
 * 
 * Tools:
 *   get_repo_map        — compressed structural overview of the codebase
 *   search_codebase     — hybrid BM25 + vector search with MMR re-ranking
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

// 2. search_codebase — hybrid search
server.tool(
  'search_codebase',
  'Search the codebase using hybrid BM25 + semantic vector search with diversity re-ranking. Use for finding code that handles specific features, patterns, or concepts. Use lambda=0.5 for broad PRD queries, lambda=0.8 for specific function lookups.',
  {
    query: z.string().describe('Natural language search query'),
    limit: z.number().optional().default(20).describe('Max results to return (default 20)'),
    lambda: z.number().optional().default(0.5).describe('MMR diversity: 0.5=diverse/broad, 0.8=relevant/specific'),
  },
  async ({ query, limit, lambda }) => {
    const results = await searchCodebase(query, limit, lambda);
    const formatted = results.map(r =>
      `[${r.rank}] ${r.file_path}${r.function_name ? '#' + r.function_name : ''}\n` +
      `    ${r.description || 'No description'}\n` +
      `    Layer: ${r.layer || 'unknown'} | Module: ${r.module || 'unknown'} | Lines: ${r.start_line}-${r.end_line}\n` +
      `    Code:\n${r.code.slice(0, 500)}${r.code.length > 500 ? '\n    ... (truncated)' : ''}`
    ).join('\n\n');
    return { content: [{ type: 'text', text: formatted || 'No results found' }] };
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
