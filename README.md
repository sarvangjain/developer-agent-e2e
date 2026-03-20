# PRD-to-Feature Agent

**Transform Product Requirements into Production Code**

An AI-powered development tool that converts PRDs into working, tested features that match your existing codebase patterns. Drop a PRD into a file, run the agent, and get production-ready code that looks like it was written by a senior developer on your team.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** | Complete technical deep-dive: architecture, design decisions, phase-by-phase breakdown, alternatives comparison |
| **[SYSTEM_DIAGRAMS.md](./SYSTEM_DIAGRAMS.md)** | Visual diagrams (Mermaid): architecture, workflows, data flows, comparisons |
| **[AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md)** | System prompt for AI agents (Claude Desktop / Cursor) |
| **[.agent-rules.json](./.agent-rules.json)** | Machine-readable project configuration |

---

## 🎯 What Problem Does This Solve?

**Traditional AI code generation fails because:**
- ❌ No codebase context — doesn't know your patterns, conventions, or architecture
- ❌ Hallucinated imports — invents functions that don't exist
- ❌ Generic boilerplate — code doesn't match your style
- ❌ No historical memory — can't learn from past features

**Pure RAG (vector search) doesn't solve it:**
- ❌ Returns 10 structurally identical results (e.g., 10 auth route handlers)
- ❌ Misses architectural diversity (no middleware, services, tests)
- ❌ Can't find exact name matches (vector search is semantic, not keyword)

**Our solution: 4-Layer Hybrid Retrieval**
- ✅ Structural awareness (repo map + dependency graph)
- ✅ Semantic + keyword search (BM25 + vector + RRF + MMR)
- ✅ Architectural diversity (MMR ensures route + service + middleware + test)
- ✅ Historical context (PRD history search)

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│   PART 1            │         │   PART 2            │         │   PART 3         │
│   Indexing          │  feeds  │   MCP Server        │  tools  │   AI Client      │
│   Pipeline          ├────────▶│   (Node.js)         ├────────▶│   (Claude/Cursor)│
│   (Offline)         │         │   Retrieval Engine  │  called │   Orchestration  │
└─────────────────────┘         └─────────────────────┘   by    └──────────────────┘
```

### The 4-Layer Retrieval Stack

1. **Layer 1: Repo Map** — Always-in-context structural overview (4.7K tokens)
2. **Layer 2: Hybrid Search** — BM25 + vector + RRF merge + MMR re-ranking
3. **Layer 3: Dependency Graph** — Traverse imports/exports to expand context
4. **Layer 4: Agentic File Access** — read_file, list_directory, grep_codebase

**See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for full details**

---

## 📊 Current Stats

| Metric | Value |
|--------|-------|
| **Codebase size** | 655,000 lines |
| **Files indexed** | 694 application files |
| **Functions extracted** | 6,375 |
| **Routes mapped** | 482 |
| **Code chunks** | 5,024 |
| **Vectors stored** | 5,022 (Qdrant) |
| **Dependency edges** | 3,279 (SQLite) |
| **Repo map size** | 4,740 tokens |
| **Full index time** | ~48 minutes (32 min automated) |
| **Incremental update** | ~35 seconds |
| **Search latency** | ~70ms |
| **Test query success** | 5/5 (100%) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (for Qdrant)
- Ollama (for local embeddings)
- Claude Desktop or Cursor IDE

### Setup (5 minutes)

```bash
# 1. Clone and install
cd /path/to/developer-agent-e2e
npm install

# 2. Start Qdrant
docker compose up -d

# 3. Install Ollama and pull embedding model
brew install ollama
ollama serve  # Keep running in separate terminal
ollama pull nomic-embed-text

# 4. Run full index (first time only)
node indexer/run-indexer.js --mode=full
# Takes ~48 minutes (includes manual description generation)

# 5. Configure MCP in Claude Desktop
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "developer-agent": {
      "command": "node",
      "args": ["/path/to/developer-agent-e2e/mcp-server/index.js"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "OLLAMA_URL": "http://127.0.0.1:11434"
      }
    }
  }
}

# 6. Restart Claude Desktop
# Verify MCP server appears in Tools & Resources
```

### First Feature (10 minutes)

```bash
# 1. Write a PRD
cat > prds/current.md << 'EOF'
# PRD: Health Check Endpoint

## Requirements
1. GET /health returns application status
2. Check database connectivity (SELECT 1)
3. No authentication required
4. Response time <500ms
EOF

# 2. Open Claude Desktop, say:
"Read AGENT_INSTRUCTIONS.md and implement the feature in prds/current.md"

# 3. Agent will:
#    - Call get_repo_map()
#    - Search for similar endpoints
#    - Generate implementation plan
#    - Wait for your approval
#    - Generate code + tests
#    - Run lint + tests
#    - Surface diffs for review
```

---

## 🔄 Incremental Updates

After changing your codebase:

```bash
# Re-index only changed files (~35 seconds)
node indexer/run-indexer.js --mode=incremental
```

Or add a git hook:

```bash
# .git/hooks/post-commit
#!/bin/bash
cd /path/to/developer-agent-e2e
node indexer/run-indexer.js --mode=incremental
```

---

## 🛠️ Tech Stack

| Component | Technology | Why? |
|-----------|------------|------|
| **AST Parser** | tree-sitter (WASM) | Error recovery, proven at GitHub scale |
| **Vector DB** | Qdrant (self-hosted) | Server-side MMR, free, local |
| **Embedding** | nomic-embed-text (Ollama) | Zero cost, runs locally, 768 dims |
| **BM25** | @orama/orama | Pure Node.js, fast in-memory |
| **Symbol Map** | SQLite | Zero-config, fast exact lookups |
| **MCP Framework** | @modelcontextprotocol/sdk | Standard for AI tool integration |
| **AI Clients** | Claude Desktop, Cursor | Native MCP support |

---

## 📈 Performance

### Index Build
- **Full index:** ~48 minutes (first time)
  - Parse: 1 min
  - Description generation: 30 min (manual with Cursor)
  - Embedding: 15 min (local Ollama)
  - Symbol map + repo map: <10 sec

- **Incremental (10 files):** ~35 seconds

### Query Performance
- **Repo map read:** <1ms
- **BM25 search:** ~5ms
- **Vector search:** ~50ms
- **RRF merge + MMR:** ~12ms
- **Total search latency:** ~70ms

### Storage
- **Qdrant vectors:** 150 MB (5,022 points × 768 dims)
- **SQLite symbol map:** 8 MB
- **BM25 index:** 12 MB
- **Repo map:** 25 KB
- **Total:** ~220 MB

---

## 🧪 Validation Results

5 test queries, 100% success rate:

| Query | Expected | Result | ✓/✗ |
|-------|----------|--------|-----|
| "Express middleware that handles authentication" | access_control.js | ✅ access_control + rate_limit + auth docs | ✅ |
| "loginUser function" | auth.js#loginUser | ✅ auth.js#loginUser | ✅ |
| "Credit facility workflow" | Route + service + DB | ✅ All 3 layers + dependencies | ✅ |
| "Rate limiting middleware" | rate_limit.js | ✅ rate_limit.js + usage docs | ✅ |
| "Email notification" | email.js + notification.js | ✅ Both + queue service | ✅ |

**Comparison:**
- Hybrid (BM25 + Vector + MMR): **5/5 (100%)**
- BM25 only: 4/5 (80%)
- Vector only: 3/5 (60%)

---

## 🎓 How It Works

### The Full Workflow (3-Phase, 8-Checkpoint)

```
PHASE 1: ANALYSIS (Single Conversation)
┌─────────────────────────────────────────────────────────────────────┐
│ PRD → ✋ Requirements Validation → ✋ Module Decomposition           │
│                                    (break into independent modules) │
│        → ✋ Data Model Overview (full schema for all modules)       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
PHASE 2: MODULE EXECUTION (Fresh Context per Module, Parallelizable)
┌─────────────────────────────────────────────────────────────────────┐
│ For each module:                                                    │
│   ✋ Module Design → ✋ Module Implementation → ✋ Module Testing     │
│                                                                      │
│ Modules with no dependencies can run in PARALLEL                    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
PHASE 3: INTEGRATION (Fresh Context)
┌─────────────────────────────────────────────────────────────────────┐
│ ✋ Integration & Quality Gate → ✋ Release Summary → Merge Ready!    │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Modules?**
- Large PRDs exhaust context windows
- Modules can be implemented by multiple agents in parallel
- Each module gets focused attention without context pollution
- Human reviews are smaller and more effective

### Why This Approach Works

**Problem:** Pure vector search returns:
```
Query: "user authentication"
Results: auth_route_1.js, auth_route_2.js, auth_route_3.js, login.js, logout.js...
         ❌ All structurally identical, missing middleware/service/tests
```

**Solution:** 4-layer retrieval returns:
```
Layer 1 (Repo Map):      Shows full auth module structure
Layer 2 (Hybrid Search): auth_route.js (BM25) + auth_middleware.js (vector + MMR)
Layer 3 (Dep Graph):     + auth_service.js, token_utils.js, session_storage.js
Layer 4 (File Access):   Agent reads specific files if needed
         ✅ Architecturally diverse, full stack context
```

---

## 🆚 Comparison: Why Not X?

### Why Not Pure RAG (Vector-Only)?
- ❌ Returns structurally homogenous results
- ❌ Misses exact name matches
- ❌ No architectural diversity
- ❌ Embeddings capture "what code talks about" not "how it connects"

### Why Not Espree (ESLint's parser)?
- ❌ No error recovery — one bad file crashes the run
- ❌ No cross-file resolution
- ❌ No scope analysis

### Why Not Cognee (Knowledge Graph)?
- ❌ Python-only, no confirmed JS support
- ❌ Pre-v1.0, unstable
- ❌ Requires cloud LLMs for entity extraction
- ❌ No code-specific implementation

### Why Not OpenAI Embeddings?
- ✅ We support OpenAI as an alternative
- ✅ But Ollama (nomic-embed-text) is:
  - Zero cost
  - Runs locally (data never leaves your machine)
  - Comparable quality for code
  - 768 dims = smaller, faster

**See [SYSTEM_ARCHITECTURE.md § Design Decisions](./SYSTEM_ARCHITECTURE.md#design-decisions--alternatives) for detailed comparisons**

---

## 📂 Project Structure

```
developer-agent-e2e/
├── indexer/              # Phase 1-2: Offline indexing pipeline
│   ├── parse-codebase.js
│   ├── build-symbol-map.js
│   ├── build-repo-map.js
│   ├── chunk-and-describe.js
│   ├── embed-and-store.js
│   └── run-indexer.js
│
├── mcp-server/           # Phase 3: MCP server (15 tools)
│   ├── index.js
│   ├── tools/            # get_repo_map, search_codebase, etc.
│   └── db/               # qdrant-client, bm25-client, rrf.js
│
├── index/                # Generated files (gitignored)
│   ├── repo-map.txt      # 4,740 token overview
│   ├── symbol-map.db     # SQLite: symbols + deps
│   ├── chunks.json       # 5,024 chunks
│   └── bm25-index.json
│
├── prds/
│   ├── current.md        # Active PRD
│   └── TEMPLATE.md
│
├── SYSTEM_ARCHITECTURE.md   # Complete technical documentation
├── SYSTEM_DIAGRAMS.md       # Visual diagrams (Mermaid)
├── AGENT_INSTRUCTIONS.md    # System prompt
├── .agent-rules.json        # Project config
└── docker-compose.yml       # Qdrant setup
```

---

## 🔧 Available MCP Tools

The agent has access to 15 tools:

**Context Tools**
- `get_repo_map()` — Structural overview (always called first)

**Retrieval Tools**
- `search_codebase(query, limit, lambda)` — Hybrid BM25+vector+MMR search
- `get_symbol(name)` — Exact function/class lookup
- `get_routes(domain)` — Find routes by domain
- `get_dependencies(file, direction, depth)` — Dependency graph traversal

**PRD History** (Phase 5)
- `search_prd_history(query)` — Find similar past features
- `get_prd(feature_name)` — Retrieve full historical PRD

**File Access**
- `read_file(path)`
- `list_directory(path)`
- `grep_codebase(pattern, glob)`

---

## 📅 Build Phases

- ✅ **Phase 1:** Structural parsing + repo map (COMPLETE)
- ✅ **Phase 2:** Hybrid index (BM25 + vector) (COMPLETE)
- ✅ **Phase 3:** MCP server (COMPLETE)
- ✅ **Phase 4:** AI client configuration (COMPLETE)
- ⏳ **Phase 5:** PRD history index (PLANNED)

---

## 🎯 Use Cases

### 1. Implement New Features
```
PRD → Agent → Plan → ✋ Review → Code + Tests → ✋ Review → Merge
```

### 2. Extend Existing Features
```
"Add email notification to credit approval workflow"
→ Agent finds existing approval code
→ Generates notification integration matching patterns
```

### 3. Fix Bugs with Context
```
"Login fails with 500 error for users without org"
→ Agent searches auth flow
→ Identifies missing null check
→ Generates fix + test
```

### 4. Explore Codebase
```
"How does rate limiting work in this codebase?"
→ Agent calls get_repo_map + search_codebase
→ Returns specific files + explanation
```

---

## 💡 Best Practices

### Writing PRDs
- Use the [TEMPLATE.md](./prds/TEMPLATE.md)
- Be specific about acceptance criteria
- Include API contracts (request/response shapes)
- List edge cases and constraints
- Mark "Out of Scope" to prevent scope creep

### Reviewing Plans
- **This is the highest-value checkpoint**
- Catching wrong assumptions here saves reviewing 500 lines of wrong code
- Clarify ambiguities before code generation
- Verify file paths match project structure

### Reviewing Diffs
- Check pattern consistency (error handling, naming, imports)
- Verify tests cover edge cases from PRD
- Look for hallucinated imports
- Ensure no business logic in controllers

---

## 🚧 Known Limitations

1. **Description generation is manual** — 30 min per full index (can automate with Claude API credits)
2. **No PRD history yet** — Phase 5 not implemented
3. **Single codebase** — Config is CargoFin-specific (easily adaptable)
4. **Cursor MCP blocked** — Works in Claude Desktop, pending enterprise unblock for Cursor

---

## 🔮 Roadmap

### Short Term
- [ ] Automate description generation with Claude API
- [ ] Implement Phase 5 (PRD history index)
- [ ] Add git pre-commit hook for auto-indexing
- [ ] Multi-codebase support

### Long Term
- [ ] Function-level call graph (currently file-level only)
- [ ] Test coverage analysis integration
- [ ] CI/CD failure history correlation
- [ ] Cross-project pattern learning

---

## 🤝 Contributing

This is a working prototype built for CargoFin Backend. To adapt for your project:

1. Update `indexer/config.js` with your codebase path and module aliases
2. Update `.agent-rules.json` with your conventions
3. Run `node indexer/run-indexer.js --mode=full`
4. Configure MCP in Claude Desktop / Cursor
5. Test with a simple PRD

See [SYSTEM_ARCHITECTURE.md § Extensibility](./SYSTEM_ARCHITECTURE.md#extensibility-notes) for details.

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **Aider** — Repo map concept
- **Anthropic** — MCP protocol
- **Qdrant** — Vector database with server-side MMR
- **tree-sitter** — Error-tolerant parsing
- **cAST research** — AST-aware chunking validation

---

## 📞 Questions?

Read the full documentation:
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — Technical deep-dive
- [SYSTEM_DIAGRAMS.md](./SYSTEM_DIAGRAMS.md) — Visual diagrams
- [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — How to use the agent

---

**Built with ❤️ for developers who want AI that understands their codebase**
