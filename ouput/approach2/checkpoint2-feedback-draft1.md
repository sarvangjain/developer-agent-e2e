# Checklist Feature — Module Decomposition Review Feedback

**Modules 1, 2 & 3 | April 2026**

---

## Module 1: DB Schema & Migrations

> **Status: APPROVED — No Changes Required**

Module 1 looks good and can be taken forward as-is.

---

## Module 2 & Module 3: Template CRUD & Maker-Checker Workflow

> **Status: REDESIGN REQUIRED**

### Feedback: Simplify and Consolidate API Approach

The current design for Module 2 and Module 3 introduces too many fragmented APIs for individual workflow actions (submit, approve, reject, send-back, etc.). This should be simplified into a cleaner, more flexible pattern with fewer endpoints and unified workflow handling.

---

### Change 1: Introduce a Dedicated Draft API

There should be a **single API** whose only responsibility is to save checklist templates in `DRAFT` state.

**This API should:**

- Create a new template with `status = DRAFT`
- Store all template + task data in one call
- **Not** trigger any workflow or state transitions
- Serve as pure draft persistence without any side effects

**Purpose:** Decouple the act of saving work-in-progress from any workflow logic. The draft API is a simple persistence operation — nothing more.

---

### Change 2: Consolidate All Actions into a Single Update API

Instead of having separate APIs for submit, approve, reject, send-back, etc., there should be **one unified update API** that handles all state transitions.

**This API should:**

- Handle all state transitions and updates through a single endpoint
- Accept an `action` identifier from the UI (e.g., `SUBMIT`, `APPROVE`, `REJECT`, `SEND_BACK`)
- Internally decide:
  - Status transitions (e.g., `DRAFT → PENDING_APPROVAL`, `PENDING_APPROVAL → APPROVED`)
  - Workflow movement (advance to next reviewer, return to previous)
  - Notification triggers (notify next approver, notify maker on rejection, etc.)

**Example payload:**

```json
{
  "templateId": "123",
  "action": "REJECT",
  "notes": "Incorrect configuration"
}
```

---

### Change 3: Redefine "Submit" Behavior

"Submit" should **not** be treated as a separate API. It is simply an action processed through the unified update API.

**When a user submits:**

- The system should move the template from `DRAFT` → next workflow state
- The current user should be considered as **already approved at their level**
- The workflow should automatically advance to the next reviewer in the chain

This means submit = implicit self-approval at the creator's level + forward movement in the workflow.

---

### Change 4: Support Create + Submit in One Step

Users should be able to **directly create and submit in a single action** without saving a draft first.

**If the user is confident and does not want to save as draft:**

- The system should create the template
- Immediately process it as submitted + approved by the creator
- Move it to the next workflow stage

This should be handled via the same update API (or the create API with an action flag), so there is no need for a third endpoint.

---

### Change 5: All Workflow Actions via the Update API

The following actions must **all** be routed through the single update API, driven by the `action` field in the request payload:

| Action | Behavior |
| --- | --- |
| `SUBMIT` | Move from DRAFT → next workflow state; auto-approve at creator's level |
| `APPROVE` | Approve at current reviewer level; advance to next reviewer or mark APPROVED if final |
| `REJECT` | Reject and return to maker with notes |
| `SEND_BACK` | Return to previous reviewer for re-evaluation with notes |

---

### Summary: Revised API Surface for Modules 2 & 3

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/lending/checklist-templates` | **Create template in DRAFT state** (pure persistence, no workflow) |
| PATCH | `/lending/checklist-templates/:templateId` | **Unified update API** — handles all actions (`SUBMIT`, `APPROVE`, `REJECT`, `SEND_BACK`) plus data edits |

> *Note: This two-endpoint design replaces the previously proposed separate APIs for submit, approve, reject, and send-back. All workflow intelligence lives inside the update API's service layer, making the controller thin and the routing simple.*

**Modules 4, 5 & 7 | April 2026**

---

## Module 4: Instance Engine & Parameter Aggregation

> **Status: CHANGE REQUIRED**

### Feedback: Aggregation Engine — Intelligent Duplicate Handling

#### Current Design Issue

The current de-duplication logic is too simplistic:

> *"De-duplicate by task name (case-insensitive normalized)"*

This approach will incorrectly merge tasks that share the **same name but serve different purposes** based on stage, category, owner, or completion criteria.

#### Required Change

The aggregation engine must consider **multiple dimensions** when identifying duplicates, not just the task name. Two tasks should be considered duplicates **ONLY if ALL** of the following attributes match:

1. **Stage** — The workflow lifecycle stage the task belongs to
2. **Category** — Documentation, Legal, Compliance, etc.
3. **Owner Role** — The role responsible for completing the task
4. **Completion Criteria Type** — Document, Input Field, or Undertaking

If any of these four dimensions differ between two tasks, they are **NOT duplicates** and must both appear in the generated instance.

#### Impact on Existing Design

- **`instance_engine.js`** — Replace name-based de-duplication with composite-key matching using `(stage + category + owner_role + completion_criteria_type)`
- **`checklist_instance.js` (db_service)** — Update any queries that rely on task name for uniqueness checks during aggregation
- **Acceptance Criteria update** — The existing AC *"De-duplication: same-name task appearing in multiple templates is rendered once"* must be revised to reflect composite-key logic

#### Updated Acceptance Criteria for Module 4

- De-duplication uses composite key: `(stage + category + owner_role + completion_criteria_type)`. Tasks matching on all four dimensions are merged with the strictest-mandatory-wins rule.
- Tasks with the same name but differing in any dimension (stage, category, owner, or criteria type) are treated as distinct and both appear in the instance.
- All other existing acceptance criteria for Module 4 remain unchanged.

---

## Module 5: Execution APIs & Gatekeeper

> **Status: CHANGE REQUIRED**

### Feedback: Batch Task Status Update

#### Current Design Issue

The current API provides a single-task status update:

```
PATCH  /lending/checklist-instances/tasks/:taskId/status
```

Updates a single task status (complete/uncomplete) with role validation.

This introduces unnecessary round-trips when the frontend needs to mark multiple tasks at once for a given checklist instance. This is a common user workflow (e.g., completing several documentation tasks after a batch upload).

#### Required Change

Replace the single-task PATCH endpoint with a **batch update endpoint** scoped to a checklist instance:

```
PATCH  /lending/checklist-instances/:instanceId/tasks/status
```

**Request Body:**

```json
{
  "tasks": [
    { "taskId": "uuid-1", "status": "COMPLETED" },
    { "taskId": "uuid-2", "status": "PENDING" }
  ]
}
```

#### Updated API Endpoints for Module 5

| Method | Path | Description |
| --- | --- | --- |
| GET | `/lending/checklist-instances/entity/:entityId` | Get instance with all tasks, grouped by category |
| GET | `/lending/checklist-instances/:instanceId/summary` | Get FAB summary: mandatory completed/total per category |
| **PATCH** | **`/lending/checklist-instances/:instanceId/tasks/status`** | **Batch update task statuses with per-task role validation** |
| GET | `/lending/checklist-instances/:instanceId/gatekeeper` | Validate mandatory task completion — returns `can_submit` boolean |

#### Impact on Existing Design

- **`update_task_status.js` (schema)** — Modify Joi validation to accept an array of `{ taskId, status }` objects instead of a single task payload
- **`execution.js` (service)** — Implement batch processing with per-task role validation; all tasks must belong to the specified `instanceId`
- **`checklist_instance.js` (db_service)** — Add batch update query; ensure all updates run within a single transaction for atomicity
- **`checklist_execution.js` (controller)** — Update route handler to parse batch payload and return per-task success/failure results
- **`checklist_task_audit_log`** — Write one audit entry per task status change within the batch

#### Updated Acceptance Criteria for Module 5

- Batch endpoint accepts 1–N task updates in a single request; all tasks must belong to the specified checklist instance
- Role validation is enforced per-task: user role must match the task owner (or task owner is null) for each individual task in the batch
- Partial success is supported: if 3 of 5 tasks pass validation, 3 are updated and 2 return role-mismatch errors in the response
- All successful updates within a batch are wrapped in a single DB transaction
- Each status change writes an individual audit log entry with `user_id`, `role`, `timestamp`, and old/new status
- FAB summary and gatekeeper reflect the updated state immediately after the batch completes
- All other existing acceptance criteria for Module 5 remain unchanged

---

## Module 7: DMS Auto-Verification & Client Portal Integration

> **Status: SCOPE REDUCTION**

### Feedback: Remove DMS Integration (Not Yet Developed)

#### Change Summary

The DMS (Document Management System) integration should be **removed from Module 7 scope entirely**, as DMS is not yet developed. Client Portal related changes should remain as-is.

#### What to Remove (DMS Scope — Defer to Future Module)

- ~~**File: `dms_integration.js`**~~ — Remove entirely from files to create
- ~~**Hook in `document_service/index.js`**~~ — Remove `onDocumentUploaded()` and `onDocumentDeleted()` hooks
- ~~**API: `POST /lending/checklist-instances/tasks/:taskId/upload-context`**~~ — Remove endpoint
- ~~All DMS-related acceptance criteria~~ (DMS Auto-Check, DMS Auto-Uncheck, DMS count>0 logic, N3.1 notification, metadata-locked upload)

#### What to Keep (Client Portal — Unchanged)

- **File: `client_portal.js`** — Role-filtered instance retrieval and review handshake (accept/reject)
- **API: `GET /lending/checklist-instances/entity/:entityId/client`** — Client-filtered instance
- **API: `POST /lending/checklist-instances/tasks/:taskId/review`** — Internal accept/reject of client-completed task
- All Client Portal acceptance criteria (role filtering, `REVIEW_PENDING` flow, gatekeeper blocking, N10.1 notification)
- All Role Visibility acceptance criteria (passive view, 403 on non-owner, stage-gate, last-in-wins, state persistence)

#### Updated Files to Create for Module 7

| File Path | Layer | Purpose |
| --- | --- | --- |
| ~~`dms_integration.js`~~ | ~~service~~ | **REMOVED — DMS not yet developed** |
| `client_portal.js` | service | Role-filtered retrieval, review handshake |

#### Updated API Endpoints for Module 7

| Method | Path | Description |
| --- | --- | --- |
| GET | `/lending/checklist-instances/entity/:entityId/client` | Client-filtered instance (owner=CLIENT) |
| POST | `/lending/checklist-instances/tasks/:taskId/review` | Internal accept/reject client task |
| ~~POST~~ | ~~`/lending/checklist-instances/tasks/:taskId/upload-context`~~ | **REMOVED — DMS not developed** |

#### Updated Acceptance Criteria for Module 7

All DMS-related acceptance criteria are removed. The following Client Portal and Role Visibility criteria remain unchanged:

- Client Portal: GET client endpoint returns ONLY tasks where `owner = CLIENT`
- Client Portal: Client task completion sets internal status to `REVIEW_PENDING`
- Client Portal: Internal Accept → COMPLETED; Reject → PENDING on client side
- Client Portal: Gatekeeper blocks while CLIENT-owned mandatory tasks are PENDING/REVIEW_PENDING/REJECTED
- Client Portal: Notification N10.1 fires for ad-hoc tasks assigned to CLIENT role
- Role Visibility: All internal users can view all tasks (passive view)
- Role Visibility: Non-owner tasks are read-only at API level (403 on status change)
- Role Visibility: Stage-gate enforces read-only for previous stage owners
- Role Visibility: Last-In-Wins for concurrent same-role edits
- Role Visibility: Workflow state persists across page refreshes/logouts

> *Note: DMS integration can be introduced as a separate module once the Document Management System is developed. The `checklist_instance_tasks` table already has the necessary columns (`completion_criteria_type`, `completion_criteria_value`) to support future DMS auto-verification without schema changes.*