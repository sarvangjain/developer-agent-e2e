# Checkpoint 2: Architecture & Design — Feedback (Round 1)

**Date:** 2026-02-25  
**Reviewer:** Developer  
**Draft Reviewed:** checkpoint2_architecture_design_draft1.md

---

## Overall Status: REVISION REQUIRED

The architecture is solid, but the **Aggregation Engine Design** needs refinement for smarter duplicate handling.

---

## Feedback: Aggregation Engine — Intelligent Duplicate Handling

### Current Design (Section: Aggregation Engine Design)

The current de-duplication logic is too simplistic:
> "De-duplicate by task name (case-insensitive normalized)"

This approach will incorrectly merge tasks that have the **same name but different purposes** based on stage, category, owner, or completion criteria.

---

### Required Change

The aggregation engine should consider **multiple dimensions** when identifying duplicates, not just task name. Two tasks are duplicates ONLY if ALL of the following match:

1. **Task Name** (case-insensitive normalized)
2. **Stage** (workflow lifecycle stage)
3. **Category** (Documentation, Legal, Compliance, etc.)
4. **Owner Role** (who completes the task)
5. **Completion Criteria Type** (Document, Input Field, Undertaking)

If any of these differ, the tasks are **NOT duplicates** and should both appear in the instance.

---

### Examples

#### Example 1: Same Name, Different Stage — NOT a Duplicate

| Template | Task Name | Stage | Category | Owner | Criteria |
|----------|-----------|-------|----------|-------|----------|
| Template A (Global) | "Board Resolution" | Maker Draft | Documentation | Operations Maker | Document |
| Template B (Country: UAE) | "Board Resolution" | Checker Approval | Compliance | Operations Checker | Undertaking |

**Current Logic:** Would merge these into ONE task (wrong!)

**Correct Logic:** These are TWO separate tasks because:
- Different Stage (Maker Draft vs Checker Approval)
- Different Category (Documentation vs Compliance)
- Different Owner (Maker vs Checker)
- Different Criteria (Document vs Undertaking)

**Result:** Instance should contain BOTH tasks.

---

#### Example 2: Same Name, Same Stage, Different Owner — NOT a Duplicate

| Template | Task Name | Stage | Category | Owner | Criteria |
|----------|-----------|-------|----------|-------|----------|
| Template A | "Verify Insurance" | Maker Draft | Documentation | Operations Maker | Document |
| Template B | "Verify Insurance" | Maker Draft | Documentation | Credit Analyst | Document |

**Current Logic:** Would merge these into ONE task (wrong!)

**Correct Logic:** These are TWO separate tasks because:
- Different Owner (Operations Maker vs Credit Analyst)
- Both need to verify insurance from their perspective

**Result:** Instance should contain BOTH tasks.

---

#### Example 3: True Duplicate — SHOULD Merge

| Template | Task Name | Stage | Category | Owner | Criteria | Mandatory |
|----------|-----------|-------|----------|-------|----------|-----------|
| Template A (Global) | "KYC Document" | Maker Draft | Compliance | Operations Maker | Document | No |
| Template B (Country: India) | "KYC Document" | Maker Draft | Compliance | Operations Maker | Document | Yes |

**Correct Logic:** These ARE duplicates because ALL key fields match:
- Same Name
- Same Stage
- Same Category
- Same Owner
- Same Criteria

**Merge Rule:** Apply "strictest wins" — task becomes **Mandatory = Yes**

**Result:** Instance contains ONE task marked as Mandatory.

---

#### Example 4: Same Name, Different Completion Criteria — NOT a Duplicate

| Template | Task Name | Stage | Category | Owner | Criteria |
|----------|-----------|-------|----------|-------|----------|
| Template A | "Client Consent" | Checker Approval | Legal | Operations Checker | Document |
| Template B | "Client Consent" | Checker Approval | Legal | Operations Checker | Undertaking |

**Current Logic:** Would merge these into ONE task (wrong!)

**Correct Logic:** These are TWO separate tasks because:
- Document = upload a signed consent form
- Undertaking = attestation checkbox that checker has verified consent

**Result:** Instance should contain BOTH tasks.

---

### Updated Algorithm

```
1. Fetch all APPROVED templates where workflow_type matches
2. For each template, fetch its parameters and tasks
3. Match templates against parameterContext (existing logic)
4. Collect all tasks from matched templates
5. Filter by effective dates (existing logic)
6. Create composite key for de-duplication:
   KEY = normalize(task_name) + stage + category + owner_role + completion_criteria_type
7. Group tasks by composite key
8. For each group with multiple tasks:
   - Mandatory wins over Optional (existing logic)
   - If completion_criteria details differ (e.g., different document types), keep BOTH
   - Merge additional_info and sample_document from most specific template
9. Return aggregated task list
```

---

### Additional Consideration: Completion Criteria Details

For tasks with **Completion Criteria = Document**, also consider:
- Document Category
- Document Type

Two tasks requiring different document types are NOT duplicates even if everything else matches.

**Example:**

| Task Name | Stage | Owner | Criteria | Doc Type |
|-----------|-------|-------|----------|----------|
| "Upload Certificate" | Maker Draft | Maker | Document | Tax Certificate |
| "Upload Certificate" | Maker Draft | Maker | Document | Insurance Certificate |

**Result:** Instance should contain BOTH tasks (different document types required).

---

## Summary of Required Changes

1. **Update de-duplication key** to include: name + stage + category + owner + criteria_type
2. **Add document type comparison** for Document criteria tasks
3. **Update algorithm documentation** in the Architecture document
4. **Add examples** to illustrate the logic for future reference

---

## Other Minor Feedback

1. Add `TEXT_RESPONSE` to completion criteria types (per PRD Module 9)
2. Clarify task reversion flow when document is deleted

---

**Action Required:** Please revise the Aggregation Engine Design section and produce Draft 2.
