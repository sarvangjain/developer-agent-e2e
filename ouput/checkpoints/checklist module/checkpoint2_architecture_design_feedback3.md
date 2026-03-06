# Checkpoint 2: Architecture & Design — Feedback (Round 3)

**Date:** 2026-02-25  
**Reviewer:** Developer  
**Draft Reviewed:** checkpoint2_architecture_design_draft3.md

---

## Overall Status: MINOR REVISION REQUIRED

Draft 3 correctly implements the aggregation engine without task name in the composite key. Two minor issues need to be addressed before approval.

---

## Feedback 1: Restore Document-Deletion Reversion Flow

### Current Design (Draft 3)

Change log item #8 states:
> "Removed document-deletion reversion flow (COMPLETED → PENDING on doc delete) — this will be handled from the UI side"

This is **incorrect**. The backend should handle task status reversion when a document is deleted.

---

### Required Change

Restore the document-deletion reversion logic to the backend. When a document linked to a COMPLETED task (with `completion_criteria = DOCUMENT`) is deleted:

1. The task status should revert from `COMPLETED` → `PENDING`
2. An audit record should be created with action `REVERTED_DOC_DELETED`
3. Notification N3.1 should be sent (if the task is mandatory)
4. The gatekeeper calculation is immediately affected — if the task was mandatory, submission becomes blocked

---

### Integration Approach

**Option A: Document Service Callback**

When the document service deletes a document, it calls `checklistService.onDocumentDeleted(trx, workflowId, documentType)`:

```
Document Service (document_service/index.js#deleteDocument)
  → After successful deletion
  → Call checklistService.onDocumentDeleted(trx, workflowId, documentType)
    → DB Service: Find instance tasks where:
        - workflow_id matches
        - completion_criteria = 'DOCUMENT'
        - document_type matches
        - status = 'COMPLETED'
    → For each matching task:
        - Update status to 'PENDING'
        - Clear completed_by, completed_at
        - Insert audit record (action: 'REVERTED_DOC_DELETED')
    → If any reverted task is mandatory:
        - Send notification N3.1
```

**Option B: Webhook/Event Pattern**

If the document service doesn't want a direct dependency on checklist service, use an event emitter:

```
Document Service emits: 'document:deleted' { workflowId, documentType }
Checklist Service listens and handles reversion
```

**Recommended:** Option A (direct callback) for simplicity in Phase 1.

---

### Updated Instance Task State Machine

Restore the COMPLETED → PENDING transition on document deletion:

```
                                      ┌──────────────┐
                                      │   PENDING    │ (default)
                                      └──────┬───────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
              │  COMPLETED   │     │   DEFERRED   │     │REVIEW_PENDING│ (client tasks)
              └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
                     │                    │                     │
                     ▼                    ▼                ┌────┴────┐
              ┌──────────────┐     ┌──────────────┐       ▼         ▼
              │   PENDING    │     │  COMPLETED   │ ┌──────────┐ ┌──────────┐
              │ (doc deleted)│     └──────────────┘ │ ACCEPTED │ │ REJECTED │
              └──────────────┘                      └──────────┘ └────┬─────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │   PENDING    │
                                                               └──────────────┘
```

**Task Reversion on Document Deletion:** When a Document-type task is in `COMPLETED` status and the corresponding document (matched by workflow_id + document_type) is deleted, the task transitions back to `PENDING`. This reversion:
- Triggers notification N3.1 (if the task is mandatory)
- Immediately affects gatekeeper calculation
- Is recorded in the audit table with action `REVERTED_DOC_DELETED`

---

### Files to Modify (Additional)

| File Path | Function(s) to Change | What Changes |
|-----------|----------------------|--------------|
| `backend/src/lending/services/document_service/index.js` | `deleteDocument()` or equivalent | Add callback to `checklistService.onDocumentDeleted()` after successful deletion |
| `backend/src/lending/services/checklist/index.js` | New function | Add `onDocumentDeleted(trx, workflowId, documentType)` to handle reversion |

---

### Audit Actions (Restore)

Add `REVERTED_DOC_DELETED` back to the audit action list in the Database Table Design section:

```
checklist_instance_task_audit: action (COMPLETED, DEFERRED, UNDONE, REVIEWED, REVERTED_DOC_DELETED, etc.)
```


---

## Summary of Required Changes

1. **Restore document-deletion reversion flow** — backend handles COMPLETED → PENDING on doc delete
2. **Add `onDocumentDeleted()` function** to checklist service
3. **Add document service integration** — callback after document deletion
4. **Restore `REVERTED_DOC_DELETED`** audit action

---

**Action Required:** Please revise Draft 3 with these changes and produce Draft 4.
