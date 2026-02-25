# PRD: [Feature Name]

## Overview
[2-3 sentences describing the feature at a high level]

## Motivation
[Why is this needed? What problem does it solve?]

## Requirements

### Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Non-Functional Requirements
- Performance: [any latency/throughput requirements]
- Security: [authentication, authorization, data sensitivity]
- Compliance: [regulatory requirements if applicable]

## API Design

### New Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /resource | List resources |
| POST | /resource | Create resource |
| PATCH | /resource/:id | Update resource |

### Request/Response Examples
```json
// POST /resource
{
  "field": "value"
}

// Response 200
{
  "id": 1,
  "field": "value",
  "created_at": "2026-01-01T00:00:00Z"
}
```

## Data Model
[Describe new tables, columns, or changes to existing schema]

## Edge Cases
1. [Edge case 1 — how should it be handled?]
2. [Edge case 2]

## Decisions
- [Decision 1: We chose X over Y because...]
- [Decision 2]

## Out of Scope
- [What this PRD explicitly does NOT cover]

## Dependencies
- [Other features/services this depends on]
- [External APIs or systems involved]
