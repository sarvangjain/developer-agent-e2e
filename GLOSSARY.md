# PRD-to-Feature Agent: Technical Glossary

**A plain-English guide to all the terms, algorithms, and techniques used in this project**

For software engineers new to RAG, embeddings, vector databases, and AI code generation.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Retrieval Algorithms](#retrieval-algorithms)
3. [Technologies & Tools](#technologies--tools)
4. [Parsing & Code Analysis](#parsing--code-analysis)
5. [Project-Specific Terms](#project-specific-terms)
6. [Common Acronyms](#common-acronyms)

---

## Core Concepts

### RAG (Retrieval-Augmented Generation)

**What it is:** A technique where an AI model first retrieves relevant information from a knowledge base, then uses that information to generate its response.

**Why it matters:** Without RAG, AI models only know what they learned during training. RAG gives them access to your specific codebase, documentation, or any other data you provide.

**Real example:**
```
Without RAG:
User: "How do we handle authentication?"
AI: "Here's a generic auth pattern..." (generic, might not match your code)

With RAG:
User: "How do we handle authentication?"
AI: Searches your codebase → finds auth.js, auth_middleware.js
AI: "You use JWT tokens in auth_service.js with verifyToken() middleware"
```

**The problem this project solves:** Pure RAG doesn't work well for code because it returns structurally similar but architecturally useless results (10 route handlers instead of route + service + middleware + test).

---

### Embeddings

**What it is:** A way to convert text (code, documentation, etc.) into a list of numbers (a "vector") that represents its meaning.

**Why it matters:** Computers can't understand meaning directly, but they can compare numbers. Similar meanings = similar numbers.

**Real example:**
```javascript
// These two pieces of code do similar things:
const login = async (user, pass) => { /* auth logic */ }
function authenticateUser(username, password) { /* auth logic */ }

// Their embeddings would be similar:
login embedding:           [0.23, -0.45, 0.89, ..., 0.12]  (768 numbers)
authenticateUser embedding: [0.25, -0.43, 0.91, ..., 0.15]  (768 numbers)
                             ↑ Close values = similar meaning
```

**In our project:** We use `nomic-embed-text` (via Ollama) to convert each code chunk into a 768-dimensional vector.

---

### Vector Database

**What it is:** A database optimized for storing and searching vectors (lists of numbers).

**Why it matters:** Finding similar vectors in millions of entries is slow with normal databases. Vector databases use special algorithms (like HNSW) to make it fast.

**Real example:**
```
Normal database (Postgres):
  "Find users where name = 'John'" → Easy, uses index

Vector database (Qdrant):
  "Find code chunks similar to [0.23, -0.45, 0.89, ...]" → Fast with HNSW index
```

**In our project:** Qdrant stores 5,022 code chunk embeddings and can search them in ~50ms.

---

### Semantic Search vs Keyword Search

**Semantic Search:** Finds results based on *meaning*.
- Query: "rate limiting"
- Finds: code with `windowMs`, `maxRequests`, `rateLimit()` even if it never says "rate limiting"

**Keyword Search:** Finds results based on *exact words*.
- Query: "rate limiting"
- Finds: code that contains the words "rate", "limiting", "rateLimit"

**In our project:** We use BOTH (hybrid search) because:
- Semantic search handles concepts ("implement caching" → finds Redis code)
- Keyword search handles exact names ("find getUserById function" → finds it by name)

---

### Tokens

**What it is:** The unit of text that AI models process. Roughly 1 token ≈ 4 characters or ¾ of a word.

**Why it matters:** AI models have context limits measured in tokens. Claude Sonnet 4 has a 200K token limit.

**Real example:**
```javascript
// This code is approximately 25 tokens:
function hello(name) {
  return "Hello, " + name;
}

// Token breakdown:
// function | hello | ( | name | ) | { | return | " | Hello | , | " | + | name | ; | }
```

**In our project:** 
- Repo map is 4,740 tokens (fits easily in any AI context)
- Full context (repo map + 15 code chunks) is ~8,000 tokens
- Leaves plenty of room for the PRD and generated code

---

### Cosine Similarity

**What it is:** A mathematical way to measure how similar two vectors are. Returns a number from -1 to 1.

**Why it matters:** This is how we determine which code chunks are most relevant to a query.

**Real example:**
```
Vector A: [1, 2, 3]
Vector B: [2, 4, 6]  (same direction, larger magnitude)
Cosine similarity: 1.0 (identical meaning)

Vector A: [1, 0]
Vector B: [0, 1]  (perpendicular)
Cosine similarity: 0.0 (unrelated)

Vector A: [1, 0]
Vector B: [-1, 0]  (opposite direction)
Cosine similarity: -1.0 (opposite meaning)
```

**In our project:** When you query "user authentication", we calculate cosine similarity between the query embedding and all 5,022 code chunk embeddings, then return the top 50.

---

## Retrieval Algorithms

### BM25 (Best Matching 25)

**What it is:** A keyword-based ranking algorithm that scores documents based on how many times query words appear, but with smart weighting.

**Why it matters:** Better than simple word counting because it:
- Penalizes common words (like "the", "function")
- Rewards rare words (like "authenticateUser")
- Considers document length (shorter docs get boosted if they match)

**Real example:**
```
Query: "user authentication"

Document 1: "user user user user authentication"
  - BM25 doesn't overcount "user" (diminishing returns)

Document 2: "authentication implementation for user login"
  - BM25 rewards both "authentication" and "user"
  - Higher score than Document 1 despite fewer word matches
```

**In our project:** Orama implements BM25 for keyword search across all 5,024 code chunks. Fast (5ms) and complements semantic search.

---

### RRF (Reciprocal Rank Fusion)

**What it is:** A method to combine rankings from multiple search engines without needing to tune weights.

**Why it matters:** BM25 scores are 0-10, vector similarity scores are 0-1. You can't just add them. RRF normalizes by rank position instead of raw scores.

**The formula:**
```
RRF score = 1 / (k + rank)
where k is a constant (usually 60)
```

**Real example:**
```
BM25 results:              Vector results:
1. auth.js (score 8.5)     1. middleware/rate_limit.js (0.92)
2. login.js (score 7.2)    2. middleware/auth.js (0.89)
3. middleware/auth.js (6.1) 3. auth.js (0.85)

RRF scores:
auth.js:        1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323 ← Highest!
middleware/auth.js: 1/(60+3) + 1/(60+2) = 0.0159 + 0.0161 = 0.0320
rate_limit.js:  1/(60+1) + 0 = 0.0164
login.js:       1/(60+2) + 0 = 0.0161

Final order: auth.js, middleware/auth.js, rate_limit.js, login.js
```

**In our project:** RRF merges BM25 and vector search results before MMR re-ranking.

---

### MMR (Maximal Marginal Relevance)

**What it is:** An algorithm that balances relevance to the query with diversity from already-selected results.

**Why it matters:** Solves the "10 identical results" problem. Instead of returning the top 10 most similar chunks (which might all be auth routes), MMR ensures variety.

**The formula:**
```
score = λ × similarity_to_query − (1−λ) × max_similarity_to_selected

λ (lambda) controls the tradeoff:
  - λ = 1.0: Only care about relevance (ignore diversity)
  - λ = 0.5: Equal weight to relevance and diversity
  - λ = 0.0: Only care about diversity (ignore relevance)
```

**Real example:**
```
Query: "user authentication"
Candidates after RRF (all highly relevant):

1st pick: auth.js#loginUser
  - Relevance to query: 0.95 (very high)
  - Similarity to selected: N/A (first pick)
  - Score: 0.95 × 1.0 = 0.95 ← Selected

2nd pick options:
  A) auth.js#logoutUser
     - Relevance: 0.94
     - Similarity to #1: 0.99 (almost identical!)
     - Score (λ=0.5): 0.5×0.94 - 0.5×0.99 = -0.025 ← Low score

  B) middleware/auth.js
     - Relevance: 0.88
     - Similarity to #1: 0.60 (different aspect)
     - Score (λ=0.5): 0.5×0.88 - 0.5×0.60 = 0.14 ← Higher! Selected

Result: Get diverse results across architectural layers instead of 10 similar routes
```

**In our project:** 
- λ=0.5 for broad queries ("implement authentication")
- λ=0.8 for specific lookups ("find getUserById function")

---

### PageRank

**What it is:** The algorithm Google uses to rank web pages. A page is important if many important pages link to it.

**Why it matters:** In code, a file is important if many other files import it. This helps prioritize what goes in the repo map.

**Real example:**
```
File dependencies:

config.js ← imported by 402 files
  ↑
logger.js ← imported by 182 files  
  ↑
auth.js ← imported by 51 files
  ↑
some_util.js ← imported by 2 files

PageRank scores:
config.js: 0.85 (highest)
logger.js: 0.72
auth.js: 0.45
some_util.js: 0.15 (lowest)
```

**In our project:** We run PageRank on the dependency graph to decide which files go in the repo map. Top-ranked files (like `config.js`) always make the cut.

---

### HNSW (Hierarchical Navigable Small World)

**What it is:** A graph-based algorithm for fast approximate nearest neighbor search in high-dimensional spaces.

**Why it matters:** Searching 5,000 vectors by brute force (comparing to every single one) is slow. HNSW builds a graph structure that lets you "jump" to similar regions quickly.

**Simplified concept:**
```
Brute force:
  Compare query to all 5,022 vectors → 5,022 comparisons

HNSW:
  Layer 3: Jump to rough neighborhood (compare to ~10 vectors)
  Layer 2: Refine to closer region (compare to ~20 vectors)
  Layer 1: Find exact neighbors (compare to ~50 vectors)
  Total: ~80 comparisons instead of 5,022!
```

**In our project:** Qdrant uses HNSW indexing, which is why vector search on 5,022 chunks takes only ~50ms.

---

## Technologies & Tools

### tree-sitter

**What it is:** A parser generator that builds syntax trees from source code. It's error-tolerant, meaning it can parse files with syntax errors.

**Why it matters:** Your codebase might have incomplete or temporarily broken files. tree-sitter doesn't crash — it marks the error and keeps going.

**Real example:**
```javascript
// This file has a syntax error (missing closing brace):
function broken() {
  const x = 5;
  if (x > 3) {
    console.log("yes")
  // <- missing }

function workingFunction() {
  return 42;
}

// tree-sitter will:
// ✓ Parse workingFunction correctly
// ✓ Mark broken() as having an error
// ✓ Keep going (doesn't crash)
```

**Alternatives and why tree-sitter won:**
- **Espree** (ESLint's parser): Crashes on syntax errors
- **@babel/parser**: Slow, not error-tolerant
- **tree-sitter**: Fast (WASM), error-tolerant, used by GitHub

**In our project:** Parsed 694 files with 0 crashes, extracted 6,375 functions.

---

### Qdrant

**What it is:** An open-source vector database written in Rust. Stores vectors and provides fast similarity search.

**Why it matters:** It has server-side MMR (v1.15+), meaning the re-ranking happens on the server without transferring all embedding vectors to your app.

**Real example:**
```
Without server-side MMR (pgvector):
  1. Fetch top 50 vectors from DB → transfer 50 × 768 = 38,400 numbers
  2. Run MMR in your app
  3. Return final 15 results

With server-side MMR (Qdrant):
  1. Qdrant runs MMR internally
  2. Returns only final 15 results → transfer 15 × 768 = 11,520 numbers
  3. 3x less network transfer!
```

**In our project:** Self-hosted via Docker, stores 5,022 vectors, ~150MB total size.

---

### Ollama

**What it is:** A tool to run large language models locally on your machine (like Docker for LLMs).

**Why it matters:** You can run embedding models and LLMs without sending data to external APIs.

**Real example:**
```bash
# Install Ollama
brew install ollama

# Pull an embedding model
ollama pull nomic-embed-text

# Use it locally (no API key needed)
curl http://localhost:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": "Hello world"
}'
# Returns: [0.23, -0.45, 0.89, ..., 0.12] (768 numbers)
```

**In our project:** Runs `nomic-embed-text` locally to generate embeddings. Zero cost, data never leaves your machine.

---

### MCP (Model Context Protocol)

**What it is:** A standard protocol (created by Anthropic) that lets AI assistants use tools. Think of it like REST APIs, but for AI agents.

**Why it matters:** You build tools once (as an MCP server), and any MCP-compatible client (Claude Desktop, Cursor, etc.) can use them.

**Real example:**
```
MCP Server exposes:
  - get_repo_map()
  - search_codebase(query)
  - read_file(path)

Claude Desktop (MCP client) can call:
  User: "What's in auth.js?"
  Claude: Calls read_file("backend/src/main/controllers/auth.js")
  Claude: "This file contains loginUser, logoutUser, ..."
```

**In our project:** We built 15 MCP tools that expose the indexed codebase to any MCP-compatible AI client.

---

### SQLite

**What it is:** A lightweight, file-based SQL database. No server needed — the entire database is a single file.

**Why it matters:** Perfect for structured data that needs fast exact lookups (symbols, dependencies) without the overhead of PostgreSQL.

**Real example:**
```sql
-- symbol-map.db structure:
CREATE TABLE symbols (
  name TEXT,
  file_path TEXT,
  type TEXT,  -- 'function' | 'class' | 'export'
  line_start INT
);

CREATE TABLE dependencies (
  source_file TEXT,
  target_file TEXT
);

-- Fast lookups with indexes:
CREATE INDEX idx_symbols_name ON symbols(name);
CREATE INDEX idx_deps_source ON dependencies(source_file);
```

**In our project:** Stores 6,501 symbols and 3,279 dependency edges in an 8MB file.

---

### Orama (BM25 Implementation)

**What it is:** A pure JavaScript search library that implements BM25 keyword search in-memory.

**Why it matters:** No need to run Elasticsearch or Solr. The entire BM25 index loads into RAM (<100MB) for instant search.

**Real example:**
```javascript
const { create, insert, search } = require('@orama/orama');

// Create index
const db = await create({ schema: { text: 'string' } });

// Index documents
await insert(db, { text: 'User authentication with JWT' });
await insert(db, { text: 'Rate limiting middleware' });

// Search
const results = await search(db, { term: 'authentication' });
// Returns: First document (BM25 scored)
```

**In our project:** Indexes all 5,024 code chunks, search completes in ~5ms.

---

### Knex.js

**What it is:** A SQL query builder for Node.js. Write queries as JavaScript objects instead of raw SQL strings.

**Why it matters:** Type-safe, supports multiple databases, prevents SQL injection.

**Real example:**
```javascript
// Raw SQL (risky, hard to maintain):
const users = await db.raw(`
  SELECT * FROM users 
  WHERE org_id = ${orgId} AND status = 'active'
`); // ⚠️ SQL injection risk!

// Knex (safe, maintainable):
const users = await db('users')
  .where({ org_id: orgId, status: 'active' })
  .select('*');
```

**In our project:** The CargoFin codebase uses Knex for all database queries. Our agent needs to generate Knex queries, not raw SQL.

---

## Parsing & Code Analysis

### AST (Abstract Syntax Tree)

**What it is:** A tree representation of source code's structure. Each node is a language construct (function, if-statement, variable, etc.).

**Why it matters:** AST parsing lets you understand code structure programmatically — find all functions, detect patterns, split at boundaries.

**Real example:**
```javascript
// Code:
function add(a, b) {
  return a + b;
}

// AST (simplified):
{
  type: "function_declaration",
  name: "add",
  parameters: [
    { type: "identifier", name: "a" },
    { type: "identifier", name: "b" }
  ],
  body: {
    type: "return_statement",
    expression: {
      type: "binary_expression",
      operator: "+",
      left: { type: "identifier", name: "a" },
      right: { type: "identifier", name: "b" }
    }
  }
}
```

**In our project:** tree-sitter generates ASTs for all 694 files, which we traverse to extract functions, classes, imports, and routes.

---

### AST-Aware Chunking

**What it is:** Splitting code at syntactic boundaries (function/class edges) instead of arbitrary character counts.

**Why it matters:** Research shows AST-aware chunking gives +4.3 point improvement in Recall@5 compared to fixed-size chunking.

**Bad (fixed-size chunking):**
```javascript
// Chunk 1 (500 chars):
function loginUser(req, res) {
  const { username, password } = req.body;
  const user = await db.findUser(username);
  if (!user) {
    return res.status(404).json

// ❌ Chunk 2 (500 chars):
({ error: "User not found" });
  }
  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) {
// ← Function split mid-logic!
```

**Good (AST-aware chunking):**
```javascript
// Chunk 1 (entire function):
function loginUser(req, res) {
  const { username, password } = req.body;
  const user = await db.findUser(username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid password" });
  }
  return res.json({ token: generateToken(user) });
}
// ✅ Complete context preserved
```

**In our project:** All 5,024 chunks respect function boundaries. No function is ever split mid-implementation.

---

### Dependency Graph

**What it is:** A directed graph where nodes are files and edges represent imports.

**Why it matters:** Lets you traverse relationships: "What does this file import?" and "What files import this?"

**Real example:**
```
File A: require('./B'); require('./C');
File B: require('./D');
File C: require('./D');
File D: (no imports)

Graph:
  A → B → D
  A → C → D

Queries:
  - "What does A import?" → B, C
  - "What imports D?" → B, C
  - "Show A's full dependency tree" → A → B → D, A → C → D
```

**In our project:** 
- 3,279 dependency edges in SQLite
- Used to expand context (Layer 3 of retrieval)
- Used for PageRank scoring in repo map

---

### Symbol Map

**What it is:** An index of all functions, classes, and exports in the codebase with their locations.

**Why it matters:** Enables fast exact lookups: "Where is `getUserById` defined?"

**Real example:**
```javascript
// symbol-map.db contains:
{
  name: "getUserById",
  file_path: "backend/src/services/db_service/user_organisation.js",
  type: "function",
  line_start: 45,
  line_end: 52,
  is_exported: true,
  is_async: true
}

// Fast lookup:
SELECT * FROM symbols WHERE name = 'getUserById'
→ Returns in <1ms (indexed)
```

**In our project:** 6,501 symbols indexed. Powers the `get_symbol()` MCP tool.

---

### Module Alias Resolution

**What it is:** Mapping import shortcuts (like `@main`) to real file paths.

**Why it matters:** Code uses `require('@main/controllers/auth')`, but the indexer needs the real path: `backend/src/main/controllers/auth.js`

**Real example:**
```javascript
// package.json defines:
{
  "_moduleAliases": {
    "@main": "src/main",
    "@lending": "src/lending",
    "@config": "config"
  }
}

// Code imports:
const auth = require('@main/controllers/auth');

// Indexer resolves to:
backend/src/main/controllers/auth.js
```

**In our project:** Resolves 11 module aliases across 4,099 import statements.

---

## Project-Specific Terms

### Repo Map

**What it is:** A compressed text summary of the entire codebase structure, designed to fit in an AI's context window.

**Why it matters:** Gives the agent a "mental model" of the codebase before it searches. Like giving someone a city map before they explore neighborhoods.

**Real example:**
```
=== ROUTES (40 files) ===
backend/src/main/routes/auth.js (20 routes)
  → backend/src/main/controllers/auth.js

=== CONTROLLERS (22 files) ===
backend/src/main/controllers/auth.js
  - loginUser, logoutUser, getCurrentUserDetails

=== SERVICES (40 files) ===
backend/src/services/auth_service.js (imported by 51)
  - authenticateUser, generateToken, verifyToken
```

**In our project:** 
- 4,740 tokens (fits in any AI context)
- Top 120 files by PageRank
- Always injected at the start of every agent session

---

### Hybrid Search

**What it is:** Combining BM25 (keyword) and vector (semantic) search, then merging results with RRF.

**Why it matters:** Each search type has strengths:
- BM25: Finds exact names ("getUserById")
- Vector: Finds concepts ("user data retrieval")
- Together: Best of both worlds

**Real example:**
```
Query: "find getUserById function"

BM25 top 3:
1. user_organisation.js#getUserById (exact name match!)
2. auth.js#loginUser (has "user" and "get")
3. credit_facility.js#getById (has "get" and "ById")

Vector top 3:
1. user_profile.js#fetchProfile (semantically about user data)
2. user_organisation.js#getUserById (also semantically relevant)
3. session.js#retrieveUserSession (user data retrieval concept)

RRF merge:
1. user_organisation.js#getUserById (in both lists → high score!)
2. user_profile.js#fetchProfile
3. auth.js#loginUser
```

**In our project:** Achieves 100% success rate on test queries (BM25 alone: 80%, vector alone: 60%).

---

### NL Description (Natural Language Description)

**What it is:** A one-sentence business-focused summary of what a code chunk does, generated before embedding.

**Why it matters:** Bridges the semantic gap between PRD language and code identifiers.

**The problem:**
```
PRD says: "Implement rate limiting"
Code says: windowMs, maxRequests, rateLimit()

Without NL description:
  Embedding of "rate limiting" is far from embedding of "windowMs"

With NL description:
  // Rate limiting middleware that restricts requests per IP window
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  
  Now embedding captures BOTH business purpose AND implementation
```

**In our project:** All 5,024 chunks have NL descriptions generated by Claude in Cursor.

---

### Lambda (λ) in MMR

**What it is:** A tunable parameter (0 to 1) that controls the relevance vs. diversity tradeoff in MMR.

**Why it matters:** Different queries need different balances:
- Broad queries ("implement auth") → need diversity (λ=0.5)
- Specific queries ("find loginUser") → need relevance (λ=0.8)

**Real example:**
```
λ = 1.0 (only relevance):
  Result: 10 almost identical auth route handlers
  
λ = 0.5 (balanced):
  Result: 1 auth route, 1 middleware, 1 service, 1 util, 1 test...
  
λ = 0.0 (only diversity):
  Result: Completely random files from different domains
```

**In our project:**
- Default λ=0.5 for broad PRD queries
- λ=0.8 for specific symbol lookups

---

### Incremental Indexing

**What it is:** Re-indexing only the files that changed since the last index run, not the entire codebase.

**Why it matters:** Full index takes 48 minutes. Incremental takes 35 seconds.

**How it works:**
```bash
# First time (full index):
node indexer/run-indexer.js --mode=full
# Stores git commit hash in index/.last-indexed

# After code changes:
node indexer/run-indexer.js --mode=incremental
# Reads .last-indexed, runs git diff, only re-indexes changed files
```

**Real example:**
```
You changed 10 files:
  - Re-parse only those 10 files (not all 694)
  - Re-chunk ~75 chunks (not all 5,024)
  - Re-embed ~75 chunks (not all 5,022)
  - Update SQLite symbol map incrementally
  - Regenerate repo map (fast, uses existing data)
  
Result: 35 seconds instead of 48 minutes
```

**In our project:** Designed for git hooks or CI/CD integration.

---

### Context Window

**What it is:** The maximum amount of text (measured in tokens) an AI model can process at once.

**Why it matters:** You can't just dump your entire codebase into the AI. You need to be selective.

**Real example:**
```
Claude Sonnet 4: 200,000 token limit

Our context usage:
  - Repo map: 4,740 tokens
  - PRD: ~2,000 tokens
  - Search results (15 chunks): ~6,000 tokens
  - Agent instructions: ~1,500 tokens
  - Generated code so far: ~3,000 tokens
  ─────────────────────────────────
  Total: ~17,000 tokens

Remaining for more context/generation: 183,000 tokens
```

**In our project:** Careful token budgeting ensures we never hit the limit while maximizing useful context.

---

### Layer (in Architecture)

**What it is:** A horizontal slice of your application architecture. In MVC/3-tier, layers separate concerns.

**Why it matters:** The agent needs to know which layer a file belongs to, so it can generate architecturally correct code.

**In CargoFin:**
```
┌─────────────────────────────────────┐
│  ROUTES                              │  Define HTTP endpoints
│  (method, path, handler)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  CONTROLLERS                         │  Parse request, call service, respond
│  (req, res) → service → response     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  SERVICES                            │  Business logic (no HTTP awareness)
│  Pure functions, orchestration       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  DB_SERVICES                         │  Database queries only (Knex)
│  No business logic                   │
└─────────────────────────────────────┘
```

**In our project:** Each chunk is tagged with its layer (controller/service/db_service/middleware/route/schema/util). MMR uses this to ensure diversity across layers.

---

## Common Acronyms

| Acronym | Full Name | What It Means |
|---------|-----------|---------------|
| **RAG** | Retrieval-Augmented Generation | Get info from knowledge base, then generate response |
| **BM25** | Best Matching 25 | Keyword ranking algorithm (25th iteration of the algorithm) |
| **RRF** | Reciprocal Rank Fusion | Method to merge multiple ranked lists |
| **MMR** | Maximal Marginal Relevance | Algorithm that balances relevance and diversity |
| **AST** | Abstract Syntax Tree | Tree structure representing code syntax |
| **HNSW** | Hierarchical Navigable Small World | Graph algorithm for fast vector search |
| **NL** | Natural Language | Human-readable text (vs code/symbols) |
| **MCP** | Model Context Protocol | Standard for AI tool integration |
| **LLM** | Large Language Model | AI model trained on massive text (GPT, Claude, etc.) |
| **JWT** | JSON Web Token | Authentication token format (used in CargoFin) |
| **WASM** | WebAssembly | Binary format for running code in browsers/Node.js |

---

## Quick Reference: When to Use What

### Searching Code

| Need to... | Use this... | Why? |
|------------|-------------|------|
| Find by exact name | BM25 or `get_symbol()` | Keyword match is faster |
| Find by concept | Vector search | Semantic understanding |
| Find diverse results | Hybrid + MMR | Combines both strengths |
| Find dependencies | `get_dependencies()` | Graph traversal |

### Understanding the Codebase

| Need to... | Use this... | Why? |
|------------|-------------|------|
| Get high-level overview | `get_repo_map()` | 4.7K token compressed view |
| Find all routes in domain | `get_routes(domain)` | Fast exact lookup |
| Read specific file | `read_file()` | Direct file access |
| Search by string | `grep_codebase()` | Keyword search |

### Tuning Retrieval

| Scenario | λ value | Limit |
|----------|---------|-------|
| Broad PRD query ("implement auth") | 0.5 | 20 chunks |
| Specific lookup ("find getUserById") | 0.8 | 10 chunks |
| Exploratory search | 0.5 | 25 chunks |
| Need exact match | Use BM25 only or `get_symbol()` | N/A |

---

## Further Reading

### If You Want to Learn More About...

**RAG and Embeddings:**
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Learning Center - What are Vector Embeddings](https://www.pinecone.io/learn/vector-embeddings/)

**BM25 and Information Retrieval:**
- [Elasticsearch BM25 Explanation](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables)
- [BM25 Original Paper (Robertson & Zaragoza)](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf)

**MMR:**
- [Maximal Marginal Relevance Original Paper (Carbonell & Goldstein, 1998)](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf)

**tree-sitter:**
- [tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [How tree-sitter Works (Blog)](https://www.npopov.com/2023/11/05/Parsing-theory-the-practice.html)

**Vector Databases:**
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [HNSW Paper (Malkov & Yashunin, 2016)](https://arxiv.org/abs/1603.09320)

**MCP:**
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)

---

## Glossary Quick Lookup

Can't remember what a term means? Use this quick reference:

| Looking for... | See section... |
|----------------|----------------|
| What is RAG? | [Core Concepts → RAG](#rag-retrieval-augmented-generation) |
| What is BM25? | [Retrieval Algorithms → BM25](#bm25-best-matching-25) |
| What is MMR? | [Retrieval Algorithms → MMR](#mmr-maximal-marginal-relevance) |
| What is tree-sitter? | [Technologies → tree-sitter](#tree-sitter) |
| What is Qdrant? | [Technologies → Qdrant](#qdrant) |
| What is the repo map? | [Project Terms → Repo Map](#repo-map) |
| What is λ (lambda)? | [Project Terms → Lambda](#lambda-λ-in-mmr) |
| What is AST chunking? | [Parsing → AST-Aware Chunking](#ast-aware-chunking) |
| What is hybrid search? | [Project Terms → Hybrid Search](#hybrid-search) |

---

**Questions or want a term added?** Open an issue in the project repo!
