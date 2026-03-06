# Developer Agent Architecture

## System Overview

```mermaid
flowchart TB
    subgraph User["User Workflow"]
        PRD["PRD Document"]
        Claude["Claude Desktop"]
        Code["Generated Code"]
    end

    subgraph MCP["MCP Server"]
        MCPServer["MCP Protocol Handler"]
        
        subgraph Tools["Available Tools"]
            T1["get_repo_map"]
            T2["search_codebase"]
            T3["get_symbol"]
            T4["get_routes"]
            T5["get_dependencies"]
            T6["get_db_schema"]
            T7["read_file"]
            T8["grep_codebase"]
        end
    end

    subgraph Retrieval["4-Layer Retrieval"]
        L1["Layer 1: Repo Map"]
        L2["Layer 2: Hybrid Search"]
        L3["Layer 3: Dependency Graph"]
        L4["Layer 4: File Access"]
    end

    subgraph Index["Index Files"]
        Chunks["chunks.json"]
        BM25File["bm25-index.json"]
        SymbolFile["symbol-map.db"]
        RepoFile["repo-map.txt"]
        SchemaFile["db-schema.json"]
    end

    subgraph External["External Services"]
        Ollama["Ollama Embeddings"]
        Qdrant["Qdrant Vector DB"]
        ClaudeAPI["Claude API"]
    end

    PRD --> Claude
    Claude <--> MCPServer
    Claude --> Code
    MCPServer --> Tools
    T1 --> L1
    T2 --> L2
    T3 --> L3
    T6 --> SchemaFile
    T7 --> L4
    L2 --> Qdrant
    L2 --> BM25File
```

---

## Search Flow

```mermaid
sequenceDiagram
    participant U as User/Claude
    participant MCP as MCP Server
    participant BM25 as BM25 Orama
    participant Vec as Qdrant
    participant Ollama as Ollama

    U->>MCP: search_codebase query
    
    par Parallel Search
        MCP->>Ollama: Embed query
        Ollama-->>MCP: 3584-dim vector
        MCP->>Vec: Vector search top 50
        Vec-->>MCP: Vector results
    and
        MCP->>BM25: Keyword search top 50
        BM25-->>MCP: BM25 results
    end
    
    MCP->>MCP: RRF Fusion k=60
    MCP->>MCP: MMR Re-rank
    MCP-->>U: Top 20 diverse results
```

---

## Indexing Pipeline

```mermaid
flowchart LR
    subgraph Input
        JS["JS files ~1500"]
    end

    subgraph Pipeline
        P1["1. Parse Tree-sitter"]
        P2["2. Symbol Map SQLite"]
        P3["3. Repo Map PageRank"]
        P4["4. Chunk AST-aware"]
        P5["5. Describe Claude"]
        P6["6. Embed Ollama"]
        P7["7. Store Qdrant+BM25"]
    end

    subgraph Output
        O1["chunks.json"]
        O2["symbol-map.db"]
        O3["repo-map.txt"]
        O4["bm25-index.json"]
        O5["Qdrant collection"]
    end

    JS --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7
    P4 --> O1
    P2 --> O2
    P3 --> O3
    P7 --> O4
    P7 --> O5
```

---

## DB Schema Hybrid

```mermaid
flowchart LR
    subgraph Sources
        CSV["db-schema.csv from DB"]
        Mig["migrations 857 files"]
    end

    subgraph Processing
        Parse["index-migrations.js"]
        Build["build-db-schema.js"]
    end

    subgraph Output
        JSON["db-schema.json 366 tables"]
    end

    subgraph MCP
        Tool["get_db_schema tool"]
    end

    CSV --> Build
    Mig --> Parse --> Build
    Build --> JSON --> Tool
```

---

## Layer 2: Hybrid Search Detail

```mermaid
flowchart TB
    Query["Search Query"] --> Split

    subgraph Split["Parallel Execution"]
        BM25["BM25 Keyword Search"]
        Vector["Vector Semantic Search"]
    end

    subgraph Fusion["Result Fusion"]
        RRF["RRF: score = 1/k+rank"]
        MMR["MMR: diversity rerank"]
    end

    BM25 --> RRF
    Vector --> RRF
    RRF --> MMR
    MMR --> Results["Top 20 Results"]
```

---

## 4-Layer Architecture

```mermaid
flowchart TB
    subgraph L1["Layer 1: Structural"]
        RM["get_repo_map - PageRank ranked"]
    end

    subgraph L2["Layer 2: Search"]
        SC["search_codebase - Hybrid BM25+Vector"]
    end

    subgraph L3["Layer 3: Graph"]
        SY["get_symbol - Name lookup"]
        RT["get_routes - Express routes"]
        DP["get_dependencies - Import graph"]
        DB["get_db_schema - Tables"]
    end

    subgraph L4["Layer 4: Files"]
        RF["read_file - Full content"]
        LD["list_directory - Dir listing"]
        GR["grep_codebase - Regex search"]
    end

    L1 --> L2 --> L3 --> L4
```

---

## Component Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| MCP Server | Node.js stdio | Exposes tools to Claude Desktop |
| BM25 Index | Orama | Keyword search |
| Vector Store | Qdrant | Semantic search |
| Embeddings | Ollama nomic-embed-code | 3584-dim code embeddings |
| Symbol Map | SQLite | Function/class lookup |
| Repo Map | PageRank | Structural overview |
| Descriptions | Claude Haiku | Code chunk summaries |

---

## Data Flow Summary

```mermaid
flowchart LR
    Codebase["CargoFin Backend"] --> Indexer["Indexing Pipeline"]
    Indexer --> IndexFiles["Index Files"]
    IndexFiles --> MCP["MCP Server"]
    MCP --> Claude["Claude Desktop"]
    Claude --> User["Developer"]
```
