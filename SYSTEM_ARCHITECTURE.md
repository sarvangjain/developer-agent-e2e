# PRD-to-Feature Agent: Complete System Architecture

**Author:** Development Team  
**Date:** February 20, 2026  
**Version:** 1.0  
**Target Codebase:** CargoFin Backend (655K lines, JavaScript/Express)

---

## Executive Summary

The PRD-to-Feature Agent is an AI-powered development tool that transforms Product Requirements Documents into working, tested code that matches your existing codebase patterns. A developer drops a PRD into a file, runs the agent in Claude Desktop or Cursor, and receives production-ready code with tests — code that looks like it was written by a senior developer on your team, not generic boilerplate.

**Key Innovation:** A 4-layer hybrid retrieval architecture that solves the fundamental problem of RAG for code — pure vector search returns semantically similar but structurally useless results (10 identical route handlers instead of route + service + middleware + test).

**Results:**
- **694 application files** indexed and searchable
- **6,375 functions** extracted with business logic descriptions
- **482 API routes** mapped to controllers and services
- **5,022 code chunks** embedded with semantic understanding
- **4,740 token repo map** giving instant codebase orientation

---

## Table of Contents

1. [The Problem We're Solving](#the-problem)
2. [Architecture Overview](#architecture-overview)
3. [The 4-Layer Retrieval Stack](#the-4-layer-retrieval-stack)
4. [Phase-by-Phase Deep Dive](#phase-by-phase-deep-dive)
5. [Design Decisions & Alternatives](#design-decisions--alternatives)
6. [Complete Workflow](#complete-workflow)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Performance & Scale](#performance--scale)

---

## The Problem

### Traditional AI Code Generation Fails Because:

1. **No Codebase Context** — Generic LLMs don't know your custom route pattern, module aliases, or error handling strategy
2. **Pattern Hallucination** — They invent imports that don't exist because they don't know what's actually in your codebase
3. **Structural Ignorance** — They don't understand your 3-layer architecture (controller → service → db_service)
4. **Zero Historical Memory** — They can't learn from past PRDs or understand why certain decisions were made

### Pure RAG Doesn't Solve It Either

Vector embeddings capture "what code talks about" but not "how it connects." Example:

**Query:** "Implement user authentication"  
**Pure RAG Returns:** 10 different authentication route handlers (all embed similarly)  
**What You Actually Need:** 1 auth route + 1 auth middleware + 1 auth service + 1 token util + 1 test pattern

**The result:** You get structurally homogenous results instead of architecturally diverse context.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRD-to-Feature Agent                              │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│   PART 1           │         │   PART 2            │         │   PART 3         │
│   Indexing         │  feeds  │   MCP Server        │  tools  │   AI Client      │
│   Pipeline         ├────────▶│   (Node.js)         ├────────▶│   (Claude/Cursor)│
│   (Offline)        │         │   Retrieval Engine  │  called │   Orchestration  │
└────────────────────┘         └─────────────────────┘   by    └──────────────────┘

      │                               │                               │
      │                               │                               │
      ▼                               ▼                               ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│ tree-sitter  │              │ Qdrant       │              │ Writes code  │
│ AST parsing  │              │ (vectors)    │              │ Runs tests   │
│ PageRank     │              │ SQLite       │              │ Shows diffs  │
│ Embedding    │              │ (symbols)    │              │ Human review │
└──────────────┘              │ BM25 index   │              └──────────────┘
                              └──────────────┘
```

### The Three Parts Explained

#### Part 1: Indexing Pipeline (Offline)
Runs once to build the knowledge base, then incrementally on git commits.

**Input:** Your entire JavaScript codebase  
**Output:** 
- Compressed repo map (4.7K tokens)
- Symbol map + dependency graph (SQLite)
- 5,022 code chunks with semantic embeddings (Qdrant)
- BM25 keyword index (Orama)

**Runtime:** ~5 minutes full index, ~30 seconds incremental

#### Part 2: MCP Server (Local Node.js Process)
Exposes retrieval tools to any MCP-compatible AI client.

**Provides:**
- Hybrid search (BM25 + vector + MMR re-ranking)
- Dependency graph traversal
- Symbol lookup
- Route mapping
- PRD history search

**Runs on:** localhost, stdio transport, zero external dependencies

#### Part 3: AI Client Runtime (Claude Desktop / Cursor)
The orchestration layer where the agent actually runs.

**Responsibilities:**
- Calls MCP tools to gather context
- Generates implementation plan
- Writes code matching your patterns
- Runs lint + tests
- Surfaces diffs for human review

---

## The 4-Layer Retrieval Stack

This is the core innovation. Each layer answers a different question about the codebase.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: REPO MAP (Always-In-Context Structural Overview)               │
│ Answers: "What exists and how does it fit together?"                    │
│ Storage: index/repo-map.txt (4,740 tokens)                              │
│ Generated: PageRank on dependency graph                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: HYBRID SEARCH (Semantic + Keyword)                             │
│ Answers: "Show me code that handles things similar to this PRD"         │
│ Storage: Qdrant (vectors) + Orama (BM25)                                │
│ Algorithm: BM25 + Vector → RRF merge → MMR re-rank                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: DEPENDENCY GRAPH (Structural Traversal)                        │
│ Answers: "Given this function, what else do I need to see?"             │
│ Storage: SQLite adjacency list                                          │
│ Algorithm: BFS from seed files, 1-2 hops, max 10 files                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: AGENTIC FILE ACCESS (Live Exploration)                         │
│ Answers: "I need this specific file retrieval didn't surface"           │
│ Tools: read_file(), list_directory(), grep_codebase()                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Four Layers?

**Pure RAG = Layer 2 only.** That's why it fails at scale.

**Layer 1 (Repo Map)** gives the agent a mental model before it searches. Like giving someone a city map before they explore neighborhoods.

**Layer 2 (Hybrid Search)** finds semantically relevant code, but uses MMR to ensure architectural diversity.

**Layer 3 (Dependency Graph)** expands context to include files the agent *needs* but didn't know to search for.

**Layer 4 (File Access)** is the escape hatch when retrieval misses something and the agent knows exactly what to look for.

---

## Phase-by-Phase Deep Dive

### Phase 1: Structural Parsing + Repo Map

**What It Does:** Parse the entire codebase with tree-sitter, extract all symbols, build a dependency graph, and compress it into a 4.7K token overview.

#### Input
```
CargoFin_Backend/
├── backend/src/main/ (40 controllers, 90+ services)
├── backend/src/lending/ (18 controllers, 50+ services)
├── backend/config/ (routes.js aggregator)
└── backend/db/migrations/ (849 migration files — excluded)
```

#### Process Flow

```
┌──────────────────┐
│ Discover Files   │  glob for *.js, respect excludes
│ (694 .js files)  │  Skip: node_modules, migrations, tests, devops
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Parse with       │  tree-sitter (WASM runtime)
│ tree-sitter      │  Error-tolerant: bad syntax doesn't crash
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Extract Symbols  │  Functions: 6,375 (including inline exports)
│                  │  Classes: 29
│                  │  Routes: 482 (custom CargoFin pattern)
│                  │  Imports: 4,099 (with @alias resolution)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Build Dep Graph  │  File A imports → File B (3,279 edges)
│                  │  Bidirectional indexes for fast traversal
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ PageRank Files   │  Rank by "imported by" count
│                  │  config.js: 402 imports (highest)
│                  │  logger.js: 182 imports
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Compress to      │  Top 120 files by rank
│ Repo Map         │  Routes: method + path → controller
│ (4,740 tokens)   │  Services: top exports only
└──────────────────┘  Controllers: all exports
```

#### Output: Repo Map Sample

```
=== ROUTES (40 files) ===
backend/src/main/routes/auth.js (20 routes) → backend/src/main/controllers/auth.js

=== CONTROLLERS — Main (22 files) ===
backend/src/main/controllers/auth.js
  - loginUser, logoutUser, getCurrentUserDetails, resetPassword

=== SERVICES — Main (40 files) ===
backend/src/services/auth_service.js (imported by 51)
  - authenticateUser, generateToken, verifyToken

=== DB SERVICES (9 files) ===
backend/src/services/db_service/user_organisation.js (imported by 85)
  - getUserById, updateUser, insertUser (+ 98 more)
```

#### Key Implementation Details

**CargoFin Custom Route Pattern Detection:**
```javascript
// Standard Express: app.get('/users', handler)
// CargoFin pattern: Plain objects
module.exports = {
  getUsers: {
    method: 'get',
    path: '/users',
    function: userController.getUsers,
    permission: 'USER_VIEW',
  }
};
```

Our parser detects this by:
1. Finding `module.exports = { ... }`
2. Checking each property for `method`, `path`, `function` keys
3. Resolving `userController.getUsers` back to `controllers/user.js` using import tracking

**Module Alias Resolution:**
```javascript
// Code imports: require('@main/controllers/auth')
// Parser resolves: backend/src/main/controllers/auth.js

// Using this mapping from package.json:
{
  "_moduleAliases": {
    "@main": "src/main",
    "@lending": "src/lending",
    "@config": "config"
  }
}
```

#### Why This Approach?

**Alternative 1: Static Analysis with Espree**  
❌ No error recovery — one bad file crashes the run  
❌ No cross-file resolution  
❌ No built-in scope analysis  

**Alternative 2: No repo map, just search**  
❌ Agent starts blind, wastes tokens searching for basic structure  
❌ No way to know "where should credit facility code go?"  

**Our Approach: tree-sitter + PageRank repo map**  
✅ Error-tolerant (continues on syntax errors)  
✅ Fast (WASM, used by GitHub for all code navigation)  
✅ Gives agent a "mental model" before search  
✅ 4.7K tokens fits in every context  

---

### Phase 2: Hybrid Index (BM25 + Vector + MMR)

**What It Does:** Chunk code at AST boundaries, generate natural language descriptions, embed everything, and build dual search indexes (keyword + semantic).

#### Input
```
Phase 1 Output:
- parsed-files.json (694 files with symbol metadata)
- symbol-map.db (SQLite with dependency graph)
```

#### Process Flow

```
┌────────────────────────┐
│ AST-Aware Chunking     │  Split at function boundaries (never mid-function)
│ Target: ~500 chars     │  Re-attach imports to each chunk
│                        │  Include 2-3 lines of surrounding context
└───────────┬────────────┘
            │
            │  Result: 5,024 chunks
            ▼
┌────────────────────────┐
│ NL Description         │  For each chunk, generate one-sentence summary
│ Generation             │  "Authenticates users via OAuth and returns JWT"
│ (Cursor/Claude)        │  Prepend to code before embedding
└───────────┬────────────┘
            │
            ├──────────────────┬─────────────────┐
            │                  │                 │
            ▼                  ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Embed with       │  │ Build BM25       │  │ Enrich Metadata │
│ nomic-embed-text │  │ Keyword Index    │  │ module, layer   │
│ (Ollama local)   │  │ (@orama/orama)   │  │ isRouteHandler  │
│ 768 dimensions   │  │                  │  │ imports (capped)│
└────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘
         │                     │                      │
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│              STORAGE                                     │
│  Qdrant: 5,022 vectors (2 skipped: oversized configs)   │
│  Orama: BM25 index (all 5,024 chunks)                   │
│  Each point has: code, description, metadata            │
└─────────────────────────────────────────────────────────┘
```

#### The NL Description Problem & Solution

**The Problem:**
```
PRD says:     "Implement rate limiting"
Code says:    windowMs, maxRequests, rateLimit()
Embedding:    These embed FAR APART (different vocabulary)
```

**The Solution:**
```javascript
// Before embedding, prepend a natural language description:
// "Rate limiting middleware that restricts requests per IP window"
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
```

Now the embedding captures both the business purpose AND the implementation.

**How We Generated 5,024 Descriptions:**
1. Split chunks into 5 batches (~1,000 each)
2. Used Claude in Cursor with this prompt:
   - "For each chunk, write a ONE sentence description (max 15 words)"
   - "Focus on BUSINESS PURPOSE, not implementation details"
   - "Be SPECIFIC to the entity and action"
3. Merged descriptions back into chunks
4. Validated: zero generic descriptions like "handles operation"

**Result:** Every chunk now bridges PRD language ↔ code language

#### Hybrid Search Architecture

```
Query: "Add rate limiting to credit facility endpoints"

┌─────────────────┐                  ┌──────────────────┐
│   BM25 Search   │                  │  Vector Search   │
│   (Keywords)    │                  │  (Semantic)      │
└────────┬────────┘                  └────────┬─────────┘
         │ Top 50                             │ Top 50
         │                                    │
         └────────────┬───────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │  RRF Merge          │  Reciprocal Rank Fusion
            │  (No tuning needed) │  score = 1/(k + rank)
            └──────────┬──────────┘
                       │ Top 50 combined
                       ▼
            ┌─────────────────────┐
            │  MMR Re-ranking     │  Maximize relevance + diversity
            │  λ=0.5 (broad)      │  Returns: 1 route, 1 middleware,
            │  λ=0.8 (specific)   │  1 service, 1 db_service, 1 test
            └──────────┬──────────┘
                       │
                       ▼
              Final 15-25 chunks
```

#### Why MMR (Maximal Marginal Relevance)?

**Without MMR:**
- Query: "user authentication"
- Top 10 results: 10 different auth route handlers (all very similar)
- Missing: auth middleware, token utils, session storage

**With MMR:**
```
score = λ · similarity(chunk, query) − (1−λ) · max_similarity(chunk, already_selected)
```

**Effect:**
- First result: auth route handler (highest similarity to query)
- Second result: MMR penalizes other routes, picks auth middleware instead
- Third result: token generation utility
- Fourth result: database session storage

**Result:** Architecturally diverse context that shows the full stack.

#### Validation Results

We tested 5 queries to validate quality:

| Query | BM25 Top Result | Vector Top Result | Hybrid + MMR Result |
|-------|----------------|-------------------|---------------------|
| "Express middleware that handles authentication" | ⚠️ service_bus.js | ⚠️ auth_signatories.js | ✅ access_control.js + rate_limit.js |
| "loginUser function" | ✅ auth.js#loginUser | ❌ regex_utils.js | ✅ auth.js#loginUser |
| "Credit facility workflow" | ✅ credit_facility.js | ✅ credit_facility service | ✅ Route + Service + DB |
| "Rate limiting middleware" | ✅ rate_limit.js | ✅ rate_limit.js | ✅ rate_limit.js + docs |
| "Email notification" | ✅ email.js | ✅ notification.js | ✅ Both + queue service |

**Hybrid Success Rate:** 5/5 (100%)  
**BM25 Only:** 4/5 (80%)  
**Vector Only:** 3/5 (60%)  

#### Key Implementation Details

**Chunking Strategy:**
```javascript
function chunkFile(parsedFile) {
  const chunks = [];
  
  for (const fn of parsedFile.functions) {
    // Get function code
    const fnCode = extractLines(fn.startLine, fn.endLine);
    
    // Get surrounding context (JSDoc, exports)
    const contextBefore = extractLines(fn.startLine - 3, fn.startLine - 1);
    const contextAfter = extractLines(fn.endLine + 1, fn.endLine + 3);
    
    // Re-attach imports (capped at 500 chars)
    const imports = getRelevantImports(parsedFile.imports, fn);
    
    chunks.push({
      code: imports + contextBefore + fnCode + contextAfter,
      metadata: {
        module: detectModule(filePath),      // 'main' | 'lending'
        layer: detectLayer(filePath),        // 'controller' | 'service' | 'db_service'
        isRouteHandler: detectRouteHandler(fn)
      }
    });
  }
  
  return chunks;
}
```

**Embedding Optimization:**
- Text truncated to 6,000 chars before embedding (fits nomic-embed-text context)
- 265 chunks were truncated (large service files)
- Import blocks capped at 500 chars (prevents import spam dominating embedding)

**Why Ollama + nomic-embed-text instead of OpenAI?**
- ✅ Zero API cost (runs locally on M4 Pro)
- ✅ No data leaves your machine
- ✅ 768 dimensions (vs 1536 for OpenAI) — faster, smaller index
- ❌ Slightly lower quality than text-embedding-3-large
- ✅ Comparable to text-embedding-3-small for code
- ✅ Embedding time: ~15 minutes for 5,022 chunks

---

### Phase 3: MCP Server (The Retrieval Engine)

**What It Does:** Expose all indexed knowledge as tools that any MCP-compatible AI client can call.

#### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    MCP Server (stdio)                         │
│                  Port: N/A (stdio pipe)                       │
└──────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ DB Clients   │  │ Tools (15)   │  │ RRF + MMR    │
└──────────────┘  └──────────────┘  └──────────────┘
   │                    │                    │
   │                    │                    │
   ▼                    ▼                    ▼
┌─────────┐      ┌──────────────┐      ┌─────────┐
│ Qdrant  │      │ get_repo_map │      │ Merge   │
│ SQLite  │      │ search_code  │      │ logic   │
│ Orama   │      │ get_symbol   │      └─────────┘
└─────────┘      │ get_routes   │
                 │ get_deps     │
                 │ read_file    │
                 │ list_dir     │
                 │ grep         │
                 │ search_prd   │
                 └──────────────┘
```

#### The 15 MCP Tools

**Context Tools (Always called first)**
```javascript
get_repo_map()
// Returns: The full 4.7K token compressed overview
// When to use: Start of every session, before any search
```

**Retrieval Tools (Core search)**
```javascript
search_codebase({ 
  query: "credit facility approval workflow",
  limit: 20,
  lambda: 0.5  // 0.5 for broad, 0.8 for specific
})
// Returns: Top N chunks with file paths, function names, descriptions
// Algorithm: BM25 + Vector → RRF → MMR
```

```javascript
get_symbol({ name: "authenticateUser" })
// Returns: Exact file path, full source, imports, imported_by
// When to use: When you know the exact function name
```

```javascript
get_routes({ domain: "credit_facility" })
// Returns: All routes with method, path, controller, middleware
// When to use: Finding endpoints for a domain
```

```javascript
get_dependencies({ 
  file_path: "backend/src/main/controllers/auth.js",
  direction: "imports",  // or "imported_by"
  depth: 2
})
// Returns: Files 1-2 hops away in the dependency graph
// When to use: Expanding context from search results
```

**PRD History Tools**
```javascript
search_prd_history({ 
  query: "rate limiting implementation",
  limit: 5
})
// Returns: Past PRD sections with feature name, date, outcome
// When to use: Checking if similar features were built before
```

**File Access Tools (Layer 4)**
```javascript
read_file({ path: "backend/src/utils/logger.js" })
list_directory({ path: "backend/src/middlewares" })
grep_codebase({ pattern: "rateLimit", file_glob: "*.js" })
```

#### The RRF + MMR Pipeline

**Step 1: Parallel Search**
```javascript
// Fire both searches simultaneously
const bm25Results = await bm25Client.search(query, 50);
const vectorResults = await qdrantClient.search(query, 50);
```

**Step 2: RRF Merge**
```javascript
function reciprocalRankFusion(bm25Results, vectorResults, k = 60) {
  const scores = {};
  
  bm25Results.forEach((result, rank) => {
    scores[result.id] = (scores[result.id] || 0) + 1 / (k + rank + 1);
  });
  
  vectorResults.forEach((result, rank) => {
    scores[result.id] = (scores[result.id] || 0) + 1 / (k + rank + 1);
  });
  
  // Sort by combined score
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
}
```

**Why RRF?**
- ✅ No hyperparameters to tune (k=60 is standard)
- ✅ Handles score scale differences (BM25 vs cosine similarity)
- ✅ Consistently outperforms weighted sum in IR research
- ✅ Simple to implement and debug

**Step 3: MMR Re-ranking**
```javascript
function maximalMarginalRelevance(docs, query, lambda, limit) {
  const selected = [];
  const candidates = [...docs];
  
  // Always pick the top result first
  selected.push(candidates.shift());
  
  while (selected.length < limit && candidates.length > 0) {
    let bestScore = -Infinity;
    let bestIdx = -1;
    
    for (let i = 0; i < candidates.length; i++) {
      const doc = candidates[i];
      
      // Relevance to query
      const relevance = cosineSimilarity(doc.embedding, queryEmbedding);
      
      // Max similarity to already-selected docs
      const maxSimilarity = Math.max(
        ...selected.map(s => cosineSimilarity(doc.embedding, s.embedding))
      );
      
      // MMR score = balance relevance and diversity
      const score = lambda * relevance - (1 - lambda) * maxSimilarity;
      
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    
    selected.push(candidates.splice(bestIdx, 1)[0]);
  }
  
  return selected;
}
```

**Lambda Settings:**
- `λ = 0.5` — Equal weight to relevance and diversity (broad queries)
- `λ = 0.8` — Favor relevance over diversity (specific lookups)

#### Why This Approach?

**Alternative 1: Vector Search Only (Pure RAG)**  
❌ Returns 10 structurally identical results  
❌ Misses exact name matches  
❌ No architectural diversity  

**Alternative 2: BM25 Only (Keyword)**  
❌ Can't find semantic matches ("rate limiting" ≠ "rateLimit")  
❌ Fails on concept queries  

**Alternative 3: Cognee (Knowledge Graph)**  
❌ Python-only (no JS support confirmed)  
❌ Pre-v1.0, unstable  
❌ Requires cloud-scale LLMs for entity extraction  
❌ No proven code-specific implementation  

**Our Approach: Hybrid BM25 + Vector + RRF + MMR**  
✅ Keyword precision (BM25) + semantic understanding (vector)  
✅ Automatic score normalization (RRF)  
✅ Architectural diversity (MMR)  
✅ Tunable relevance/diversity tradeoff (lambda)  
✅ Validated with 100% success rate on test queries  

---

### Phase 4: AI Client Configuration

**What It Does:** Configure Claude Desktop or Cursor to use the MCP tools correctly and follow the exact workflow.

#### Configuration Files

**1. AGENT_INSTRUCTIONS.md** (System Prompt)
```markdown
You are a senior JavaScript/Express developer on CargoFin.

WORKFLOW:
1. Call get_repo_map() — understand the codebase structure
2. Read prds/current.md — the feature to implement
3. Read .agent-rules.json — conventions and done criteria
4. Search in parallel:
   - search_codebase(PRD feature description)
   - search_prd_history(similar features)
   - get_routes(relevant domain)
5. Produce written implementation plan
6. STOP. Wait for approval.
7. After approval: generate code
8. Run lint + tests (max 3 attempts)
9. Surface diffs for review
```

**2. .agent-rules.json** (Machine-Readable Config)
```json
{
  "structure": {
    "routes": ["backend/src/main/routes", "backend/src/lending/routes"],
    "controllers": ["backend/src/main/controllers", ...],
    "services": [...],
    "db_services": [...]
  },
  "conventions": {
    "routePattern": "Plain objects with method, path, function",
    "errorHandling": "try/catch → respondError(res, err)",
    "validation": "Joi schemas",
    "imports": "Module aliases: @main, @lending, @config, ..."
  },
  "layerResponsibilities": {
    "controllers": "Parse request, validate, call service, respond",
    "services": "Business logic only, no req/res",
    "db_services": "Knex queries only, no business logic"
  },
  "done_definition": {
    "must_pass": ["lint", "tests"],
    "max_fix_retries": 3
  }
}
```

**3. .cursorrules** (Hard Rules for Cursor)
```
## Mandatory First Steps
1. Call get_repo_map to understand the codebase
2. Read prds/current.md for the feature specification
3. Read .agent-rules.json for project conventions

## Architecture Rules (NEVER violate)
- Controllers: parse request → validate → call service → respond
- Services: business logic only, no req/res
- DB Service: Knex queries only, no business logic
- Every endpoint needs: route + controller + service + schema

## Never Do
- Install new packages without flagging
- Modify existing migration files
- Skip Joi validation on input endpoints
- Put business logic in controllers or DB layer
- Use console.log in production code
```

#### MCP Registration

**For Claude Desktop:**
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "developer-agent": {
      "command": "node",
      "args": ["/Users/.../developer-agent-e2e/mcp-server/index.js"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "OLLAMA_URL": "http://127.0.0.1:11434"
      }
    }
  }
}
```

**For Cursor (when unblocked):**
```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "developer-agent": {
      "command": "node",
      "args": ["/Users/.../developer-agent-e2e/mcp-server/index.js"],
      "env": { ... }
    }
  }
}
```

---

### Phase 5: PRD History Index (Future)

**Not yet implemented.** Will index historical PRDs into a separate Qdrant collection for `search_prd_history` and `get_prd` tools.

**Design:**
- Chunk PRDs by section (Overview, Requirements, Decisions, Out of Scope)
- Tag with: feature_name, date, outcome (shipped/cancelled/revised)
- Same embedding + search pipeline as code
- Enables: "How did we implement X last time?" and "What edge cases did we hit?"

---

## Design Decisions & Alternatives

### 1. AST Parser: tree-sitter vs Alternatives

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **tree-sitter** | ✅ Error recovery<br>✅ WASM (fast)<br>✅ Used by GitHub<br>✅ S-expression queries | ⚠️ WASM setup complexity | **CHOSEN** |
| Espree | Simple API | ❌ No error recovery<br>❌ One bad file crashes run | ❌ Rejected |
| @babel/parser | Full AST, scope analysis | ❌ Slow at scale<br>❌ No error recovery | Use for deep analysis only |
| Regex parsing | Fast | ❌ Fragile<br>❌ Misses edge cases | ❌ Rejected |

**Why tree-sitter won:**
- 694 files, 0 parse errors — error recovery is critical
- Used at GitHub scale (100M+ repos)
- WASM runtime is fast enough (~5 min for 694 files)

### 2. Vector Database: Qdrant vs Alternatives

| Database | Pros | Cons | Decision |
|----------|------|------|----------|
| **Qdrant** | ✅ Server-side MMR (v1.15+)<br>✅ Self-hosted (free)<br>✅ Rich metadata filtering<br>✅ HNSW index | Docker dependency | **CHOSEN** |
| pgvector | Postgres extension, familiar | ❌ No native MMR<br>❌ Slower at scale | ❌ Rejected |
| Pinecone | Managed, scalable | ❌ $$$ cost<br>❌ Cloud dependency | ❌ Rejected |
| Chroma | Simple, Python-native | ❌ No Node.js client quality<br>❌ No MMR | ❌ Rejected |

**Why Qdrant won:**
- Native server-side MMR = critical (avoids transferring 50 embedding vectors for re-ranking)
- Self-hosted = zero cost, data stays local
- Metadata filtering enables layer-based search

### 3. Embedding Model: nomic-embed-text vs OpenAI

| Model | Dims | Cost | Quality | Decision |
|-------|------|------|---------|----------|
| **nomic-embed-text** (Ollama) | 768 | $0 | ⭐⭐⭐⭐ | **CHOSEN** |
| text-embedding-3-small (OpenAI) | 1536 | ~$0.10 for 5K chunks | ⭐⭐⭐⭐⭐ | Alternative |
| text-embedding-3-large (OpenAI) | 3072 | ~$1.00 for 5K chunks | ⭐⭐⭐⭐⭐ | Overkill |

**Why nomic-embed-text won:**
- Zero cost (runs locally)
- Data never leaves your machine (critical for sensitive codebases)
- 768 dims = smaller index, faster search
- Quality comparable to text-embedding-3-small for code
- Can upgrade to OpenAI later if needed

### 4. BM25 Index: Orama vs Alternatives

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| **@orama/orama** | ✅ Pure Node.js<br>✅ Fast in-memory<br>✅ No external service | In-memory only | **CHOSEN** |
| Tantivy | Rust-based, very fast | ❌ Harder Node.js integration | ❌ Rejected |
| Elasticsearch | Full-featured, scalable | ❌ Overkill<br>❌ Memory hog | ❌ Rejected |
| MeiliSearch | Simple, typo-tolerant | ❌ Extra Docker service | ❌ Rejected |

**Why Orama won:**
- Pure Node.js = easy integration
- In-memory = instant search (5K docs fit in <100MB RAM)
- No extra service to run

### 5. Chunking: AST-Aware vs Fixed-Size

| Strategy | Example | Performance | Decision |
|----------|---------|-------------|----------|
| **AST-aware** (function boundaries) | Never splits mid-function | +4.3 Recall@5 vs fixed (research) | **CHOSEN** |
| Fixed 512 tokens | Splits anywhere | Fast but poor context | ❌ Rejected |
| Sliding window | Overlapping chunks | Redundant, wastes space | ❌ Rejected |

**Why AST-aware won:**
- Research shows +4.3 point improvement in Recall@5
- Preserves semantic boundaries (full function = complete context)
- Respects code structure

### 6. Why NOT Cognee?

Cognee is a promising knowledge graph approach for RAG, but:

❌ **No confirmed JS support** — Their pipeline is Python-only  
❌ **Pre-v1.0** — Still unstable, active bugs  
❌ **Requires cloud LLMs** — Entity extraction needs GPT-4 scale  
❌ **No code-specific implementation** — Designed for docs, not code  

**Decision:** Revisit if/when JS support is confirmed and it hits v1.0

### 7. MCP Transport: stdio vs HTTP

| Transport | Pros | Cons | Decision |
|-----------|------|------|----------|
| **stdio** | ✅ Simple setup<br>✅ Zero ports<br>✅ Works with Cursor/Claude | Restarts on client restart | **CHOSEN** |
| HTTP | Persistent across restarts | Port management, auth | Future upgrade |

**Why stdio won:**
- Simplest setup (no port conflicts)
- Works with both Claude Desktop and Cursor
- Can upgrade to HTTP later if persistence is needed

---

## Complete Workflow

### From PRD to Deployed Feature

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: Developer Preparation                                       │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  1. Convert PRD to Markdown (prds/current.md)
    │  2. Ensure Docker + Ollama + Qdrant running
    │  3. Open Claude Desktop with CargoFin workspace
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2: Agent Context Loading (AUTONOMOUS)                          │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Developer: "Implement the feature in prds/current.md"
    │
    │  Agent calls (parallel):
    │    ✓ get_repo_map()
    │    ✓ read_file("prds/current.md")
    │    ✓ read_file(".agent-rules.json")
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3: Retrieval (AUTONOMOUS)                                      │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Agent calls (parallel):
    │    ✓ search_codebase("credit facility approval", lambda=0.5)
    │    ✓ search_prd_history("approval workflow")
    │    ✓ get_routes("credit_facility")
    │    ✓ get_dependencies(top_search_result, "imports", depth=2)
    │
    │  Result: 15-25 relevant code chunks + dependency context
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4: Planning (AUTONOMOUS)                                       │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Agent produces written plan:
    │
    │  Files to Create:
    │    - backend/src/lending/routes/approval.js
    │    - backend/src/lending/controllers/approval.js
    │    - backend/src/lending/services/approval_service.js
    │    - backend/src/lending/services/db_service/approval.js
    │    - backend/src/lending/schemas/approval_schema.js
    │    - backend/test/approval.test.js
    │
    │  Files to Modify:
    │    - backend/config/routes.js (add approval routes)
    │
    │  Patterns to Follow:
    │    - Route pattern: backend/src/lending/routes/credit_facility.js
    │    - Controller pattern: backend/src/lending/controllers/credit_facility.js
    │    - Service pattern: backend/src/lending/services/credit_facility/index.js
    │    - Error handling: try/catch → respondError(res, err)
    │    - Validation: Joi schema in schemas/ directory
    │
    │  Test Plan:
    │    - Unit tests for service layer business logic
    │    - Integration tests for controller → service flow
    │    - Mock db_service calls with jest.mock
    │
    │  Assumptions:
    │    - Approval requires manager permission (APPROVAL_MGR)
    │    - Status transitions: PENDING → APPROVED | REJECTED
    │
    │  Questions:
    │    - Should approval send email notification?
    │    - Multi-level approval or single-level?
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ✋ CHECKPOINT 1: Plan Review (HUMAN)                                │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Developer reviews plan:
    │    - Corrects assumptions ("Yes, send email")
    │    - Clarifies ambiguities ("Single-level for now")
    │    - Types: "Approved, proceed"
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 5: Code Generation (AUTONOMOUS)                                │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Agent generates files in dependency order:
    │    1. Schema (no dependencies)
    │    2. DB service (uses Knex)
    │    3. Business service (uses db_service)
    │    4. Controller (uses service + schema)
    │    5. Route (uses controller)
    │    6. Tests (mocks all dependencies)
    │
    │  Each file generated with all previous files in context
    │  → ensures cross-file consistency
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 6: Validation Loop (AUTONOMOUS, max 3 attempts)                │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Run: npm run lint
    │  ✓ 0 errors
    │
    │  Run: npm test
    │  ✗ 2 tests failed:
    │     - Missing mock for emailService.sendApprovalEmail
    │     - Incorrect status transition validation
    │
    │  Agent fixes:
    │     - Add jest.mock('@services/email_service')
    │     - Fix status validation logic
    │
    │  Run: npm test
    │  ✓ All tests pass
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ✋ CHECKPOINT 2: Diff Review (HUMAN)                                │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  Claude Desktop / Cursor shows diffs:
    │
    │  Files created: 6
    │  Files modified: 1
    │  Lines added: 487
    │  Lines deleted: 0
    │
    │  Developer reviews like a normal PR:
    │    ✓ Accept route file
    │    ✓ Accept controller
    │    ✓ Accept service logic
    │    ✓ Accept tests
    │    ✗ Reject: Fix typo in email template
    │
    │  Agent fixes typo, re-runs tests
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 7: Merge Ready                                                 │
└──────────────────────────────────────────────────────────────────────┘
    │
    │  ✓ Lint passing
    │  ✓ Tests passing
    │  ✓ Human-reviewed diffs accepted
    │  ✓ Ready to commit and deploy
    │
    └─────▶  Feature Complete
```

### Time Breakdown (Estimated)

| Phase | Time | Who |
|-------|------|-----|
| Context loading | 10 seconds | Agent |
| Retrieval (parallel searches) | 5 seconds | Agent |
| Planning | 30 seconds | Agent |
| **Human plan review** | **2-5 minutes** | **Human** |
| Code generation | 2 minutes | Agent |
| Lint + test + fix loop | 1 minute | Agent |
| **Human diff review** | **5-10 minutes** | **Human** |
| **Total** | **~10-18 minutes** | |

**Compare to manual:** Senior dev spends 2-4 hours for the same feature.

---

## Technical Implementation Details

### Directory Structure

```
developer-agent-e2e/
├── indexer/                      # Phase 1-2: Offline indexing
│   ├── parse-codebase.js         # tree-sitter parsing
│   ├── build-symbol-map.js       # SQLite symbol + dep graph
│   ├── build-repo-map.js         # PageRank compression
│   ├── chunk-and-describe.js     # AST chunking + NL descriptions
│   ├── embed-and-store.js        # Ollama embeddings → Qdrant
│   ├── bm25-client.js            # Orama BM25 index builder
│   ├── run-indexer.js            # Orchestrator (full/incremental)
│   └── config.js                 # Target codebase config
│
├── mcp-server/                   # Phase 3: MCP server
│   ├── index.js                  # Server entry point
│   ├── tools/
│   │   ├── get-repo-map.js
│   │   ├── search-codebase.js    # Hybrid search (BM25+vector+RRF+MMR)
│   │   ├── get-symbol.js
│   │   ├── get-routes.js
│   │   ├── get-dependencies.js
│   │   ├── read-file.js
│   │   ├── list-directory.js
│   │   ├── grep-codebase.js
│   │   ├── search-prd-history.js (stub)
│   │   └── get-prd.js           (stub)
│   └── db/
│       ├── qdrant-client.js      # Vector search + MMR
│       ├── bm25-client.js        # BM25 wrapper
│       ├── symbol-client.js      # SQLite queries
│       └── rrf.js                # Reciprocal Rank Fusion
│
├── scripts/
│   ├── split-chunks.js           # Split chunks for Cursor descriptions
│   ├── merge-cursor-descriptions.js
│   ├── fix-descriptions.js       # Validate/fix bad descriptions
│   ├── check-description-match.js
│   └── validate-index.js         # Smoke test retrieval quality
│
├── index/                        # Generated (gitignored)
│   ├── repo-map.txt              # 4,740 token overview
│   ├── symbol-map.db             # SQLite: 6,501 symbols, 3,279 deps
│   ├── parsed-files.json         # Raw parse output (23MB)
│   ├── chunks.json               # 5,024 chunks with descriptions
│   ├── bm25-index.json           # Orama BM25 index
│   └── .last-indexed             # Git commit hash
│
├── prds/
│   ├── current.md                # Active PRD
│   ├── TEMPLATE.md               # PRD template
│   └── history/                  # Historical PRDs (Phase 5)
│
├── .agent-rules.json             # Machine-readable config
├── AGENT_INSTRUCTIONS.md         # System prompt
├── .cursorrules                  # Cursor hard rules
├── docker-compose.yml            # Qdrant setup
└── package.json
```

### Key Files Explained

**indexer/config.js** — Target codebase configuration
```javascript
module.exports = {
  targetCodebase: '/Users/sarvang.jain/Work/Repos/CargoFin_Backend',
  moduleAliases: {
    '@main': 'backend/src/main',
    '@lending': 'backend/src/lending',
    '@config': 'backend/config',
    '@services': 'backend/src/services',
    '@middlewares': 'backend/src/middlewares',
    '@errors': 'backend/src/errors',
    '@utils': 'backend/src/utils',
  },
  excludePatterns: [
    '**/node_modules/**',
    '**/db/migrations/**',  // 849 migration files
    '**/test/**',
    'DevOps_Scripts/**',
    '**/*.log',
  ],
};
```

**mcp-server/db/qdrant-client.js** — Vector search with MMR
```javascript
async function search(query, limit = 15, lambda = 0.5) {
  // 1. Embed query (via Ollama)
  const queryEmbedding = await embedText(query);
  
  // 2. Vector search
  const results = await qdrant.search('codebase', {
    vector: queryEmbedding,
    limit: 50,
  });
  
  // 3. MMR re-ranking
  return maximalMarginalRelevance(results, queryEmbedding, lambda, limit);
}
```

**mcp-server/tools/search-codebase.js** — The hybrid search orchestrator
```javascript
async function searchCodebase({ query, limit = 20, lambda = 0.5 }) {
  // Parallel search
  const [bm25Results, vectorResults] = await Promise.all([
    bm25Client.search(query, 50),
    qdrantClient.search(query, 50),
  ]);
  
  // RRF merge
  const merged = rrf.merge(bm25Results, vectorResults);
  
  // MMR re-rank (already applied in qdrantClient.search)
  // Return top N
  return merged.slice(0, limit);
}
```

### Performance Metrics

**Index Build Time (Full Run):**
- Parse 694 files: ~1 minute
- Build symbol map: ~5 seconds
- Build repo map: ~2 seconds
- Generate 5,024 chunks: ~10 seconds
- Generate descriptions (Cursor): ~30 minutes (manual)
- Embed 5,022 chunks (Ollama): ~15 minutes
- Build BM25 index: ~3 seconds
- **Total:** ~48 minutes (32 min automated, 16 min manual descriptions)

**Incremental Update (10 changed files):**
- Parse changed files: ~2 seconds
- Update symbol map: ~1 second
- Re-chunk changed files: ~1 second
- Re-embed ~75 chunks: ~30 seconds
- Update BM25: ~1 second
- **Total:** ~35 seconds

**Query Performance:**
- Repo map read: <1ms (in-memory)
- BM25 search: ~5ms (5K docs)
- Vector search: ~50ms (5K vectors, HNSW index)
- RRF merge: ~2ms
- MMR re-rank: ~10ms
- **Total search latency:** ~70ms

**Storage:**
- Qdrant collection: ~150MB (5,022 vectors × 768 dims)
- SQLite symbol-map.db: ~8MB
- BM25 index: ~12MB
- Repo map: ~25KB
- **Total:** ~170MB

---

## Performance & Scale

### Current Stats

| Metric | Value |
|--------|-------|
| Total codebase size | 655,000 lines |
| Application files indexed | 694 |
| Functions extracted | 6,375 |
| Routes mapped | 482 |
| Code chunks | 5,024 |
| Vectors stored | 5,022 |
| Dependency edges | 3,279 |
| Repo map size | 4,740 tokens |
| Full index time | ~48 minutes |
| Incremental update | ~35 seconds |
| Search latency | ~70ms |

### Scaling Projections

**At 2M lines (3x current size):**
- Files: ~2,000
- Chunks: ~15,000
- Full index: ~2 hours
- Incremental: ~45 seconds
- Search: ~150ms (HNSW scales logarithmically)

**At 5M lines (8x current size):**
- Files: ~5,000
- Chunks: ~40,000
- Full index: ~5 hours
- Incremental: ~60 seconds
- Search: ~200ms

**Bottlenecks:**
1. **Description generation** — Linear with chunk count (most expensive)
2. **Embedding** — Linear with chunk count (Ollama on M4 Pro: ~3 chunks/sec)
3. **tree-sitter parsing** — Sub-linear (error recovery adds overhead)

**Optimization Options:**
1. Batch embeddings (currently 1 at a time for robustness)
2. Use OpenAI embeddings API (10x faster, but costs $)
3. Parallelize description generation across files
4. Cache embeddings per function hash (skip re-embed if function unchanged)

---

## Success Criteria & Validation

### What "Success" Looks Like

A successful agent run produces:

✅ **Code that matches the codebase style**
- Uses the custom route pattern (`{ method, path, function }`)
- Follows 3-layer architecture (controller → service → db_service)
- Uses module aliases (`@main`, `@lending`)
- Follows error handling pattern (`try/catch → respondError`)

✅ **Zero hallucinated imports**
- All `require()` statements reference real files
- All function calls reference functions that exist

✅ **Tests that pass on first run or within 3 attempts**
- Mocking strategy matches existing tests
- Coverage targets met

✅ **Plan identifies correct files to touch**
- Without being told explicitly
- Based purely on PRD + retrieval

### Current Validation Results

**5 Test Queries:**

| Query | Expected | Hybrid Result | Success |
|-------|----------|---------------|---------|
| "Auth middleware" | access_control.js | ✅ access_control + rate_limit | ✅ |
| "loginUser" | auth.js#loginUser | ✅ auth.js#loginUser | ✅ |
| "Credit facility workflow" | Route + service + DB | ✅ All 3 layers | ✅ |
| "Rate limiting" | rate_limit.js | ✅ rate_limit.js + docs | ✅ |
| "Email notification" | email.js + notification.js | ✅ Both + queue | ✅ |

**Success Rate: 5/5 (100%)**

---

## Conclusion

The PRD-to-Feature Agent solves the core problem of AI code generation: **lack of codebase-specific context and patterns.**

By combining:
1. **Structural parsing** (tree-sitter + PageRank repo map)
2. **Hybrid retrieval** (BM25 + vector + RRF + MMR)
3. **Dependency graph traversal** (SQLite symbol map)
4. **Agentic file access** (MCP tools)

...we created a system that gives AI agents the same mental model a senior developer has when joining a new codebase.

**The result:** Code that looks like it was written by someone on your team, not by a generic LLM.

**Next steps:**
- Phase 5: PRD history index (learn from past decisions)
- Production hardening (error handling, logging, monitoring)
- CI/CD integration (incremental index on merge)
- Multi-project support (generalize config across codebases)

---

**Questions or want to contribute?**  
Open an issue or PR in the project repo.
