#### MODULE 4: Instance Engine & Parameter Aggregation

**Scope:** The "brain" of the checklist service. When a new CF or Finance Application workflow is initiated (via sync from arranging), this module: (1) finds all APPROVED templates whose parameters match the entity's metadata, (2) performs a UNION merge of all matched templates, (3) de-duplicates tasks (strictest-mandatory-wins), and (4) creates a deep-copy instance tied to the workflow entity ID. Also handles global fallback templates (no parameters = applies to all).
**PRD Requirements Covered:** REQ-3 (Module 5 — Rules Engine), AC 5.1 (Multi-Parameter Matching), AC 5.2 (De-duplication), AC 5.3 (Parameter Search), AC 5.4 (Global Fallback), AC 5.5 (Instance Isolation)
**Implementation Type:** Can be parallelized with Module 3
**Files to Create:**

| File Path | Layer | Purpose |
| --- | --- | --- |
| `backend/src/lending/services/checklist/instance_engine.js` | service | Aggregation logic: parameter matching, UNION, de-duplication, deep-copy |
| `backend/src/lending/services/db_service/checklist_instance.js` | db_service | Instance creation queries, parameter-based template fetching |

**Files to Modify:**

| File Path | What Changes |
| --- | --- |
| `backend/src/lending/services/boomi_integration/credit_facility.js` | Hook `createChecklistInstance()` call into `_processLMSCFDetailsForNewFacility()` within existing transaction |
| `backend/src/lending/services/boomi_integration/finance_application.js` | Hook `createChecklistInstance()` call into the new finance application processing flow |
| `backend/src/lending/services/db_service/checklist.js` | Add `getApprovedTemplatesByParameters()` query with indexed parameter matching |

**Database Tables:**
*   Reads: `tradefinance.checklist_templates`, `tradefinance.checklist_template_tasks` (source templates)
*   Writes: `tradefinance.checklist_instances`, `tradefinance.checklist_instance_tasks` (deep-copy instances)
*   Reads: Entity metadata from `lendingcreditfacility.credit_facility_details` or `lendingfinance.finance` for parameter extraction
**API Endpoints:** None (triggered internally, not via API)
**Dependencies on Other Modules:** Module 1 (tables), Module 2 (templates exist in DB for testing)
**Outputs for Other Modules:** Checklist instances exist and are bound to workflow entity IDs — Module 5 serves these via APIs
**Context Bootstrap:**
1.  `.agent-rules.json`
2.  Approved Module Decomposition + Data Model
3.  `prds/current.md` (Module 5 — Parameter Config & Aggregation, Acceptance Criteria AC 5.1–5.5)
4.  `backend/src/lending/services/boomi_integration/credit_facility.js` — `_processLMSCFDetailsForNewFacility()` hook point
5.  `backend/src/lending/services/boomi_integration/finance_application.js` — finance application hook point
6.  `backend/src/lending/services/exposure_control/index.js` — parameter matching pattern
7.  `backend/src/lending/services/db_service/exposure_control.js` — parameter query patterns
**Acceptance Criteria:**
*    On new CF workflow creation (`CREDIT_FACILITY_NEW` event), a checklist instance is auto-created within the same transaction
*    On new Finance Application workflow creation, a checklist instance is auto-created
*    UNION aggregation: if Template A (Product=Invoice Factoring) has 5 tasks and Template B (Country=UAE) has 3 unique tasks, instance has 8 tasks
*    De-duplication: same-name task appearing in multiple templates is rendered once, with Mandatory=true if ANY template marks it mandatory
*    Global fallback: template with no parameters matches ALL workflows of its workflow type
*    Instance isolation: modifying a template after instance creation does NOT change the instance
*    Validity date filtering: tasks with `effective_from` > workflow creation date are excluded; tasks with `effective_until` < workflow creation date are excluded
*    Instance creation failure (e.g., no matching templates) does NOT block the parent workflow — logged as warning, empty instance created

* * *

#### MODULE 5: Execution APIs & Gatekeeper

**Scope:** APIs for the frontend Execution Phase (FAB). Serves checklist instance data by workflow entity ID, handles task status updates, provides category-tab aggregation, exposes the FAB counter (mandatory completed/total), and implements the gatekeeper that blocks workflow submission when mandatory tasks are incomplete.
**PRD Requirements Covered:** REQ-4 (Module 2 — Execution Interface), AC 2.1 (FAB Counter), AC 2.2 (Category Tab Rendering), AC 2.5 (Gatekeeper Hard Block), AC 2.6 (Accordion behaviour — frontend concern, but API supports it)
**Implementation Type:** Sequential (depends on Module 4)
**Files to Create:**

| File Path | Layer | Purpose |
| --- | --- | --- |
| `backend/src/lending/routes/checklist_execution.js` | route | All execution-phase endpoints |
| `backend/src/lending/controllers/checklist_execution.js` | controller | Parse requests, validate, call service, format response |
| `backend/src/lending/services/checklist/execution.js` | service | Instance retrieval, task status updates, gatekeeper validation |
| `backend/src/lending/schemas/checklist/update_task_status.js` | schema | Joi validation for task completion/uncomplete |
| `backend/src/lending/schemas/checklist/get_checklist_instance.js` | schema | Joi validation for instance query params |

**Files to Modify:**

| File Path | What Changes |
| --- | --- |
| `backend/src/lending/services/db_service/checklist_instance.js` | Add execution queries: get instance by entity ID, update task status, count mandatory tasks |
| `backend/config/routes.js` | Register checklist_execution route file |
| `backend/src/lending/services/credit_facility/index.js` | Add gatekeeper check before CF submission (call `validateChecklistCompletion()`) |
| `backend/src/lending/services/finance_application/index.js` | Add gatekeeper check before FA submission |

**Database Tables:**
*   Reads/Writes: `tradefinance.checklist_instances`, `tradefinance.checklist_instance_tasks`
*   Writes: `tradefinance.checklist_task_audit_log` (on status changes)
**API Endpoints:**

| Method | Path | Description |
| --- | --- | --- |
| GET | `/lending/checklist-instances/entity/:entityId` | Get instance with all tasks, grouped by category, for a workflow entity |
| GET | `/lending/checklist-instances/:instanceId/summary` | Get FAB summary: mandatory completed/total per category |
| PATCH | `/lending/checklist-instances/tasks/:taskId/status` | Update task status (complete/uncomplete) with role validation |
| GET | `/lending/checklist-instances/:instanceId/gatekeeper` | Validate if all mandatory tasks are completed/deferred — returns can_submit boolean |

**Dependencies on Other Modules:** Module 1 (tables), Module 4 (instances must be creatable)
**Outputs for Other Modules:** Task status management APIs used by Module 6 (lifecycle) and Module 7 (DMS/client); gatekeeper used by Module 6 (deferral unblocking)
**Context Bootstrap:**
1.  `.agent-rules.json`
2.  Approved Module Decomposition + Data Model
3.  `prds/current.md` (Module 2 — Execution Interface, AC 2.1–2.6)
4.  `backend/src/lending/controllers/finance_application.js` — controller pattern for instance retrieval
5.  `backend/src/lending/services/finance_application/index.js` — submission flow (gatekeeper hook point)
6.  `backend/src/lending/services/credit_facility/index.js` — CF submission flow (gatekeeper hook point)
7.  Module 4 files: `instance_engine.js`, `checklist_instance.js` (db_service)
**Acceptance Criteria:**
*    GET by entity ID returns full instance with tasks grouped by category
*    FAB summary returns `{mandatory_completed: N, mandatory_total: M}` per category — "Good to Have" tasks excluded from counter
*    Task status update validates user role matches task owner (or task owner is null = any role)
*    Category tabs only returned if they have ≥1 task
*    Gatekeeper returns `can_submit: false` when any mandatory task is incomplete AND not deferred
*    Gatekeeper integrated into CF submission — blocks with 400 error and descriptive message
*    Gatekeeper integrated into FA submission — same block behavior
*    Feature-flagged: gatekeeper can be disabled via product config for rollback safety

* * *

#### MODULE 6: Task Lifecycle (Undertaking + Deferral + Ad-Hoc)

**Scope:** Implements three special task behaviors: (1) **Undertaking** — manual-only tasks with stage-gate enforcement and immutable audit trail, (2) **Deferral** — allows mandatory tasks to be deferred with reason + target date, treating DEFERRED as COMPLETED for gatekeeper, (3) **Ad-Hoc Task Injection** — runtime task creation on instances (never templates), always mandatory, role-targeted. Sends notifications N2.1, N2.2, N8.1, N9.1.
**PRD Requirements Covered:** REQ-7 (Module 7 — Undertaking), REQ-8 (Module 8 — Deferral), REQ-9 (Module 9 — Ask Management), AC 7.1–7.5, AC 8.1–8.5, AC 9.1–9.5
**Implementation Type:** Can be parallelized with Module 7
**Files to Create:**

| File Path | Layer | Purpose |
| --- | --- | --- |
| `backend/src/lending/services/checklist/task_lifecycle.js` | service | Undertaking sign-off, deferral CRUD, ad-hoc task creation |
| `backend/src/lending/schemas/checklist/defer_task.js` | schema | Joi validation for deferral (reason required, future date required) |
| `backend/src/lending/schemas/checklist/create_adhoc_task.js` | schema | Joi validation for ad-hoc task (name, category, description, owner, completion_criteria) |

**Files to Modify:**

| File Path | What Changes |
| --- | --- |
| `backend/src/lending/controllers/checklist_execution.js` | Add endpoints: deferTask, resolveDeferred, createAdhocTask, signUndertaking |
| `backend/src/lending/routes/checklist_execution.js` | Add routes for deferral, ad-hoc, undertaking |
| `backend/src/lending/services/db_service/checklist_instance.js` | Add queries: insert deferral, insert ad-hoc task, log undertaking attestation |
| `backend/src/lending/services/checklist/execution.js` | Add stage-gate validation logic for undertaking (is workflow at correct stage?), update gatekeeper to treat DEFERRED = COMPLETED |

**Database Tables:**
*   Reads/Writes: `tradefinance.checklist_instance_tasks` (deferral fields, ad-hoc inserts, undertaking status)
*   Writes: `tradefinance.checklist_task_audit_log` (immutable undertaking attestation with snapshotted declaration text, deferral events, ad-hoc events)
**API Endpoints:**

| Method | Path | Description |
| --- | --- | --- |
| POST | `/lending/checklist-instances/tasks/:taskId/defer` | Defer a mandatory task (reason + future date) |
| POST | `/lending/checklist-instances/tasks/:taskId/resolve-deferral` | Resolve a deferred task (manual or auto via DMS) |
| POST | `/lending/checklist-instances/:instanceId/adhoc-tasks` | Create ad-hoc task on instance (never template) |
| POST | `/lending/checklist-instances/tasks/:taskId/sign-undertaking` | Sign an undertaking (stage + role validated, declaration text snapshotted) |

**Dependencies on Other Modules:** Module 1 (tables), Module 5 (execution APIs, gatekeeper logic)
**Outputs for Other Modules:** Deferral status feeds into gatekeeper (Module 5); ad-hoc tasks visible in execution APIs (Module 5); DMS can resolve deferrals (Module 7)
**Context Bootstrap:**
1.  `.agent-rules.json`
2.  Approved Module Decomposition + Data Model
3.  `prds/current.md` (Module 7 — Undertaking, Module 8 — Deferral, Module 9 — Ask Management)
4.  Module 5 files: `execution.js`, `checklist_execution.js` (controller), `checklist_instance.js` (db_service)
5.  `backend/src/lending/services/notification_service/index.js` — notification patterns
6.  `backend/config/checklist_notifications.js` — notification templates
**Acceptance Criteria:**
*    **Undertaking:** Only the task owner at the correct workflow stage can sign; 403 otherwise
*    **Undertaking:** Declaration text is snapshotted at sign time — template text changes don't affect signed attestation
*    **Undertaking:** Audit log records user_id, role, timestamp, and exact declaration text
*    **Undertaking:** Tasks visible to all users but disabled (greyed) for wrong role/wrong stage
*    **Deferral:** Target date must be future — past/today dates rejected with validation error
*    **Deferral:** Reason is mandatory — blank reason rejected
*    **Deferral:** DEFERRED tasks count as COMPLETED for gatekeeper → Submit button unblocks
*    **Deferral:** Post-deferral resolution: if document uploaded, status transitions from DEFERRED → COMPLETED
*    **Deferral:** Notification N8.1 fires to CA group/Ops group on mandatory task deferral
*    **Ad-Hoc:** Task is always mandatory by default (cannot be optional)
*    **Ad-Hoc:** Task saved to `checklist_instance_tasks` only — NEVER to `checklist_template_tasks`
*    **Ad-Hoc:** Only the assigned owner can complete the task; the creator cannot
*    **Ad-Hoc:** Notification N9.1 fires to task owner on creation
*    **Ad-Hoc:** Gatekeeper counts ad-hoc mandatory tasks in its validation

* * *

#### MODULE 7: DMS Auto-Verification & Client Portal Integration

**Scope:** Two integration concerns: (1) **DMS Integration** — hook into document upload/delete events to auto-check/uncheck Document-type tasks based on document_type + workflow entity_id matching. Support metadata-locked uploads (auto-populate doc type). (2) **Client Portal** — expose role-filtered execution APIs where external Client users see only tasks with `owner = 'CLIENT'`; implement the review handshake (client completes → REVIEW_PENDING → internal Accept/Reject). Notification N10.1 for client-assigned ad-hoc tasks, N3.1 for document deletion.
**PRD Requirements Covered:** REQ-5 (Module 3 — DMS), REQ-10 (Module 10 — External Integration), REQ-11 (Module 11 — Role Visibility), AC 3.1–3.4, AC 10.1–10.5, AC 11.1–11.5
**Implementation Type:** Can be parallelized with Module 6
**Files to Create:**

| File Path | Layer | Purpose |
| --- | --- | --- |
| `backend/src/lending/services/checklist/dms_integration.js` | service | Document event handlers, auto-check/uncheck logic, metadata-locked upload prep |
| `backend/src/lending/services/checklist/client_portal.js` | service | Role-filtered instance retrieval, review handshake (accept/reject) |

**Files to Modify:**

| File Path | What Changes |
| --- | --- |
| `backend/src/lending/controllers/checklist_execution.js` | Add endpoints: getClientChecklist, acceptClientTask, rejectClientTask |
| `backend/src/lending/routes/checklist_execution.js` | Add client portal routes |
| `backend/src/lending/services/db_service/checklist_instance.js` | Add queries: get tasks by owner role, update task review status |
| `backend/src/lending/services/document_service/index.js` | Add hook after document upload to call `onDocumentUploaded()` and after delete to call `onDocumentDeleted()` |
| `backend/src/lending/schemas/checklist/review_client_task.js` _(new)_ | Joi validation for accept/reject action |

**Database Tables:**
*   Reads/Writes: `tradefinance.checklist_instance_tasks` (auto-check on upload, auto-uncheck on delete, review status)
*   Reads: `lending.documents` (check document existence by type + owner)
*   Writes: `tradefinance.checklist_task_audit_log` (document events, review events)
**API Endpoints:**

| Method | Path | Description |
| --- | --- | --- |
| GET | `/lending/checklist-instances/entity/:entityId/client` | Client-filtered instance (only tasks where owner=CLIENT) |
| POST | `/lending/checklist-instances/tasks/:taskId/review` | Internal user accepts or rejects client-completed task |
| POST | `/lending/checklist-instances/tasks/:taskId/upload-context` | Get metadata-locked upload context (pre-filled document type) |

**Dependencies on Other Modules:** Module 1 (tables), Module 5 (execution APIs)
**Outputs for Other Modules:** Completes the feature — all integration points connected
**Context Bootstrap:**
1.  `.agent-rules.json`
2.  Approved Module Decomposition + Data Model
3.  `prds/current.md` (Module 3 — DMS, Module 10 — External Integration, Module 11 — Role Visibility)
4.  `backend/src/lending/services/document_service/index.js` — document upload/delete hook points
5.  `backend/src/lending/services/db_service/document.js` — document queries
6.  Module 5 files: `execution.js`, `checklist_execution.js` (controller), `checklist_instance.js` (db_service)
7.  `backend/src/lending/services/arranging_platform_service/` — arranging/client-side API patterns
**Acceptance Criteria:**
*    **DMS Auto-Check:** Uploading a document with matching type + workflow entity_id auto-completes the corresponding checklist task
*    **DMS Auto-Uncheck:** Deleting that document reverts the task to INCOMPLETE; FAB counter decrements; gatekeeper re-evaluates
*    **DMS:** If multiple documents of same type exist, task stays COMPLETE as long as count > 0
*    **DMS:** Notification N3.1 fires when a mandatory document is deleted
*    **DMS:** Upload from checklist panel pre-fills document type (metadata-locked)
*    **Client Portal:** GET client endpoint returns ONLY tasks where owner = CLIENT; internal tasks are invisible (not even in response)
*    **Client Portal:** When client completes a task, internal status = `REVIEW_PENDING` (not auto-completed)
*    **Client Portal:** Internal Accept → task COMPLETED on both sides; internal Reject → task reverts to PENDING on client side
*    **Client Portal:** Gatekeeper blocks submission while CLIENT-owned mandatory tasks are PENDING/REVIEW_PENDING/REJECTED
*    **Client Portal:** Notification N10.1 fires ONLY when ad-hoc task assigned to CLIENT role
*    **Role Visibility:** All internal users can view all tasks (passive view)
*    **Role Visibility:** Non-owner tasks are read-only at API level (403 on status change attempt)
*    **Role Visibility:** Stage-gate: tasks become read-only for previous stage owners after workflow progresses
*    **Role Visibility:** Last-In-Wins for concurrent edits by same-role users
*    **Role Visibility:** Workflow state persists across page refreshes/logouts (stateful)