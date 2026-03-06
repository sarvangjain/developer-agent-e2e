# Checkpoint 2: Architecture & Design — Feedback (Round 2)

**Date:** 2026-02-25  
**Reviewer:** Developer  
**Draft Reviewed:** checkpoint2_architecture_design_draft2.md

---

## Overall Status: REVISION REQUIRED

The composite key approach is correct, but **task name should NOT be part of the duplicate identification key**.

---

## Feedback: Remove Task Name from Composite Key

### Current Design (Draft 2)

The composite key currently includes task name:

```
key = normalize(name) + '|' + stage + '|' + category + '|' + owner_role + '|' + completion_criteria
```

This is **incorrect**.

---

### Required Change

The composite key should identify duplicates based on **functional purpose only**, not name:

```
key = stage + '|' + category + '|' + owner_role + '|' + completion_criteria + '|' + document_type (if applicable)
```

**Rationale:** Two tasks with different names can serve the same functional purpose. If they have the same stage, category, owner, and completion criteria, they are functionally equivalent and should be merged — regardless of what they are named.

---

### Example: Why Name Should Be Excluded

| Template | Task Name | Stage | Category | Owner | Criteria | Doc Type |
|----------|-----------|-------|----------|-------|----------|----------|
| Template A (Global) | "Upload KYC" | Maker Draft | Compliance | MAKER | Document | KYC |
| Template B (India) | "Submit KYC Documentation" | Maker Draft | Compliance | MAKER | Document | KYC |

**With Name in Key (Current - Wrong):**
- Key A: `upload_kyc|1|COMPLIANCE|MAKER|DOCUMENT|KYC`
- Key B: `submit_kyc_documentation|1|COMPLIANCE|MAKER|DOCUMENT|KYC`
- Result: Keys differ → **TWO tasks** in instance (wrong — user uploads KYC twice!)

**Without Name in Key (Correct):**
- Key A: `1|COMPLIANCE|MAKER|DOCUMENT|KYC`
- Key B: `1|COMPLIANCE|MAKER|DOCUMENT|KYC`
- Result: Keys match → **ONE merged task** (correct — same functional requirement)

---

### Updated Composite Key Definition

| Dimension | Column | Comparison |
|-----------|--------|------------|
| Stage | `stage` | Exact match (workflow lifecycle priority) |
| Category | `category` | Exact match (DOCUMENTATION, LEGAL, etc.) |
| Owner Role | `owner_role` | Exact match (CA, MAKER, CHECKER, CLIENT, etc.) |
| Completion Criteria Type | `completion_criteria` | Exact match (DOCUMENT, INPUT_FIELD, UNDERTAKING, TEXT_RESPONSE) |
| Document Type (sub-key) | `document_type` | Exact match — **only compared when completion_criteria = DOCUMENT** |

**Task Name is NOT part of the key.**

---

### Merge Rule for Task Name

When merging duplicate tasks (same composite key), the **task name** from the **more specific template** (more parameter bindings) wins. If equal specificity, use the name from the first template encountered (or the longer/more descriptive name).

---

### Updated Algorithm (Step 6)

```
6. BUILD composite key for each task:
   → key = stage + '|' + category + '|' + owner_role + '|' + completion_criteria
   → If completion_criteria == 'DOCUMENT':
       key += '|' + normalize(document_type)
   
   // NOTE: Task name is NOT part of the key
```

---

### Updated Examples

#### Example 1: Different Names, Same Function — IS a Duplicate (Merge)

| Template | Task Name | Stage | Category | Owner | Criteria | Doc Type |
|----------|-----------|-------|----------|-------|----------|----------|
| Template A | "Upload KYC" | Maker Draft | Compliance | MAKER | Document | KYC |
| Template B | "Submit KYC Documentation" | Maker Draft | Compliance | MAKER | Document | KYC |

**Composite Key (without name):** `1|COMPLIANCE|MAKER|DOCUMENT|KYC`

**Result:** Keys match → **MERGE**. Pick name from more specific template.

#### Example 2: Same Function, Different Document Types — NOT a Duplicate

| Template | Task Name | Stage | Category | Owner | Criteria | Doc Type |
|----------|-----------|-------|----------|-------|----------|----------|
| Template A | "Upload Certificate" | Maker Draft | Documentation | MAKER | Document | Tax Certificate |
| Template B | "Upload Certificate" | Maker Draft | Documentation | MAKER | Document | Insurance Certificate |

**Composite Keys:**
- A: `1|DOCUMENTATION|MAKER|DOCUMENT|Tax Certificate`
- B: `1|DOCUMENTATION|MAKER|DOCUMENT|Insurance Certificate`

**Result:** Keys differ (different doc types) → **BOTH tasks** appear.

#### Example 3: Same Name, Different Stage — NOT a Duplicate

| Template | Task Name | Stage | Category | Owner | Criteria |
|----------|-----------|-------|----------|-------|----------|
| Template A | "Board Resolution" | Maker Draft | Documentation | MAKER | Document |
| Template B | "Board Resolution" | Checker Approval | Compliance | CHECKER | Undertaking |

**Composite Keys:**
- A: `1|DOCUMENTATION|MAKER|DOCUMENT|null`
- B: `2|COMPLIANCE|CHECKER|UNDERTAKING|null`

**Result:** Keys differ (stage, category, owner, criteria all differ) → **BOTH tasks** appear.

---

## Additional Minor Fix

Remove change Added document-deletion reversion flow and clarified the COMPLETED → PENDING transition path as it will be handled from UI


---

**Action Required:** Please revise the Aggregation Engine Design section to remove task name from the composite key and produce Draft 3.
