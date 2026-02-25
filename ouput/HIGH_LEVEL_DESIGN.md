# Checklist Service — High-Level Design (HLD)

**Feature:** Trade Finance Checklist Service Phase 1
**Platform:** CargoFin Backend (Node.js / Express / PostgreSQL / Knex)
**Version:** 1.0 Draft
**Date:** 2026-02-23

---

## 1. System Overview

The Checklist Service introduces a configurable, parameter-driven checklist engine into the CargoFin Lending Platform. It operates in two distinct phases:

1. **Seeding Phase** — Internal users define checklist templates with tasks, parameters, and completion criteria. Templates go through a maker-checker approval workflow before becoming "Active."
2. **Execution Phase** — When a workflow (Credit Facility or Application) is created, the system aggregates all matching active templates into a deep-copied "Instance" bound to that specific workflow. Users then execute tasks within the instance throughout the workflow lifecycle.

### 1.1 Key Design Principles

- **Class vs. Instance Architecture:** Templates are immutable "classes." Instances are mutable deep copies bound to a workflow ID. Changes to templates never propagate to existing instances.
- **Parameter-Based Aggregation (Union):** Multiple templates can match a single workflow. The engine performs a UNION of all matching templates, de-duplicates tasks, and applies the strictest mandatory rule.
- **Zero-Propagation for Ad-Hoc Tasks:** Ad-hoc tasks are added only to `checklist_instance_tasks`, never to `checklist_template_tasks`.
- **Reuse Existing Workflow Engine:** The maker-checker flow for template approval integrates into the existing `processWorkflow` engine as a new `CHECKLIST` work type.

---

## 2. Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        API Layer (Express)                         │
│  checklist.js routes → checklist controllers                       │
├─────────────────────────┬──────────────────────────────────────────┤
│    Template Controller  │     Execution Controller                 │
│  (CRUD, Workflow Actions│   (Instance, Tasks, Deferral,            │
│   List, Filter)         │    Ad-hoc, Gatekeeper, Portal)           │
├─────────────────────────┴──────────────────────────────────────────┤
│                       Service Layer                                │
│  ┌────────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ checklist/     │  │ checklist/      │  │ checklist/        │   │
│  │ index.js       │  │ execution.js    │  │ notification.js   │   │
│  │ (Template Biz  │  │ (Aggregation,   │  │ (Message builders │   │
│  │  Logic)        │  │  Completion,    │  │  & dispatch)      │   │
│  │                │  │  Deferral, etc) │  │                   │   │
│  └───────┬────────┘  └───────┬─────────┘  └───────┬───────────┘   │
│          │                   │                     │               │
├──────────┼───────────────────┼─────────────────────┼───────────────┤
│          ▼                   ▼                     ▼               │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │               db_service/checklist.js                     │     │
│  │  (All Knex queries: templates, tasks, params, instances,  │     │
│  │   instance_tasks, deferrals, audit_log)                   │     │
│  └──────────────────────┬───────────────────────────────────┘     │
├─────────────────────────┼──────────────────────────────────────────┤
│                         ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                  PostgreSQL (lending schema)              │      │
│  │  checklist_templates | checklist_template_tasks           │      │
│  │  checklist_template_parameters | checklist_instances      │      │
│  │  checklist_instance_tasks | checklist_task_deferrals      │      │
│  │  checklist_audit_log | document_type_master               │      │
│  └─────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────┘

External Integrations:
  ├── process_workflow engine (maker-checker for templates)
  ├── notification_service (bell + email)
  ├── document_service (DMS - file upload/download)
  └── file_storage_service (S3 - sample documents)
```

---

## 3. Module Decomposition

### 3.1 Module 1 — Template Management (Seeding Phase)

**Responsibility:** Full CRUD for checklist templates and their nested tasks. Role-based access controls determine which workflow types are visible. Maker-checker approval workflow transitions templates from Draft → Active.

**Key Flows:**
- Create Template → Save as Draft → Submit for Review → Approve/Reject/Send Back → Active
- Update Active Template → Creates a new draft version → Same approval flow
- List/filter templates by status, type, author, date range, workflow name

**Integration:** Hooks into the existing `processWorkflow` engine with `workType = 'CHECKLIST'`. The `_updateWorkItemDetails` and `_getWorkDetailsFromWorkIdAndType` functions in `process_workflow.js` get a new `CHECKLIST` case.

### 3.2 Module 5 — Aggregation Engine (Parameter Matching)

**Responsibility:** At workflow creation time, finds all active templates whose parameters match the workflow's metadata. Performs UNION, de-duplicates tasks by normalized name, and applies mandatory strictness override.

**Key Algorithm:**
1. Fetch workflow metadata (product type, country, counterparty, etc.)
2. Query all active templates for the matching workflow type
3. For each template, check if ANY parameter value matches the workflow metadata (OR within parameter group)
4. Include all "Global Templates" (templates with no parameters)
5. Merge tasks: if same task name appears in multiple templates, keep one copy with `is_mandatory = true` if ANY source says mandatory
6. Deep-copy merged tasks into `checklist_instance_tasks`

### 3.3 Module 2 — Execution Interface (Runtime)

**Responsibility:** Serves the instance data for the FAB UI. Provides task completion endpoints, counter logic (mandatory only), category-based grouping, and gatekeeper status.

**Key Data Served:**
- Instance with all tasks grouped by category
- Completion counter: `completed_or_deferred_mandatory / total_mandatory`
- Per-task status: PENDING, COMPLETED, DEFERRED, REVIEW_PENDING (for client tasks)
- Gatekeeper flag: `can_submit = (all mandatory tasks COMPLETED or DEFERRED)`

### 3.4 Module 3 — DMS Auto-Verification

**Responsibility:** Tracks document presence for "Document" completion criteria tasks. Automatically marks tasks complete when a matching document is uploaded and reverts when deleted.

**Strategy:** Check-on-load + event-driven (if DMS events available). When the FAB data is requested, the service queries the `lending.documents` table for the workflow ID and cross-references with document-type tasks.

### 3.5 Module 7 — Undertaking

**Responsibility:** Manual attestation tasks that are role-locked and stage-gated. The system logs the exact declaration text, user ID, role, and timestamp at the moment of attestation. Immutable once signed.

### 3.6 Module 8 — Deferral Management

**Responsibility:** Allows users to defer mandatory tasks with a reason and future target date. Deferred tasks satisfy the gatekeeper. Each deferral and update creates an audit log entry.

### 3.7 Module 9 — Ask Management (Ad-Hoc Tasks)

**Responsibility:** Inject new tasks into an instance. Uses the same task schema. Always mandatory. Saved to `checklist_instance_tasks` only (zero-propagation).

### 3.8 Module 10 — External Portal Integration

**Responsibility:** Exposes a filtered API for the client portal. Double-lock filter: `workflow_id + owner_role = 'Client'`. Client task completions enter a "Review Pending" state. Internal users accept or reject.

### 3.9 Module 11 — Role Visibility & Locking

**Responsibility:** Cross-cutting concern enforced at the service and DB level. Every task interaction checks: (a) user role matches task owner, (b) workflow stage matches task stage, (c) user is authorized via 403 enforcement.

---

## 4. Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| **Process Workflow Engine** | Code extension | Maker-checker for template approval. Add `CHECKLIST` workType to `process_workflow.js` |
| **Notification Service** | Function call | Bell + email notifications via `sendNotification()` from `notification_service/index.js` |
| **Document Service / DMS** | DB query / Event listener | Auto-verification of document tasks by checking `lending.documents` table |
| **File Storage Service** | Function call | S3 upload/download for sample documents attached to tasks |
| **Auth / User Context** | Middleware | `getUserID()`, `getOrgID()`, `getTenantCode()` for role checks |
| **Redis Cache** | Optional | Cache active template aggregation results per workflow type (invalidate on template approval) |
| **State Transactions** | DB insert | Audit trail for all workflow state changes via `lending.state_transactions` |

---

## 5. API Design Overview

### 5.1 Template Management APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/lending/checklist/template` | Create new checklist template (draft) |
| `GET` | `/lending/checklist/templates` | List templates with filters (status, type, author, date, workflow) |
| `GET` | `/lending/checklist/template/:templateId` | Get template detail with tasks & parameters |
| `PATCH` | `/lending/checklist/template/:templateId` | Update template (draft only) |
| `POST` | `/lending/checklist/template/:templateId/task` | Add task to template |
| `PATCH` | `/lending/checklist/template/:templateId/task/:taskId` | Update task |
| `DELETE` | `/lending/checklist/template/:templateId/task/:taskId` | Remove task (soft delete) |
| `POST` | `/lending/checklist/template/:templateId/submit` | Submit for review |
| `POST` | `/lending/checklist/template/:templateId/approve` | Checker approves |
| `POST` | `/lending/checklist/template/:templateId/reject` | Checker rejects |
| `POST` | `/lending/checklist/template/:templateId/send-back` | Checker sends back for rework |
| `GET` | `/lending/checklist/workflows` | Get available workflows for current user role |
| `GET` | `/lending/checklist/parameter-types` | Get parameter type dropdown values |
| `GET` | `/lending/checklist/parameter-values` | Search parameter values (3-char trigger) |
| `POST` | `/lending/checklist/document-type-master` | Add to global document type master |

### 5.2 Execution APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/lending/checklist/instance/create` | Create instance for a workflow (called at workflow creation) |
| `GET` | `/lending/checklist/instance/:workflowId` | Get instance with tasks, counters, gatekeeper status |
| `PATCH` | `/lending/checklist/instance/task/:instanceTaskId/complete` | Complete a task (text response, undertaking, manual) |
| `PATCH` | `/lending/checklist/instance/task/:instanceTaskId/defer` | Defer a task |
| `POST` | `/lending/checklist/instance/:instanceId/adhoc-task` | Add ad-hoc task |
| `GET` | `/lending/checklist/instance/:workflowId/gatekeeper` | Check if workflow can be submitted |
| `PATCH` | `/lending/checklist/instance/task/:instanceTaskId/accept` | Accept client-submitted task (internal) |
| `PATCH` | `/lending/checklist/instance/task/:instanceTaskId/reject` | Reject client-submitted task (internal) |

### 5.3 External Portal APIs

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/lending/checklist/external/instance/:workflowId` | Get client-visible tasks only (double-lock filter) |
| `PATCH` | `/lending/checklist/external/task/:instanceTaskId/complete` | Client completes their task (enters Review Pending) |

---

## 6. Non-Functional Considerations

### 6.1 Performance
- **Aggregation Query:** The parameter matching query at instance creation should be a single indexed query fetching all active templates for the workflow type. Parameter values must be indexed.
- **FAB Load:** The instance retrieval API should return all task data in a single query with joins, not N+1.
- **Caching:** Consider Redis cache for aggregated template sets per workflow type. Cache key: `checklist:aggregated:{workflowType}:{paramHash}`. Invalidate on template approval.

### 6.2 Data Integrity
- **Transactions:** All write operations (create instance, complete task, defer, approve template) must be wrapped in `db.transaction()`.
- **Immutability:** Instance tasks are snapshots. The `declaration_text` for undertakings is frozen at attestation time.
- **Audit:** Every state transition is logged to `checklist_audit_log` and `lending.state_transactions`.

### 6.3 Security
- **Role enforcement at API level:** Controllers check user role before calling service layer.
- **Role enforcement at DB level:** Service layer validates task ownership before any mutation.
- **403 on role mismatch:** If a Maker tries to complete a Checker task, return `ForbiddenError`.
- **External portal APIs:** Separate route group with strict `owner_role = 'Client'` filtering. No internal data leakage.

### 6.4 Scalability
- **Template count:** Expected low volume (tens to low hundreds of templates). No special indexing beyond standard B-tree.
- **Instance count:** One per workflow. Moderate volume. Composite index on `(workflow_id, workflow_type)`.
- **Task count per instance:** PRD implies tens of tasks per checklist. No pagination needed within a single instance.

---

## 7. Error Handling Strategy

| Scenario | Error Type | HTTP Code | Handling |
|----------|-----------|-----------|----------|
| Missing mandatory fields | `JoiSchemaError` | 400 | Joi validation at controller layer |
| Template not found | `NotFoundError` | 404 | DB query returns null |
| User not authorized for action | `ForbiddenError` | 403 | Role/stage mismatch check in service |
| Template not in correct status for action | `ArgumentError` | 400 | e.g., trying to approve a non-submitted template |
| Duplicate task name in same template | `ArgumentError` | 400 | Normalized-string uniqueness check |
| Document type already exists in master | `ArgumentError` | 400 | Normalized-string duplicate check |
| Deferral date in the past | `ArgumentError` | 400 | Joi + service validation |
| Instance already exists for workflow | `ArgumentError` | 400 | Upsert-or-skip logic |
| Concurrent modification | Last-write-wins | 200 | Per PRD, no optimistic locking in Phase 1 |

---

## 8. Deployment Considerations

1. **Database migrations must run first** before any code deployment referencing new tables.
2. **The `lending.workflow` table** needs seed data for `CHECKLIST_CREDIT` and `CHECKLIST_APPLICATION` workflow types (Credit Analyst → HOC, Ops Maker → Ops Checker).
3. **Feature flag** recommended: The instance creation hook into CF/Application workflows should be behind a config toggle (`CHECKLIST_ENABLED=true`) for gradual rollout.
4. **No new npm packages required** for Phase 1. Rich-text is stored as-is; sanitization uses existing string validation. If sanitization is needed, it must be flagged separately.

---

## 9. Out of Scope (Phase 1)

- Module 6: Data Deviation & Comparison (Phase 2)
- Variance Analysis / Arithmetic checks
- OCR or document content validation
- Scroll Spy frontend implementation (backend only stores field IDs)
- FAB UI implementation (frontend team)
- Real-time WebSocket updates for task status changes
