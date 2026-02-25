# PRD-to-Feature Agent: Technical Knowledge Sharing Session

**Duration:** 25-30 minutes  
**Format:** Technical presentation with Q&A  
**Audience:** Development team (all levels)  
**Goal:** Explain the architecture, algorithms, and design decisions behind the agent

---

## 📋 Pre-Session Checklist

**5 minutes before:**
- [ ] Open SYSTEM_DIAGRAMS.md in browser (GitHub or mermaid.live)
- [ ] Have GLOSSARY.md ready for reference
- [ ] Sample generated code files ready to show
- [ ] Architecture diagram tab open
- [ ] Stats/results ready to reference

---

## 🎬 Session Script

### Part 1: The Problem We're Solving (3 minutes)

**You:**

> "We all know the pain of using generic AI for code generation. It produces code that works in isolation but doesn't fit our codebase:"
> 
> - Uses `app.get()` instead of our custom route pattern
> - Invents imports like `require('db')` that don't exist
> - Puts business logic in controllers instead of services
> - Ignores our module aliases (@main, @lending, @config)
> 
> **The fundamental problem:** Generic AI models don't understand codebase-specific patterns.
> 
> **What we built:** A system that gives AI deep structural and semantic understanding of our actual codebase.

---

### Part 2: High-Level Architecture (4 minutes)

**[SHOW DIAGRAM 1: HIGH-LEVEL ARCHITECTURE]**

**You:**

> "The system has three main components:"

#### **1. Indexing Pipeline (Offline)**

```
694 JS files → tree-sitter parser → Extract:
  - 6,375 functions
  - 482 routes
  - 3,279 dependency edges
  - 6,501 symbols

→ Store in:
  - Qdrant (5,022 vectors)
  - SQLite (symbols + deps)
  - Orama (BM25 index)
  - repo-map.txt (4,740 tokens)
```

**Key insight:** Parse once, index everything, enable fast retrieval.

#### **2. MCP Server (Local Node.js process)**

Exposes 15 tools via Model Context Protocol:
- `get_repo_map()` - Structural overview
- `search_codebase()` - Hybrid BM25 + vector search
- `get_symbol()` - Exact function lookup
- `get_routes()` - Find routes by domain
- `get_dependencies()` - Graph traversal
- File access tools (read, list, grep)

**Key insight:** Tools are the interface between indexed knowledge and AI.

#### **3. AI Client (Claude Desktop / Cursor)**

Calls MCP tools to:
1. Load context (repo map, search results, dependencies)
2. Generate implementation plan
3. Generate code matching patterns
4. Validate with lint + tests
5. Surface diffs for human review

**Key insight:** Agent orchestrates, humans review at two checkpoints.

---

### Part 3: The Core Innovation - 4-Layer Retrieval (8 minutes)

**[SHOW DIAGRAM 2: THE 4-LAYER RETRIEVAL STACK]**

**You:**

> "Traditional RAG uses one layer: vector search. We use FOUR. This is the key innovation."

#### **Layer 1: Repo Map (Always-in-Context)**

```
PageRank on dependency graph → Top 120 files → Compressed text summary

Output: 4,740 tokens covering:
  - All 40 route files
  - All 73 controllers  
  - Top services by import count
  - Key middleware, config, utils
```

**Purpose:** Give the agent a "mental model" before search.  
**Analogy:** City map before exploring neighborhoods.

#### **Layer 2: Hybrid Search (BM25 + Vector + Fusion + MMR)**

**The Problem with Pure Vector Search:**

```
Query: "implement user authentication"

Pure RAG returns:
  1. auth_route_1.js  ← all embed similarly
  2. auth_route_2.js  ← because they all
  3. auth_route_3.js  ← talk about "auth"
  ...
  10. auth_route_10.js ← structurally identical, useless!
```

**Our Solution: Hybrid + MMR**

```
Step 1: Parallel search
  BM25 (keyword):  Finds exact names like "getUserById"
  Vector (semantic): Finds concepts like "user data retrieval"

Step 2: RRF Merge
  Combines rankings without tuning weights
  Formula: score = 1/(k + rank)

Step 3: MMR Re-ranking  
  Balances relevance vs diversity
  Formula: score = λ × relevance − (1−λ) × max_similarity_to_selected
```

**Result with MMR (λ=0.5):**

```
  1. auth_route.js          ← high relevance, nothing selected yet
  2. auth_middleware.js     ← 0.60 similar (different layer)
  3. auth_service.js        ← 0.55 similar (different concern)
  4. token_utils.js         ← 0.40 similar (different aspect)
  5. session_storage.js     ← 0.35 similar (different persistence)
  ...
  
  = Architectural diversity! Full stack context!
```

**[SHOW DIAGRAM 7: COMPARISON]**

**Validation Results:**

| Query | BM25 Only | Vector Only | Hybrid+MMR |
|-------|-----------|-------------|------------|
| Success rate | 80% (4/5) | 60% (3/5) | **100% (5/5)** |

**Key insight:** You need BOTH keyword and semantic, plus diversity.

#### **Layer 3: Dependency Graph Traversal**

```
Seed files from Layer 2 → BFS traversal (1-2 hops) → Add dependencies

Example:
  Found: credit_facility_controller.js
  
  Traverse imports:
    → credit_facility_service.js
    → db_service/credit_facility.js
    → schemas/credit_facility_schema.js
  
  Traverse imported_by:
    → routes/credit_facility.js
    → routes/lending_dashboard.js
  
  Result: +10 related files the agent needs but didn't search for
```

**Purpose:** Expand context to include architectural dependencies.

#### **Layer 4: Agentic File Access**

```
Tools: read_file(), list_directory(), grep_codebase()

Usage: If retrieval missed something AND the agent knows what it needs,
       it can request specific files by path.
```

**Purpose:** Safety net. Retrieval is never perfect.

---

### Part 4: Key Algorithms Explained (4 minutes)

**You:**

> "Let me explain the three algorithms that make hybrid search work:"

#### **1. BM25 (Best Matching 25)**

**What:** Keyword ranking algorithm with smart weighting.

**How it works:**
```
score = IDF(term) × (f(q,D) × (k1 + 1)) / (f(q,D) + k1 × (1 - b + b × |D| / avgDL))

Where:
  - f(q,D) = term frequency in document
  - IDF = inverse document frequency (rare words score higher)
  - k1, b = tuning parameters (we use defaults)
  - |D| / avgDL = document length normalization
```

**Why it's smart:**
- Penalizes common words ("the", "function")
- Rewards rare words ("authenticateUser")
- Normalizes by document length

#### **2. RRF (Reciprocal Rank Fusion)**

**Problem:** How to merge BM25 scores (0-10) and cosine similarity (0-1)?

**Solution:** Rank-based fusion instead of score-based.

```
RRF_score(d) = Σ 1/(k + rank(d))

Example:
  BM25 ranks:    auth.js=#1, login.js=#2, middleware.js=#3
  Vector ranks:  middleware.js=#1, auth.js=#2, session.js=#3
  
  RRF scores:
    auth.js:       1/(60+1) + 1/(60+2) = 0.0164 + 0.0161 = 0.0325
    middleware.js: 1/(60+3) + 1/(60+1) = 0.0159 + 0.0164 = 0.0323
    login.js:      1/(60+2) + 0        = 0.0161
```

**Why it works:** No hyperparameter tuning, handles different score scales.

#### **3. MMR (Maximal Marginal Relevance)**

**Problem:** Top-k vector search returns structurally similar results.

**Solution:** Iteratively select results that maximize relevance AND minimize similarity to already-selected.

```
score(d) = λ × similarity(d, query) − (1−λ) × max[similarity(d, selected)]

Algorithm:
  1. Pick top result (highest relevance)
  2. For each remaining candidate:
       - Calculate relevance to query
       - Calculate max similarity to all selected results
       - Score = λ × relevance − (1−λ) × max_similarity
  3. Pick highest score, repeat until limit reached

Lambda tuning:
  - λ=1.0: Only relevance (no diversity) → 10 identical results
  - λ=0.5: Balanced (our default for broad queries)
  - λ=0.8: Favor relevance (for specific lookups)
  - λ=0.0: Only diversity (chaos)
```

---

### Part 5: Technical Stack & Implementation Details (3 minutes)

#### **Indexing Stats**

| Metric | Value |
|--------|-------|
| Files indexed | 694 (excluded 849 migrations) |
| Functions extracted | 6,375 |
| Routes mapped | 482 |
| Code chunks | 5,024 |
| Vectors (Qdrant) | 5,022 (768 dims each) |
| Symbols (SQLite) | 6,501 |
| Dependency edges | 3,279 |
| Repo map size | 4,740 tokens |

**Performance:**
- Full index: ~48 minutes (one-time)
- Incremental update: ~35 seconds (git diff based)
- Search latency: ~70ms (BM25: 5ms, Vector: 50ms, RRF+MMR: 12ms)

#### **Technology Choices & Rationale**

| Component | Technology | Why? |
|-----------|------------|------|
| **Parser** | tree-sitter (WASM) | Error-tolerant (694 files, 0 crashes)<br>Used by GitHub at scale |
| **Vector DB** | Qdrant (self-hosted) | Server-side MMR (no vector transfer)<br>Free, runs locally |
| **Embeddings** | nomic-embed-text (Ollama) | Zero cost, local, 768 dims<br>Comparable quality to OpenAI for code |
| **BM25** | @orama/orama | Pure Node.js, in-memory<br>5ms search on 5K docs |
| **Symbol Map** | SQLite | 8MB file, sub-ms lookups<br>Zero config |
| **MCP** | @modelcontextprotocol/sdk | Standard protocol, works with<br>Claude Desktop & Cursor |

#### **Validation Results**

5 test queries comparing approaches:

| Approach | Success Rate | Notes |
|----------|--------------|-------|
| **Hybrid (BM25+Vector+MMR)** | **100% (5/5)** | All queries returned architecturally diverse, correct results |
| BM25 only | 80% (4/5) | Missed semantic matches |
| Vector only | 60% (3/5) | Missed exact name matches |

**Key finding:** Both keyword and semantic search are necessary.

---

### Part 6: Design Decisions & Tradeoffs (3 minutes)

**You:**

> "Let me explain some key technical decisions and why we made them:"

#### **Why tree-sitter over Espree/Babel?**

| Aspect | Espree | @babel/parser | tree-sitter |
|--------|--------|---------------|-------------|
| Error recovery | ❌ Crashes | ❌ Crashes | ✅ Continues |
| Speed | Fast | Slow | Fast (WASM) |
| Our result | — | — | **694 files, 0 crashes** |

**Decision:** Error tolerance is critical at scale.

#### **Why Qdrant over pgvector/Pinecone?**

| Feature | pgvector | Pinecone | Qdrant |
|---------|----------|----------|--------|
| Server-side MMR | ❌ | ❌ | ✅ |
| Self-hosted | ✅ | ❌ | ✅ |
| Cost | Free | $$$ | Free |

**Decision:** Server-side MMR saves transferring 50 vectors per query.

#### **Why Ollama (nomic-embed-text) over OpenAI?**

| Aspect | OpenAI API | Ollama Local |
|--------|------------|--------------|
| Cost | ~$0.10 per index | $0 |
| Privacy | Data sent to API | Never leaves machine |
| Dimensions | 1536 | 768 |
| Quality for code | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Decision:** Good enough quality, zero cost, local = winner for sensitive codebases.

#### **Why Hybrid (BM25+Vector) instead of Vector-only?**

**Empirical evidence:** 100% vs 60% success rate on test queries.

**Theoretical reason:** Embeddings capture semantics, not exact symbols. Need both.

---

### Part 7: Limitations & Roadmap (2 minutes)

#### **Current Limitations**

1. **Description generation** - Manual via Cursor (30 min/index)
   - Can automate with Claude API (not yet implemented)

2. **No PRD history index** - Phase 5 not implemented
   - Can't learn from past features yet

3. **Single codebase** - CargoFin-specific config
   - Generalizing requires updating config files

4. **File-level dependencies** - No function-level call graph
   - Can add with @babel/traverse for deep analysis

#### **Roadmap**

**Short term:**
- Automate NL description generation
- Implement PRD history index (Phase 5)
- Git pre-commit hook for auto-indexing
- Multi-codebase support

**Long term:**
- Function-level call graph
- Test coverage integration
- CI/CD failure correlation
- Cross-project pattern learning

---

### Part 8: Q&A (5 minutes)

**Common Technical Questions:**

#### **Q: "How does chunking work exactly?"**

**A:**
> "AST-aware chunking at function boundaries. We parse with tree-sitter, extract each function as a complete unit, re-attach relevant imports (capped at 500 chars), and add 2-3 lines of surrounding context (JSDoc, exports). Target ~500 chars but flexible - never split mid-function. Research shows +4.3 point improvement in Recall@5 vs fixed-size chunking."

---

#### **Q: "Why not use a knowledge graph (like Cognee)?"**

**A:**
> "Cognee is promising but:"
> - Python-only (no confirmed JS support)
> - Pre-v1.0 (unstable)
> - Requires cloud LLMs for entity extraction
> - No proven code-specific implementation
> 
> "Our dependency graph gives us structural relationships. Knowledge graphs would add semantic relationships between entities, which could be valuable future work."

---

#### **Q: "How do you handle code changes without re-indexing everything?"**

**A:**
> "Incremental indexing via git diff:"
> 
> ```bash
> # Stores last indexed commit
> echo $COMMIT_HASH > index/.last-indexed
> 
> # On next run:
> git diff $LAST_COMMIT --name-only
> → Re-parse only changed files
> → Re-chunk (~75 chunks)
> → Re-embed (~30 seconds)
> → Update symbol map + regenerate repo map
> ```
> 
> "Result: 48 min full index → 35 sec incremental."

---

#### **Q: "What about hallucinated imports?"**

**A:**
> "Three mitigations:"
> 
> 1. **Repo map** shows all available imports up front
> 2. **Retrieval** surfaces real examples with correct imports  
> 3. **Lint validation** catches import errors before human review
> 
> "In practice, rarely an issue because the agent sees real patterns."

---

#### **Q: "Can this work for other languages?"**

**A:**
> "Yes, but requires:"
> - tree-sitter grammar for that language (exists for most)
> - Language-specific AST traversal patterns
> - Codebase-specific chunking strategy
> 
> "The hybrid retrieval stack is language-agnostic. The parser and chunker need adaptation."

---

#### **Q: "How do you measure retrieval quality objectively?"**

**A:**
> "We use Recall@K and success rate on curated test queries:"
> - 5 queries covering different use cases
> - Ground truth: manually identified relevant files
> - Measure: Does top-K results include ground truth?
> 
> "Our hybrid approach: 100% success. Vector-only: 60%. BM25-only: 80%."

---

### Closing (1 minute)

**You:**

> "Key takeaways:"
> 
> **Technical:**
> - Pure RAG doesn't work for code (structural homogeneity problem)
> - Hybrid BM25+Vector+MMR solves it (100% validation success)
> - 4-layer retrieval gives structural + semantic understanding
> 
> **Practical:**
> - 694 files indexed, 70ms search latency, zero cost
> - Works today in Claude Desktop, Cursor when unblocked
> 
> **Documentation:**
> - SYSTEM_ARCHITECTURE.md - complete technical details
> - GLOSSARY.md - all concepts explained
> - SYSTEM_DIAGRAMS.md - visual architecture
> 
> "Questions? Want to try it? See me after or check the repo."

---

## 📊 Key Metrics to Reference

Throughout the session, reference these numbers when relevant:

| Metric | Value | Context |
|--------|-------|---------|
| **Time saved** | 3-4 hours → 15 min review | Per feature implementation |
| **Retrieval accuracy** | 100% (5/5 queries) | vs 60% vector-only, 80% BM25-only |
| **Scale** | 694 files, 6,375 functions | Full CargoFin backend indexed |
| **Search latency** | 70ms | BM25: 5ms, Vector: 50ms, Fusion: 12ms |
| **Index time** | 48 min full, 35 sec incremental | One-time vs ongoing |
| **Cost** | $0 | All runs locally (Ollama + Qdrant) |
| **Storage** | 220 MB total | Qdrant: 150MB, SQLite: 8MB, BM25: 12MB |

---

## ⏱️ Time Management

| Section | Time | Notes |
|---------|------|-------|
| Problem statement | 3 min | Sets context |
| Architecture overview | 4 min | High-level only |
| 4-layer retrieval (core) | 8 min | Most important section |
| Algorithms explained | 4 min | BM25, RRF, MMR |
| Tech stack & stats | 3 min | Quick overview |
| Design decisions | 3 min | Tradeoffs |
| Limitations & roadmap | 2 min | Be honest |
| Q&A | 5+ min | Flexible |

**Total:** 25-30 minutes + Q&A

---

## 🎯 Presentation Tips

### For Technical Audience

- **Emphasize algorithms** - Spend time on MMR, show the math
- **Show code samples** - Actual generated files, not abstractions
- **Discuss tradeoffs** - Why tree-sitter over Espree, etc.
- **Invite skepticism** - "What edge cases would break this?"

### Key Moments to Slow Down

1. **MMR explanation** - The core innovation, don't rush it
2. **Hybrid search comparison** - Show the 100% vs 60% vs 80% table
3. **Design decision rationale** - Why we chose each technology

### Visual Aids to Use

- **Diagram 1** (Architecture) - High-level overview
- **Diagram 2** (4-layer stack) - Core innovation
- **Diagram 7** (Pure RAG vs Ours) - The "aha moment"
- **Stats tables** - Validation results, performance metrics

---

## 📚 Follow-Up Resources

**Point audience to:**

- **SYSTEM_ARCHITECTURE.md** - Complete technical deep-dive
- **GLOSSARY.md** - Every concept explained from basics
- **SYSTEM_DIAGRAMS.md** - All 10 diagrams with explanations
- **README.md** - Quick start guide

**For hands-on learners:**
- Setup instructions in README.md (10 minutes)
- Slack channel for questions
- Office hours for pairing on setup

---

## 🎓 Practice Recommendations

**Before the session:**
1. Walk through the MMR algorithm explanation out loud
2. Time yourself - 25 minutes without Q&A
3. Have colleague review for clarity
4. Prepare answers to likely technical questions
5. Test diagram rendering (GitHub/mermaid.live)

**During the session:**
- Use whiteboard for ad-hoc explanations if needed
- Encourage questions throughout (not just at end)
- Reference GLOSSARY.md for on-the-spot definitions

---

**Remember:** This is knowledge sharing, not a sales pitch. Be honest about limitations, invite critique, foster discussion. The goal is technical understanding, not convincing skeptics.
