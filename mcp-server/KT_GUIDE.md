# MCP Server — Team Knowledge Transfer Guide

A complete walkthrough of building Model Context Protocol servers, taught through our own `developer-agent` MCP server. Use this as both a session outline (live demos + code walk) and a take-home reference.

---

## Session Agenda (~75 minutes)

| # | Block | Duration | Format |
|---|---|---|---|
| 1 | What MCP is, why we use it | 10 min | Slides / talk |
| 2 | Anatomy of our server (`index.js` walk) | 10 min | Live editor |
| 3 | Tool deep-dive — simple + complex | 15 min | Live editor |
| 4 | Live demo: MCP Inspector | 10 min | Terminal + browser |
| 5 | Live demo: Claude Desktop + Cursor | 10 min | Desktop app |
| 6 | Review of gaps / how we'd harden | 10 min | Discussion |
| 7 | Q&A + action items | 10 min | — |

---

## Block 1 — What MCP Is (10 min)

### One-liner
**MCP is a USB-C port for LLM clients.** A client (Claude Desktop, Cursor, Claude Code) plugs into an MCP server and gains access to tools, data, and prompt templates through a uniform JSON-RPC interface.

### The three primitives

| Primitive | What it is | Example from our world |
|---|---|---|
| **Tools** | Side-effectful functions the model may call | `search_codebase(query)` |
| **Resources** | Readable content at stable URIs | A file, a DB row, a dashboard snapshot |
| **Prompts** | User-triggered prompt templates | `/review-prd`, `/summarize-repo` |

Our server exposes **Tools only** — intentional. Tools are the most useful primitive for code-editor clients. Resources matter when you want files in a sidebar; Prompts matter when you want slash-commands.

### The two common transports

- **stdio** — MCP server runs as a subprocess of the client; bytes flow over stdin/stdout. Best for local desktop integrations. *We use this.*
- **Streamable HTTP / SSE** — MCP server is a remote service. Best for hosted/multi-user or cross-device use.

### Why we care
- One server → many clients (Cursor, Claude Desktop, Claude Code, claude.ai connectors).
- Keeps business logic out of prompts.
- Capability discovery is automatic — the model sees tool schemas without custom wiring.

---

## Block 2 — Anatomy of Our Server (10 min)

### Three conceptual layers

```
┌─────────────────────────────────────────────┐
│ 1. Transport     (stdio / HTTP / SSE)       │  ← how bytes move
├─────────────────────────────────────────────┤
│ 2. Protocol      (McpServer from the SDK)   │  ← JSON-RPC, tool registration
├─────────────────────────────────────────────┤
│ 3. Business      (our tool functions)       │  ← actual work
└─────────────────────────────────────────────┘
```

Where each layer lives in our repo:

| Layer | File / line |
|---|---|
| Transport | `index.js:476-477` — `new StdioServerTransport()` |
| Protocol  | `index.js:58-61` — `new McpServer({...})` + `server.tool(...)` calls |
| Business  | `mcp-server/tools/*.js` — the actual implementations |

**Teaching point:** the MCP SDK is a thin adapter. The real work is in `tools/`. Don't let "MCP" feel like new territory — it's plain Node code with a thin protocol shim.

### Dependencies we use
- `@modelcontextprotocol/sdk` — the official SDK (`McpServer`, `StdioServerTransport`)
- `zod` — input validation and schema-to-JSON-Schema for the LLM
- (everything else is our own retrieval stack: BM25, Qdrant, SQLite)

### Startup sequence (`index.js:471-484`)
```js
async function main() {
  await bm25.init();                              // (1) warm up deps
  const transport = new StdioServerTransport();   // (2) pick transport
  await server.connect(transport);                // (3) start accepting requests
  console.error('[mcp] started');                 // (4) stderr-only log
}
main().catch(err => { console.error(err); process.exit(1); });
```

Four rules that come out of this:
1. **Async init before `connect`.** Don't accept calls until dependencies are ready.
2. **stdout is reserved for the protocol.** Always `console.error`, never `console.log`.
3. **Crash loudly** — `process.exit(1)` so the client log tells the user what happened.
4. **Preload what's expensive** — our BM25 index is loaded once, not per-call.

---

## Block 3 — Tool Deep-Dive (15 min)

### 3a. Anatomy of a tool registration

Using `search_codebase` at `index.js:80-112`:

```js
server.tool(
  'search_codebase',                    // (a) name
  'Search the codebase using ...',      // (b) description — for the LLM
  {                                     // (c) input schema (zod)
    query: z.string().describe('...'),
    limit: z.number().optional().default(20).describe('...'),
    lambda: z.number().optional().default(0.5).describe('...'),
  },
  async ({ query, limit, lambda }) => { // (d) handler
    const { degraded, results } = await searchCodebase(query, limit, lambda);
    return { content: [{ type: 'text', text: ... }] };
  }
);
```

Five teaching points:

1. **Name is LLM-visible.** Use snake_case, verb_noun. `search_codebase` beats `search`.
2. **The description is a prompt.** The model picks tools based purely on name + description. Include *when to call this* and *when NOT to*. Our `lambda=0.5` vs `0.8` hint is a good example.
3. **Every zod field gets `.describe()`.** That text flows straight to the LLM.
4. **Handlers are plain async functions.** You can throw, but returning an error string is friendlier — the model can react.
5. **Return shape:** `{ content: [{ type: 'text', text: ... }] }`. Other types exist (`image`, `resource`), but text covers 95% of cases.

### 3b. Simple tool — `read_file` (`tools/read-file.js`)

```js
function readFile(filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(config.targetCodebase, filePath);
  if (!fs.existsSync(absolute)) return { error: `File not found: ${filePath}` };
  const content = fs.readFileSync(absolute, 'utf-8');
  return { path: filePath, content, lines: content.split('\n').length };
}
```

Teaching beats:
- Dead simple — tools don't need to be clever.
- Input validation is done by zod at the protocol layer; the handler trusts its args.
- Errors returned as data, not thrown.
- **⚠️ Security note (see Block 6):** this function has a path-traversal vulnerability. Worth calling out now as a setup for the hardening discussion.

### 3c. Complex tool — `search_codebase` (`tools/search-codebase.js`)

Walk through the key patterns (don't read line-by-line — highlight these):

| Pattern | Where |
|---|---|
| Parallel backend calls | `lines 67-109` — vector + BM25 fired together with `Promise.all` |
| Explicit success/error envelopes | `.then(r => ({ success: true, ... })).catch(...)` |
| Graceful degradation | `lines 111-161` — returns partial results with a `degraded` flag if one backend fails |
| Query enhancement | `lines 44-58` — decomposition + HyDE applied before search |
| Structured return | `{ degraded, results, enhanced }` — handler formats it for the LLM |

This is the canonical "production MCP tool" shape: *validate → fan out to backends → fuse → log → return structured data.*

### 3d. Where handlers end and business logic starts

Notice the split:
- `index.js` — short registration + output formatting for the LLM.
- `tools/*.js` — long, testable, framework-free functions.

**Rule of thumb:** the handler body in `index.js` should be ~10 lines. Parse args → call tool → format → return. Anything longer belongs in `tools/`.

Our `get_db_schema` handler at `index.js:314-431` is a counter-example (~120 lines) — flag this in Block 6.

---

## Block 4 — Live Demo: MCP Inspector (10 min)

### What it is
Official web UI from Anthropic for poking at any MCP server. Lists tools/resources/prompts, lets you call them with arbitrary args, shows raw JSON-RPC traffic.

### Run it
```bash
npx @modelcontextprotocol/inspector node mcp-server/index.js
```

### What to show the team
1. **Tool list** tab — show every tool the client sees, with its description and JSON Schema.
2. **Call a simple tool** — `get_repo_map` with no args. Point at the response format.
3. **Call a tool with args** — `search_codebase` with `query: "finance application approval flow"`. Show the returned text.
4. **Trigger an error path** — `read_file` with a non-existent path. Show the error message returned as content.
5. **Show the stderr log** — our `[search] ...` log lines go to the Inspector's server log panel. Explain *why* stdout is off-limits.

This tool is the single biggest productivity win for MCP development — get the team comfortable with it.

---

## Block 5 — Live Demo: Claude Desktop + Cursor (10 min)

### Claude Desktop

Config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "developer-agent": {
      "command": "node",
      "args": ["/Users/sarvang.jain/Work/Repos/developer-agent-e2e/mcp-server/index.js"]
    }
  }
}
```

Restart Claude Desktop. Tools appear behind the 🔌 icon.

### Cursor

`~/.cursor/mcp.json` — identical schema. Our server is already registered.

### Claude Code

One-liner:
```bash
claude mcp add developer-agent -- node /abs/path/to/mcp-server/index.js
```

### What to demo
1. Ask the model a codebase question ("how does credit note creation work?") and watch it call `search_codebase` → `read_file`.
2. Show the tool call / tool result blocks in the conversation UI.
3. Open the client's MCP log panel — show stderr logs flowing in.
4. Kill the subprocess (`pkill -f mcp-server/index.js`) and show what the client does when the server dies.

---

## Block 6 — Gap Review: How We'd Harden This (10 min)

Ten concrete improvements, in priority order. Use this as a team discussion — assign owners.

### P0 — Security

**(1) Path traversal in `read-file` / `list-directory` / `grep-codebase`**
Right now `readFile("../../etc/passwd")` escapes the codebase root. Fix pattern:
```js
const root = path.resolve(config.targetCodebase);
const absolute = path.resolve(root, filePath);
if (!absolute.startsWith(root + path.sep)) return { error: 'Path outside root' };
```
*General MCP lesson: treat all tool inputs as adversarial — LLMs relay untrusted text.*

### P1 — Maintainability

**(2) Fat handler in `get_db_schema`** (`index.js:314-431`)
~120 lines of formatting logic inline. Move the switch into `tools/get-db-schema.js`. Handlers should be ≤10 lines.

**(3) Duplicate chunk formatter** (`index.js:103-108` and `161-166`)
Extract a `formatChunk(r)` helper. Small, but a nice teaching moment: **handlers are a view layer**.

**(4) "CargoFin" hard-coded in tool descriptions** (`index.js:70`)
If we ever reuse this server, project-name leakage confuses the LLM. Parameterize or generalize.

### P2 — Operational hygiene

**(5) `version: '1.0.0'` never bumped** (`index.js:61`)
Tool signatures have evolved (Phase 2, Phase 3). Bump on every contract change — clients cache metadata.

**(6) No SIGTERM handler**
When the client kills the subprocess, SQLite/Qdrant handles leak. Add:
```js
process.on('SIGTERM', async () => { await bm25.close(); process.exit(0); });
```

**(7) Side-effects on import**
Some tool modules open DB handles at `require` time. Prefer explicit init in `main()` (like we do for BM25) or lazy-init on first call.

### P3 — Quality

**(8) No tests on the MCP layer**
Tool handlers are plain async functions — testable without a client. Add a small `test/` with representative args and assertions on `content[0].text`.

**(9) No structured output**
Every tool returns text. Newer MCP SDKs support typed output schemas. Direction of travel — not urgent, but teach the team it exists.

**(10) No `resources` or `prompts`**
Tools-only is a deliberate choice. Worth mentioning during the KT so the team knows the full surface area exists if we need it later.

### Minimum hardening before the KT
1. Path-traversal guard (P0/security)
2. Extract `formatChunk` + refactor `get_db_schema` handler (P1/maintainability)
3. Bump `version` + remove "CargoFin" (P1/polish)
4. SIGTERM handler (P2/ops)

The rest can be "future work" slides.

---

## Block 7 — Q&A + Action Items (10 min)

### Likely questions
- *"How does the model know which tool to pick?"* — purely from name + description + input schema. That's why description quality is load-bearing.
- *"Can tools stream results?"* — Yes, newer SDK supports progress notifications. Not used today.
- *"How do we authenticate?"* — stdio inherits trust from the client. HTTP needs OAuth or bearer tokens.
- *"Can tools call other tools?"* — not directly. The *model* orchestrates tool calls. You can internally chain, but the client doesn't see it.
- *"How do we version-migrate a tool?"* — bump server version, keep old tool name alive, add new tool with `_v2` suffix, deprecate old one in its description.

### Action items template

| # | Item | Owner | Due |
|---|---|---|---|
| 1 | Path-traversal guard in file tools | | |
| 2 | Refactor `get_db_schema` handler | | |
| 3 | Extract `formatChunk` helper | | |
| 4 | Bump server version + remove CargoFin strings | | |
| 5 | Add SIGTERM / SIGINT handler | | |
| 6 | Add 3–5 unit tests on tool handlers | | |
| 7 | Decide: do we want `prompts` for `/review-prd`? | | |

---

## Appendix A — Minimal MCP Server (for contrast)

A ~40-line reference the team can riff on when starting a new server:

```js
'use strict';
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const server = new McpServer({ name: 'hello-mcp', version: '0.1.0' });

server.tool(
  'echo',
  'Echo back the input string. Use when you want to test connectivity.',
  { message: z.string().describe('text to echo back') },
  async ({ message }) => ({
    content: [{ type: 'text', text: `you said: ${message}` }],
  })
);

server.tool(
  'add',
  'Add two numbers. Use for arithmetic the model struggles with.',
  {
    a: z.number().describe('first addend'),
    b: z.number().describe('second addend'),
  },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  })
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error('[hello-mcp] started');
}
main().catch(err => { console.error(err); process.exit(1); });
```

Register in Claude Desktop:
```json
{
  "mcpServers": {
    "hello-mcp": {
      "command": "node",
      "args": ["/abs/path/to/hello-mcp.js"]
    }
  }
}
```

---

## Appendix B — Useful Commands

| Task | Command |
|---|---|
| Run Inspector on our server | `npx @modelcontextprotocol/inspector node mcp-server/index.js` |
| Register with Claude Code | `claude mcp add developer-agent -- node $(pwd)/mcp-server/index.js` |
| List registered Claude Code servers | `claude mcp list` |
| Remove a registration | `claude mcp remove developer-agent` |
| Tail our server's stderr (when spawned by client) | Check the client's MCP log panel |

---

## Appendix C — Further Reading

- MCP spec: https://modelcontextprotocol.io
- Official servers (reference implementations): https://github.com/modelcontextprotocol/servers
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Inspector: https://github.com/modelcontextprotocol/inspector

---

## Appendix D — Our Tools at a Glance

| Tool | Purpose | File |
|---|---|---|
| `get_repo_map` | Structural overview of the codebase | `tools/get-repo-map.js` |
| `search_codebase` | Hybrid BM25 + vector search | `tools/search-codebase.js` |
| `advanced_search` | Phase 3 retrieval (cross-encoder, agentic, Layer 0) | `tools/advanced-retrieval.js` |
| `get_query_stats` | Query log stats | `tools/query-enhancer.js` |
| `get_symbol` | Exact symbol lookup | `tools/get-symbol.js` |
| `get_routes` | Express route query | `tools/get-routes.js` |
| `get_dependencies` | Dependency graph traversal | `tools/get-dependencies.js` |
| `search_prd_history` | Historical PRD search | `tools/search-prd-history.js` |
| `get_prd` | Full historical PRD by name | `tools/get-prd.js` |
| `read_file` | Read a codebase file | `tools/read-file.js` |
| `list_directory` | List a codebase directory | `tools/list-directory.js` |
| `grep_codebase` | Pattern search across the codebase | `tools/grep-codebase.js` |
| `get_db_schema` | Schema + migration pattern queries | `tools/get-db-schema.js` |
| `get_test_patterns` | Find existing test patterns by domain | `tools/get-test-patterns.js` |
