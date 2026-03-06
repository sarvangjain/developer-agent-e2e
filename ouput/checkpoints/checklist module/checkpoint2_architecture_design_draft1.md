# ✋ CHECKPOINT 2: Architecture & Design Document (Draft 1)

## Checklist Feature — Phase 1

**Status:** PENDING REVIEW  
**Date:** 2026-03-06  
**PRD:** `prds/current.md`  
**Approved Requirements:** `checkpoint1_requirements_analysis_draft2.md`

---

## Solution Overview

The Checklist Service is a new, self-contained domain within the existing lending module. It introduces six new database tables under the `tradefinance` schema, a full CRUD + maker-checker workflow for template management, a parameter-based aggregation engine for runtime instance creation, and gatekeeper hooks into existing CF and Finance Application submission flows.

The architecture follows the established CargoFin layered pattern: **Route → Controller → Service → DB Service**, with the existing `processWorkflow()` engine driving maker-checker state transitions. Two new workflow types (`CHECKLIST_CF_APPROVAL`, `CHECKLIST_APP_APPROVAL`) are added to the PostgreSQL `workflow_type` enum and seeded into `lending.workflow`.

The checklist module reuses all existing infrastructure: Knex for DB access, Joi for validation, the lending notification service for emails, the document service for sample/golden sample files, and the process workflow service for state transitions.

---

## Request Flow

### Template CRUD (Seeding Phase)

#### POST `/lending/checklist/template` — Create Template (Draft)
```
Route (checklist.js)
  → Controller (checklist.js#createTemplate)
    → Joi Validation (create_template_schema.js)
    → Service (checklist/index.js#createTemplate)
      → DB Service (checklist.js#insertTemplate)
      → DB Service (checklist.js#insertTemplateTasks)
      → DB Service (checklist.js#insertTemplateParameters)
      → processWorkflow() — sets initial state (Draft Pending for Submission)
      → Notification Service — N/A (draft state, no notification)
```

#### PATCH `/lending/checklist/template/:templateId` — Update Template
```
Route (checklist.js)
  → Controller (checklist.js#updateTemplate)
    → Joi Validation (update_template_schema.js)
    → Service (checklist/index.js#updateTemplate)
      → DB Service (checklist.js#getTemplateById) — verify ownership & status
      → DB Service (checklist.js#updateTemplate)
      → DB Service (checklist.js#upsertTemplateTasks) — delete removed, insert new, update existing
      → DB Service (checklist.js#upsertTemplateParameters)
```

#### POST `/lending/checklist/template/:templateId/submit` — Submit for Approval
```
Route (checklist.js)
  → Controller (checklist.js#submitTemplate)
    → Service (checklist/index.js#submitTemplate)
      → DB Service — verify template is in draft/resubmission state
      → processWorkflow(trx, templateId, workflowType, workType, 'APPROVED')
      → Notification Service — N1.1 (Review Pending to Checker)
```

#### POST `/lending/checklist/template/:templateId/approve` — Approve Template
```
Route (checklist.js)
  → Controller (checklist.js#approveTemplate)
    → Service (checklist/index.js#approveTemplate)
      → processWorkflow(trx, templateId, workflowType, workType, 'APPROVED')
      → Notification Service — N1.2 (Approved notification to Author)
```

#### POST `/lending/checklist/template/:templateId/reject` — Reject Template
```
Route (checklist.js)
  → Controller (checklist.js#rejectTemplate)
    → Joi Validation (workflow_action_schema.js) — requires rejection notes
    → Service (checklist/index.js#rejectTemplate)
      → processWorkflow(trx, templateId, workflowType, workType, 'REJECT', notes)
      → Notification Service — N1.3 (Rejected notification to Author)
```

#### POST `/lending/checklist/template/:templateId/send-rework` — Send Back for Rework
```
Route (checklist.js)
  → Controller (checklist.js#sendReworkTemplate)
    → Joi Validation (workflow_action_schema.js) — requires rework notes
    → Service (checklist/index.js#sendReworkTemplate)
      → processWorkflow(trx, templateId, workflowType, workType, 'SEND_REWORK', notes)
      → Notification Service — N1.4 (Resubmission notification to Author)
```

#### GET `/lending/checklist/template/:templateId` — Get Template by ID
```
Route (checklist.js)
  → Controller (checklist.js#getTemplateById)
    → Service (checklist/index.js#getTemplateById)
      → DB Service (checklist.js#getTemplateById)
      → DB Service (checklist.js#getTemplateTasks)
      → DB Service (checklist.js#getTemplateParameters)
```

#### GET `/lending/checklist/templates` — List Templates with Filters
```
Route (checklist.js)
  → Controller (checklist.js#getTemplates)
    → Joi Validation (list_templates_schema.js) — filter params
    → Service (checklist/index.js#getTemplates)
      → DB Service (checklist.js#getTemplatesList)
```

### Execution Phase (Instance Lifecycle)

#### POST `/lending/checklist/instance/create` — Create Instance at Workflow Creation
```
Route (checklist.js)
  → Controller (checklist.js#createInstance)
    → Joi Validation (create_instance_schema.js)
    → Service (checklist/index.js#createInstance)
      → Service (checklist/aggregation_engine.js#aggregateTemplates)
        → DB Service (checklist.js#getApprovedTemplatesByWorkflow)
        → DB Service (checklist.js#getTemplateParameters)
        → Aggregation logic: match parameters, UNION tasks, de-duplicate, mandatory override
        → Effective date filtering against workflow creation date
      → DB Service (checklist.js#insertInstance)
      → DB Service (checklist.js#batchInsertInstanceTasks) — deep-copy from aggregated tasks
```

**Note:** This endpoint is called internally by the CF/Application creation flows, not directly by the frontend.

#### GET `/lending/checklist/instance/:workflowId` — Get Instance by Workflow ID
```
Route (checklist.js)
  → Controller (checklist.js#getInstanceByWorkflowId)
    → Service (checklist/index.js#getInstanceByWorkflowId)
      → DB Service (checklist.js#getInstanceByWorkflowId)
      → DB Service (checklist.js#getInstanceTasks)
      → Enrich: add role/stage actionability flags, completion summary
```

#### PATCH `/lending/checklist/instance/task/:taskId` — Update Task Status
```
Route (checklist.js)
  → Controller (checklist.js#updateTaskStatus)
    → Joi Validation (update_task_status_schema.js)
    → Service (checklist/index.js#updateTaskStatus)
      → DB Service (checklist.js#getInstanceTaskById) — verify ownership
      → Role/stage validation (403 if mismatch)
      → DB Service (checklist.js#updateInstanceTask)
      → DB Service (checklist.js#insertTaskAudit) — immutable audit log
      → Notification Service — conditional (N3.1 if doc deleted, N8.1 if deferred)
```

#### POST `/lending/checklist/instance/:instanceId/task` — Add Ad-Hoc Task
```
Route (checklist.js)
  → Controller (checklist.js#addAdhocTask)
    → Joi Validation (adhoc_task_schema.js)
    → Service (checklist/index.js#addAdhocTask)
      → DB Service (checklist.js#insertInstanceTask) — with is_adhoc=true, is_mandatory=true
      → DB Service (checklist.js#insertTaskAudit)
      → Notification Service — N9.1 (if internal), N10.1 (if owner is Client)
```

#### POST `/lending/checklist/instance/task/:taskId/defer` — Defer Task
```
Route (checklist.js)
  → Controller (checklist.js#deferTask)
    → Joi Validation (defer_task_schema.js)
    → Service (checklist/index.js#deferTask)
      → DB Service (checklist.js#getInstanceTaskById) — verify is_mandatory
      → Role/stage validation
      → DB Service (checklist.js#updateInstanceTask) — set deferred fields
      → DB Service (checklist.js#insertTaskAudit) — immutable deferral log
      → Notification Service — N8.1
```

#### POST `/lending/checklist/instance/task/:taskId/review` — Accept/Reject Client Task
```
Route (checklist.js)
  → Controller (checklist.js#reviewClientTask)
    → Joi Validation (review_task_schema.js)
    → Service (checklist/index.js#reviewClientTask)
      → DB Service (checklist.js#getInstanceTaskById) — verify task.owner_role == 'CLIENT'
      → DB Service (checklist.js#updateInstanceTask) — ACCEPTED or REJECTED
      → DB Service (checklist.js#insertTaskAudit)
```

#### GET `/lending/checklist/instance/:workflowId/gatekeeper` — Validate Gatekeeper
```
Route (checklist.js)
  → Controller (checklist.js#validateGatekeeper)
    → Service (checklist/index.js#validateGatekeeper)
      → DB Service (checklist.js#getInstanceTasksByWorkflowId)
      → Logic: check all mandatory tasks are COMPLETED or DEFERRED
      → Return: { canSubmit: boolean, incompleteCategories: [], summary: {} }
```

### Client Portal Endpoints

#### GET `/lending/checklist/client/instance/:workflowId` — Client Get Tasks
```
Route (checklist.js)
  → Controller (checklist.js#getClientInstanceByWorkflowId)
    → Service (checklist/index.js#getClientInstanceByWorkflowId)
      → DB Service (checklist.js#getInstanceByWorkflowId)
      → DB Service (checklist.js#getInstanceTasks) — FILTERED: owner_role = 'CLIENT' only
```

#### PATCH `/lending/checklist/client/instance/task/:taskId` — Client Update Task
```
Route (checklist.js)
  → Controller (checklist.js#clientUpdateTaskStatus)
    → Joi Validation (update_task_status_schema.js)
    → Service (checklist/index.js#clientUpdateTaskStatus)
      → DB Service — verify task.owner_role == 'CLIENT'
      → DB Service (checklist.js#updateInstanceTask) — set status to REVIEW_PENDING
      → DB Service (checklist.js#insertTaskAudit)
```

### Utility Endpoints

#### GET `/lending/checklist/parameters` — Get Parameter Types
```
Route (checklist.js)
  → Controller (checklist.js#getParameterTypes)
    → Service (dynamic_field_model/index.js#getDynamicFieldsService(db, 'EXPOSURE'))
```

#### GET `/lending/checklist/workflows` — Get Workflow Names for Dropdown
```
Route (checklist.js)
  → Controller (checklist.js#getWorkflows)
    → Service (checklist/index.js#getWorkflowsByRole)
      → config.getConfig('WORKFLOW_TYPE') — filter by user role (CREDIT_* or FINANCE_*)
```

#### GET `/lending/checklist/stages/:workflowType` — Get Stages for a Workflow
```
Route (checklist.js)
  → Controller (checklist.js#getStages)
    → Service (checklist/index.js#getStagesByWorkflow)
      → DB Service (process_workflow.js#getWorkflowDetail) — returns rows with priority/user_role
```

---

## Files to Create

| File Path | Layer | Purpose | Pattern Source |
|-----------|-------|---------|----------------|
| `backend/src/lending/routes/checklist.js` | Route | All checklist route definitions | `backend/src/lending/routes/credit_note.js` |
| `backend/src/lending/controllers/checklist.js` | Controller | HTTP request handling, Joi validation, response formatting | `backend/src/lending/controllers/credit_note.js` |
| `backend/src/lending/services/checklist/index.js` | Service | Business logic for template CRUD, instance lifecycle, workflow actions | `backend/src/lending/services/credit_note/index.js` |
| `backend/src/lending/services/checklist/aggregation_engine.js` | Service | Parameter-based template matching, UNION, de-duplication, mandatory override | Net-new (no direct pattern; closest is exposure control matching) |
| `backend/src/lending/services/db_service/checklist.js` | DB Service | All database queries for checklist tables | `backend/src/lending/services/db_service/credit_facility.js` (query patterns) |
| `backend/src/lending/schemas/checklist/create_template_schema.js` | Schema | Joi validation for template creation | `backend/src/lending/schemas/credit_note/create_credit_note_schema.js` |
| `backend/src/lending/schemas/checklist/update_template_schema.js` | Schema | Joi validation for template update | `backend/src/lending/schemas/credit_note/update_credit_note_schema.js` |
| `backend/src/lending/schemas/checklist/list_templates_schema.js` | Schema | Joi validation for template list filters | Standard Joi filter patterns |
| `backend/src/lending/schemas/checklist/create_instance_schema.js` | Schema | Joi validation for instance creation | Standard Joi pattern |
| `backend/src/lending/schemas/checklist/update_task_status_schema.js` | Schema | Joi validation for task status update | Standard Joi pattern |
| `backend/src/lending/schemas/checklist/defer_task_schema.js` | Schema | Joi validation for task deferral | Standard Joi pattern |
| `backend/src/lending/schemas/checklist/adhoc_task_schema.js` | Schema | Joi validation for ad-hoc task creation | Standard Joi pattern |
| `backend/src/lending/schemas/checklist/review_task_schema.js` | Schema | Joi validation for client task review (accept/reject) | Standard Joi pattern |
| `backend/src/lending/schemas/checklist/workflow_action_schema.js` | Schema | Joi validation for reject/rework actions (requires notes) | Standard Joi pattern |
| Migration: `create_checklist_tables.js` | DB | Creates all 6 new tables in `tradefinance` schema | `20250422071507_add_new_workflow_for_facility_closure.js` |
| Migration: `add_checklist_workflow_types.js` | DB | Adds `CHECKLIST_CF_APPROVAL` and `CHECKLIST_APP_APPROVAL` to `workflow_type` enum | `20250422071507_add_new_workflow_for_facility_closure.js` |
| Migration: `seed_checklist_workflows.js` | DB | Seeds `lending.workflow` and `lending.skipflow` rows for checklist | `20250422071507_add_new_workflow_for_facility_closure.js` |

---

## Files to Modify

| File Path | Function(s) to Change | What Changes | Impact |
|-----------|----------------------|--------------|--------|
| `backend/config/routes.js` | Module-level imports & route array | Add `checklistRoutes` import from `@lending/routes/checklist` and include in the routes array | All routes — must ensure no duplicate route names |
| `backend/config/settings.js` | `WORKFLOW_TYPE` object | Add `CHECKLIST_CF_APPROVAL: 'CHECKLIST_CF_APPROVAL'` and `CHECKLIST_APP_APPROVAL: 'CHECKLIST_APP_APPROVAL'` | Config used by `processWorkflow()` and all workflow-dependent code |
| `backend/config/settings.js` | `LENDING_WORK_TYPE` object | Add `CHECKLIST: 'CHECKLIST'` work type constant | Used by `processWorkflow()` to route entity-specific logic |
| `backend/src/lending/services/db_service/process_workflow.js` | `_getWorkDetailsFromWorkIdAndType()` | Add `else if (workType === lendingWorkType.CHECKLIST)` branch to fetch checklist template details for notification context | Notification resolution during workflow processing |
| `backend/src/lending/services/db_service/process_workflow.js` | `_updateWorkItemDetails()` | Add `else if (workType === lendingWorkType.CHECKLIST)` branch to update `tradefinance.checklist_templates` active_user/active_workflow/status | Workflow state transitions for checklist templates |
| `backend/src/lending/services/credit_facility/index.js` | Submission/approval flow function(s) | Add gatekeeper hook: call `checklistService.validateGatekeeper()` before allowing submission. Behind feature flag. | CF submission flow — must not break existing functionality |
| `backend/src/lending/services/finance_application/index.js` | Submission/approval flow function(s) | Add gatekeeper hook: call `checklistService.validateGatekeeper()` before allowing submission. Behind feature flag. | Finance Application submission flow — must not break existing functionality |

---

## Workflow State Machine

### Checklist CF Approval (`CHECKLIST_CF_APPROVAL`)

```
[DRAFT] --submit--> [REVIEW_PENDING_HOC] --approve--> [APPROVED] (terminal)
                                         --reject-->  [REJECTED] (terminal)
                                         --rework-->  [RESUBMISSION_PENDING_CA] --submit--> [REVIEW_PENDING_HOC]
```

**Roles in workflow:**

| Priority | User Role | Allowed Actions |
|----------|-----------|-----------------|
| 1 | `CA` (Credit Analyst) | `APPROVED` (submit to HOC) |
| 2 | `HOC` (Head of Credit) | `APPROVED`, `REJECT`, `SEND_REWORK` |

### Checklist Application Approval (`CHECKLIST_APP_APPROVAL`)

```
[DRAFT] --submit--> [REVIEW_PENDING_CHECKER] --approve--> [APPROVED] (terminal)
                                              --reject-->  [REJECTED] (terminal)
                                              --rework-->  [RESUBMISSION_PENDING_MAKER] --submit--> [REVIEW_PENDING_CHECKER]
```

**Roles in workflow:**

| Priority | User Role | Allowed Actions |
|----------|-----------|-----------------|
| 1 | `MAKER` (Operations Maker) | `APPROVED` (submit to Checker) |
| 2 | `CHECKER` (Operations Checker) | `APPROVED`, `REJECT`, `SEND_REWORK` |

### Tables to Seed

#### `lending.workflow` rows:

```javascript
// CF Checklist Approval
[
  { user_role: 'CA',  workflow: 'CHECKLIST_CF_APPROVAL',  priority: 1, allowed_services: 'V_CHECKLIST', allowed_actions: 'APPROVED', configurable: false, final_authority: false },
  { user_role: 'HOC', workflow: 'CHECKLIST_CF_APPROVAL',  priority: 2, allowed_services: 'V_CHECKLIST', allowed_actions: 'APPROVED, REJECT, SEND_REWORK', configurable: false, final_authority: true },
]

// Application Checklist Approval
[
  { user_role: 'MAKER',   workflow: 'CHECKLIST_APP_APPROVAL', priority: 1, allowed_services: 'V_CHECKLIST', allowed_actions: 'APPROVED', configurable: false, final_authority: false },
  { user_role: 'CHECKER', workflow: 'CHECKLIST_APP_APPROVAL', priority: 2, allowed_services: 'V_CHECKLIST', allowed_actions: 'APPROVED, REJECT, SEND_REWORK', configurable: false, final_authority: true },
]
```

#### `lending.skipflow` rows:

No skip conditions needed for Phase 1 — both workflows are simple 2-step maker-checker with no auto-skip scenarios.

### Instance Task State Machine

```
                                      ┌──────────────┐
                                      │   PENDING    │ (default)
                                      └──────┬───────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
              │  COMPLETED   │     │   DEFERRED   │     │REVIEW_PENDING│ (client tasks)
              └──────────────┘     └──────┬───────┘     └──────┬───────┘
                                          │                     │
                                          ▼                ┌────┴────┐
                                   ┌──────────────┐        ▼         ▼
                                   │  COMPLETED   │  ┌──────────┐ ┌──────────┐
                                   └──────────────┘  │ ACCEPTED │ │ REJECTED │
                                                     └──────────┘ └────┬─────┘
                                                                       │
                                                                       ▼
                                                                ┌──────────────┐
                                                                │   PENDING    │
                                                                └──────────────┘
```

---

## Integration Points

### Process Workflow (`processWorkflow()`)
- **Purpose:** Drives maker-checker state transitions for template approval.
- **Integration:** Add new `CHECKLIST` work type to `_getWorkDetailsFromWorkIdAndType()` and `_updateWorkItemDetails()` in `backend/src/lending/services/db_service/process_workflow.js`.
- **Entity details returned:** Template name, workflow name, author user details, page link for notification context.
- **State update target:** `tradefinance.checklist_templates` table — updates `active_user`, `active_workflow`, `status` columns.

### Notification Service
- **Usage:** Email-only notifications (Phase 1).
- **Service:** `@lending/services/notification_service/index.js` — `sendEmailNotification()` and `sendNotification()`.
- **Recipient resolution:** Use `getUserDeptListForEmail()` from `process_workflow/helper.js` for role-based recipient resolution.
- **Templates:** Standard `simple_text_email_template_18apr23` template with dynamic message body.
- **Events:** N1.1–N1.4 (template workflow), N3.1 (doc deleted), N5.1 (template conflict), N8.1 (deferral), N9.1 (ad-hoc internal), N10.1 (ad-hoc client).

### Dynamic Field Model (Parameter Types)
- **Usage:** Fetching parameter types for the template parameter configuration dropdown.
- **Service:** `getDynamicFieldsService(db, 'EXPOSURE')` from `@lending/services/dynamic_field_model/index.js`.
- **Returns:** Component details including `COMP_PARAMETER` with `acceptedDropdownValues` that provide parameter type options.

### Document Service
- **Usage:** Sample document upload for template tasks, Golden Sample pre-signed URLs.
- **Service:** `@lending/services/document_service/index.js` — existing upload/download functions.
- **Storage:** S3 via existing document service; document_id reference stored on task record.

### Redis Cache
- **Usage:** Cache parameter type lookups and approved template sets per workflow type.
- **Service:** `@utils/cache/index.js` — `setObj()` / `getObj()` with configurable TTL.
- **Keys:** `checklist:params:{modelType}`, `checklist:templates:{workflowType}`.
- **Invalidation:** Clear on template approval/rejection.

### Gatekeeper Hook (CF & Finance Application)
- **Integration point:** Before CF/Application submission is processed.
- **Approach:** Feature-flagged call to `checklistService.validateGatekeeper(trx, workflowId)`.
- **Feature flag:** Product config key `CHECKLIST_GATEKEEPER_ENABLED` (default: `false`). When `false`, gatekeeper check is skipped entirely.
- **Return:** `{ canSubmit: boolean, incompleteCategories: string[] }`.
- **On failure:** Throw `ArgumentError('Mandatory checklist tasks incomplete')` to block submission.

---

## Configuration Changes

### `config/settings.js` Additions

```javascript
// In WORKFLOW_TYPE object:
CHECKLIST_CF_APPROVAL: 'CHECKLIST_CF_APPROVAL',
CHECKLIST_APP_APPROVAL: 'CHECKLIST_APP_APPROVAL',

// In LENDING_WORK_TYPE object:
CHECKLIST: 'CHECKLIST',

// New config block:
CHECKLIST_CONFIG: {
  TASK_CATEGORIES: ['DOCUMENTATION', 'LEGAL', 'COMPLIANCE', 'CREDIT', 'OPERATIONAL', 'FINANCE'],
  COMPLETION_CRITERIA_TYPES: ['DOCUMENT', 'INPUT_FIELD', 'UNDERTAKING'],
  TASK_STATUSES: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    DEFERRED: 'DEFERRED',
    REVIEW_PENDING: 'REVIEW_PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
  },
  TEMPLATE_STATUSES: {
    DRAFT: 'DRAFT',
    REVIEW_PENDING: 'REVIEW_PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    RESUBMISSION_PENDING: 'RESUBMISSION_PENDING'
  },
  CHECKLIST_TYPES: {
    CREDIT_FACILITY: 'CREDIT_FACILITY',
    APPLICATION: 'APPLICATION'
  }
},

// New permission codes (to be registered in auth service):
CHECKLIST_PERMISSIONS: {
  CREATE: 'CHECKLIST_CREATE',
  APPROVE: 'CHECKLIST_APPROVE',
  VIEW: 'CHECKLIST_VIEW',
  EXECUTE: 'CHECKLIST_EXECUTE',
  DEFER: 'CHECKLIST_DEFER'
}
```

### Product Config Key
- `CHECKLIST_GATEKEEPER_ENABLED`: boolean — controls whether the gatekeeper hook is active. Set to `false` in all environments initially; enabled per-environment as checklist data is seeded.

### Workflow Types
- `CHECKLIST_CF_APPROVAL` — new entry in PostgreSQL `workflow_type` enum.
- `CHECKLIST_APP_APPROVAL` — new entry in PostgreSQL `workflow_type` enum.

### Status Mappings (UI Display → Internal)

| UI Display Status | Internal Status | Active User |
|-------------------|----------------|-------------|
| Checklist Draft Pending for Submission | DRAFT | CA / MAKER |
| Checklist Review Pending with HOC | REVIEW_PENDING | HOC |
| Checklist Review Pending with Checker | REVIEW_PENDING | CHECKER |
| Checklist Rejected | REJECTED | N/A (terminal) |
| Checklist Resubmission Pending with CA | RESUBMISSION_PENDING | CA |
| Checklist Resubmission Pending with Maker | RESUBMISSION_PENDING | MAKER |
| Checklist Approved | APPROVED | N/A (terminal) |

---

## Backward Compatibility

### Existing Endpoints
- **No existing endpoints are modified.** All checklist functionality is exposed through new `/lending/checklist/*` routes.
- The only touch points with existing code are: (a) route registration in `config/routes.js`, (b) `processWorkflow` db_service extensions for the new work type, and (c) the gatekeeper hook in CF/Application submission flows.

### Gatekeeper Safety
- The gatekeeper hook is behind `CHECKLIST_GATEKEEPER_ENABLED` feature flag (default `false`).
- When the flag is `false`, the existing submission flow is completely unaffected.
- The flag is toggled to `true` only after checklist templates are seeded and instances are verified in each environment.

### Process Workflow Extensions
- The additions to `_getWorkDetailsFromWorkIdAndType()` and `_updateWorkItemDetails()` are additive `else if` branches that only activate when `workType === CHECKLIST`. No existing branches are modified.

### Data Preservation
- No existing tables are altered. All new tables are in `tradefinance` schema.
- New rows are inserted into `lending.workflow` for the new workflow types only — existing workflow rows are untouched.
- The `workflow_type` PostgreSQL enum is extended (not replaced) with the new types.

### Migration Rollback Strategy
- All migrations are designed with `exports.down` that reverses changes:
  - Table creation migrations: drop the tables.
  - Enum extension migrations: recreate the enum without the new types.
  - Workflow seeding migrations: delete the inserted rows.
- Rollback order: seed data → enum extension → table creation (reverse of creation order).

---

## Database Table Design (Summary)

> *Detailed column definitions, indexes, and foreign keys are deferred to Checkpoint 4 (Data Model & API Contracts).*

| Table | Purpose |
|-------|---------|
| `tradefinance.checklist_templates` | Template header: name, description, workflow type, checklist type (CF/APP), status, active_user, active_workflow, created_by, org_id |
| `tradefinance.checklist_template_tasks` | Task definitions within a template: category, name, description, owner_role, stage, is_mandatory, completion_criteria, effective_from/until, additional_info, sample_document_id, field_mapping |
| `tradefinance.checklist_template_parameters` | Parameter bindings per template: parameter_type, parameter_values (array) |
| `tradefinance.checklist_instances` | Runtime copies bound to workflow_id: snapshot of which templates were aggregated, workflow_id, workflow_type, created_at |
| `tradefinance.checklist_instance_tasks` | Runtime task copies: all template task fields + status, is_adhoc, deferred_until, deferral_reason, deferred_by, deferred_at, completed_by, completed_at, declaration_text_snapshot |
| `tradefinance.checklist_instance_task_audit` | Immutable audit trail: task_id, action (COMPLETED, DEFERRED, UNDONE, REVIEWED, etc.), user_id, user_role, timestamp, old_status, new_status, details (JSON — captures declaration text, deferral reason, etc.) |

### Key Indexes (Preliminary)
- `checklist_templates`: index on `(workflow_type, status)` for approved template lookup.
- `checklist_template_parameters`: index on `(template_id, parameter_type)` for aggregation queries.
- `checklist_instances`: unique index on `(workflow_id)` — one instance per workflow.
- `checklist_instance_tasks`: index on `(instance_id, category)` for category-based retrieval.
- `checklist_instance_task_audit`: index on `(task_id, created_at)` for audit trail queries.

---

## Aggregation Engine Design

### Algorithm: `aggregateTemplates(trx, workflowType, workflowCreationDate, parameterContext)`

```
1. Fetch all APPROVED templates where workflow_type matches
2. For each template, fetch its parameters from checklist_template_parameters
3. Match templates against parameterContext:
   - For each parameter_type in the template:
     - Check if parameterContext[parameter_type] has ANY overlap with template's parameter_values (OR logic)
   - Templates with NO parameters = Global Fallback → always included
   - A template is matched if ALL its parameter_type groups have at least one value match (AND across types, OR within values)
4. Collect all tasks from matched templates
5. Filter by effective dates: task.effective_from <= workflowCreationDate AND (task.effective_until IS NULL OR task.effective_until >= workflowCreationDate)
6. De-duplicate by task name (case-insensitive normalized):
   - If same task name appears in multiple templates:
     - Mandatory wins over Optional (strictest rule)
     - Keep the task from the template with higher specificity (more parameters) — if tie, keep both merged
7. Return aggregated task list ready for deep-copy
```

### Conflict Detection (N5.1)
- During template approval (not at runtime), check if the newly approved template's parameter set overlaps with existing approved templates.
- If overlap detected, send N5.1 notification to System Admin/Ops Lead.
- This is a **warning only** — does not block approval.

---

**⛔ STOP — Awaiting Human Review (Draft 1)**

Please:
- Verify the file plan covers all requirements from Checkpoint 1
- Confirm the request flows are correct
- Validate the workflow state machine design
- Verify the integration points are complete
- Confirm the pattern sources are appropriate
- Flag any missing endpoints or files
- Approve to proceed to Checkpoint 3 (Test Strategy)
