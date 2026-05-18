Starting Checkpoint 3. Let me gather detailed reference patterns for migration files, existing table structures, and Joi schemas before designing the data model.Now I have sufficient context on all table structures, migration patterns, column types, and conventions. Let me produce the Data Model deliverable.

---

## Data Model Overview

### Database Changes Summary
- **New tables:** 5 (all under `tradefinance` schema)
- **Modified tables:** 1 (`lending.workflow` — new rows seeded)
- **New columns:** ~75 across all tables
- **New indexes:** 10
- **Migration files:** 6

---

### New Tables

---

#### 1. `tradefinance.checklist_templates`

**Module:** Module 1 (created), Module 2 (used)
**Purpose:** Stores the header/metadata for each checklist template created during the Seeding Phase. One row per template. Linked to a workflow type and parameterized for aggregation matching.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `increments` (serial integer) | NO | auto-increment | Primary key |
| `name` | `text` | NO | — | Template name (max 100 chars, enforced at Joi level) |
| `description` | `text` | NO | — | Template description (max 256 chars, enforced at Joi level) |
| `workflow_type` | `text` | NO | — | The `WORKFLOW_TYPE` constant this template targets (e.g., `CREDIT_ASSESSMENT`, `FINANCE_DISBURSAL`). References config, not FK. |
| `checklist_type` | `text` | NO | — | `CREDIT_FACILITY` or `APPLICATION` — derived from workflow_type prefix (`CREDIT*` vs `FINANCE*`) |
| `parameter_values` | `json` | YES | `'{}'::json` | JSON object of parameter type → value(s) mapping. E.g., `{"PRODUCT": ["INVOICE_DISCOUNTING"], "CLIENT_COUNTRY": ["IN", "KE"]}`. Empty `{}` = global fallback template. |
| `status` | `text` | NO | `'DRAFT'` | Current workflow status: `DRAFT`, `REVIEW_PENDING`, `APPROVED`, `REJECTED`, `RESUBMISSION_PENDING` |
| `active_workflow` | `text` | YES | — | Active checklist workflow type: `CHECKLIST_CF_ASSESSMENT` or `CHECKLIST_APP_ASSESSMENT` |
| `active_user` | `text` | YES | — | Current active role in the workflow (e.g., `CA`, `HOC`, `OM`, `CHECKER`) |
| `created_by` | `text` | NO | — | User ID of the template creator (the Maker) |
| `created_by_role` | `text` | NO | — | Role of the creator at time of creation (e.g., `CA`, `OM`) |
| `created_by_org_id` | `integer` | NO | — | Organisation ID of the creator |
| `approved_by` | `text` | YES | — | User ID of the approver (populated on APPROVE action) |
| `approved_at` | `timestamp with time zone` | YES | — | Timestamp of approval |
| `version` | `integer` | NO | `1` | Version counter — incremented on each approved revision |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` | Row creation timestamp |
| `updated_at` | `timestamp with time zone` | YES | — | Last update timestamp |
| `deleted_at` | `timestamp with time zone` | YES | — | Soft delete |

**Indexes:**
- `idx_checklist_templates_status`: `(status)` — for filtering approved templates during aggregation
- `idx_checklist_templates_workflow_type`: `(workflow_type)` — for workflow-type filtered lookups
- `idx_checklist_templates_checklist_type`: `(checklist_type)` — for list filtering by CF vs Application
- `idx_checklist_templates_created_by`: `(created_by)` — for "Created By" filter on listing

**Foreign Keys:** None (references user IDs and org IDs by value, following existing tradefinance pattern — no FK to `tradefinance.users`)

**Migration File:** `YYYYMMDD_01_create_checklist_templates_table.js`

---

#### 2. `tradefinance.checklist_template_tasks`

**Module:** Module 1 (created), Module 2 (used), Module 3 (read for deep-copy)
**Purpose:** Stores individual tasks belonging to a template. One-to-many relationship with `checklist_templates`. These are the "Class" — the definition. During instance creation (Module 3), these rows are deep-copied into `checklist_instance_tasks`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `increments` (serial integer) | NO | auto-increment | Primary key |
| `template_id` | `integer` | NO | — | FK → `tradefinance.checklist_templates.id` |
| `name` | `text` | NO | — | Task name (max 100 chars) |
| `description` | `text` | NO | — | Task description (max 256 chars) |
| `category` | `text` | NO | — | Task category enum: `DOCUMENTATION`, `LEGAL`, `COMPLIANCE`, `CREDIT`, `OPERATIONAL`, `FINANCE` |
| `stage` | `text` | NO | — | Workflow lifecycle stage where this task becomes active (e.g., `MAKER_DRAFT`, `CHECKER_APPROVAL`) |
| `owner_role` | `text` | YES | — | Role responsible for completing this task (e.g., `CA`, `OM`, `CHECKER`, `CLIENT`). NULL = any role can complete. |
| `is_mandatory` | `boolean` | NO | `false` | If true, task must be completed/deferred before workflow submission |
| `completion_criteria_type` | `text` | NO | — | How to complete: `DOCUMENT`, `INPUT_FIELD`, `UNDERTAKING`, `TEXT_RESPONSE` |
| `completion_criteria_value` | `text` | YES | — | Context for criteria — for `DOCUMENT`: document type name; for `INPUT_FIELD`: field identifier/label; for `UNDERTAKING`: declaration text; for `TEXT_RESPONSE`: null |
| `effective_from` | `timestamp with time zone` | YES | — | Task active only if workflow creation date ≥ this date. NULL = always active. |
| `effective_until` | `timestamp with time zone` | YES | — | Task active only if workflow creation date ≤ this date. NULL = always active. |
| `additional_info` | `text` | YES | — | Rich text SOP guidance (max 10000 chars). Rendered as HTML in execution phase. |
| `sample_document_id` | `text` | YES | — | Reference to the golden sample document upload ID (stored via existing document service/S3) |
| `sort_order` | `integer` | NO | `0` | Display ordering within the category |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamp with time zone` | YES | — | |
| `deleted_at` | `timestamp with time zone` | YES | — | Soft delete |

**Indexes:**
- `idx_checklist_template_tasks_template_id`: `(template_id)` — for fetching all tasks of a template
- `idx_checklist_template_tasks_composite_dedup`: `(template_id, stage, category, owner_role, completion_criteria_type)` — supports composite-key dedup lookups during aggregation

**Foreign Keys:**
- `template_id` → `tradefinance.checklist_templates(id)` ON DELETE CASCADE

**Migration File:** `YYYYMMDD_02_create_checklist_template_tasks_table.js`

---

#### 3. `tradefinance.checklist_instances`

**Module:** Module 1 (created), Module 3 (populated by instance engine), Module 4 (read by execution APIs)
**Purpose:** Stores the instantiated checklist bound to a specific workflow entity (Credit Facility ID or Finance Application ID). Created as a deep-copy snapshot when a workflow is initiated. One instance per workflow entity (may aggregate tasks from multiple templates).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `increments` (serial integer) | NO | auto-increment | Primary key |
| `entity_id` | `integer` | NO | — | The workflow entity ID — CF ID (from `lendingcreditfacility.credit_facility_details`) or Finance ID (from `lendingfinance.finance`) |
| `entity_type` | `text` | NO | — | `CREDIT_FACILITY` or `FINANCE_APPLICATION` |
| `workflow_type` | `text` | NO | — | The specific workflow type that triggered this instance (e.g., `CREDIT_ASSESSMENT`) |
| `source_template_ids` | `json` | YES | `'[]'::json` | JSON array of template IDs that were aggregated to create this instance. For audit trail / traceability. |
| `workflow_created_at` | `timestamp with time zone` | NO | — | The creation date of the parent workflow entity — used for effective_from/effective_until filtering at instance creation time |
| `total_mandatory_tasks` | `integer` | NO | `0` | Cached count of mandatory tasks (template + ad-hoc). Updated on ad-hoc task addition. |
| `completed_mandatory_tasks` | `integer` | NO | `0` | Cached count of mandatory tasks that are COMPLETED or DEFERRED. Updated on task status changes. |
| `status` | `text` | NO | `'ACTIVE'` | Instance status: `ACTIVE`, `SUBMITTED` (after gatekeeper passes and workflow is submitted) |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamp with time zone` | YES | — | |
| `deleted_at` | `timestamp with time zone` | YES | — | Soft delete |

**Indexes:**
- `idx_checklist_instances_entity`: `(entity_id, entity_type)` UNIQUE — one instance per workflow entity
- `idx_checklist_instances_entity_type`: `(entity_type)` — for type-filtered queries

**Foreign Keys:** None (entity_id references CF or Finance tables by value — polymorphic reference, following the same pattern as `lending.state_transactions.owner_id`)

**Migration File:** `YYYYMMDD_03_create_checklist_instances_table.js`

---

#### 4. `tradefinance.checklist_instance_tasks`

**Module:** Module 1 (created), Module 3 (populated from template deep-copy), Module 4 (status updates), Module 5 (undertaking/deferral/ad-hoc), Module 6 (client review)
**Purpose:** The runtime task rows bound to a checklist instance. Initially deep-copied from template tasks during aggregation. Ad-hoc tasks are also inserted here (with `is_adhoc = true`). This is the primary table for execution-phase reads and writes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `increments` (serial integer) | NO | auto-increment | Primary key |
| `instance_id` | `integer` | NO | — | FK → `tradefinance.checklist_instances.id` |
| `source_template_task_id` | `integer` | YES | — | FK → `tradefinance.checklist_template_tasks.id`. NULL for ad-hoc tasks. Preserved for traceability only — NOT used for runtime joins (instance isolation). |
| `name` | `text` | NO | — | Snapshotted task name |
| `description` | `text` | NO | — | Snapshotted task description |
| `category` | `text` | NO | — | Snapshotted category: `DOCUMENTATION`, `LEGAL`, `COMPLIANCE`, `CREDIT`, `OPERATIONAL`, `FINANCE` |
| `stage` | `text` | NO | — | Snapshotted workflow stage |
| `owner_role` | `text` | YES | — | Snapshotted owner role. NULL = any role. |
| `is_mandatory` | `boolean` | NO | `false` | Snapshotted (or elevated to true via strictest-mandatory-wins) |
| `completion_criteria_type` | `text` | NO | — | Snapshotted: `DOCUMENT`, `INPUT_FIELD`, `UNDERTAKING`, `TEXT_RESPONSE` |
| `completion_criteria_value` | `text` | YES | — | Snapshotted context value |
| `status` | `text` | NO | `'PENDING'` | Runtime task status: `PENDING`, `COMPLETED`, `DEFERRED`, `REVIEW_PENDING`, `REJECTED` |
| `completed_by` | `text` | YES | — | User ID who completed/signed this task |
| `completed_by_role` | `text` | YES | — | Role of the user at completion time |
| `completed_at` | `timestamp with time zone` | YES | — | When the task was completed |
| `is_adhoc` | `boolean` | NO | `false` | True for tasks created via Ask Management (Module 5). False for template-sourced tasks. |
| `adhoc_created_by` | `text` | YES | — | User ID who created the ad-hoc task (NULL for template tasks) |
| `deferral_reason` | `text` | YES | — | Reason for deferral (populated when status = DEFERRED) |
| `deferral_target_date` | `timestamp with time zone` | YES | — | Target resolution date for deferred task (must be future date) |
| `deferral_deferred_by` | `text` | YES | — | User ID who deferred the task |
| `deferral_deferred_at` | `timestamp with time zone` | YES | — | When the task was deferred |
| `undertaking_declaration_snapshot` | `text` | YES | — | Immutable snapshot of the declaration text at the moment of signing. Populated only for `UNDERTAKING` type tasks when signed. |
| `text_response` | `text` | YES | — | For `TEXT_RESPONSE` completion criteria — the actual response text entered by the task owner |
| `additional_info` | `text` | YES | — | Snapshotted rich text SOP guidance |
| `sample_document_id` | `text` | YES | — | Snapshotted golden sample reference |
| `sort_order` | `integer` | NO | `0` | Display ordering |
| `review_status` | `text` | YES | — | For client portal handshake: `REVIEW_PENDING`, `ACCEPTED`, `REJECTED`. NULL for non-client tasks. |
| `reviewed_by` | `text` | YES | — | User ID of internal reviewer who accepted/rejected |
| `reviewed_at` | `timestamp with time zone` | YES | — | When internal review happened |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamp with time zone` | YES | — | |
| `deleted_at` | `timestamp with time zone` | YES | — | Soft delete |

**Indexes:**
- `idx_checklist_instance_tasks_instance_id`: `(instance_id)` — primary lookup for all tasks of an instance
- `idx_checklist_instance_tasks_status`: `(instance_id, status)` — for counting completed/pending tasks (gatekeeper)
- `idx_checklist_instance_tasks_category`: `(instance_id, category)` — for category-tab grouping in FAB
- `idx_checklist_instance_tasks_owner`: `(instance_id, owner_role)` — for client portal role-filtering

**Foreign Keys:**
- `instance_id` → `tradefinance.checklist_instances(id)` ON DELETE CASCADE
- `source_template_task_id` → `tradefinance.checklist_template_tasks(id)` ON DELETE SET NULL (template may be deleted later; instance survives)

**Migration File:** `YYYYMMDD_04_create_checklist_instance_tasks_table.js`

---

#### 5. `tradefinance.checklist_task_audit_log`

**Module:** Module 1 (created), Modules 4–6 (written)
**Purpose:** Immutable audit trail for all significant checklist events. Each row captures who did what, when, and a snapshot of relevant data. This table is append-only — no UPDATE or DELETE operations at the application level.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigIncrements` (bigserial) | NO | auto-increment | Primary key (bigint for high-volume append-only table) |
| `instance_id` | `integer` | NO | — | FK → `tradefinance.checklist_instances.id` |
| `task_id` | `integer` | YES | — | FK → `tradefinance.checklist_instance_tasks.id`. NULL for instance-level events. |
| `event_type` | `text` | NO | — | Event type enum: `TASK_COMPLETED`, `TASK_UNCOMPLETED`, `TASK_DEFERRED`, `DEFERRAL_RESOLVED`, `UNDERTAKING_SIGNED`, `ADHOC_TASK_CREATED`, `CLIENT_REVIEW_SUBMITTED`, `CLIENT_REVIEW_ACCEPTED`, `CLIENT_REVIEW_REJECTED`, `BATCH_STATUS_UPDATE` |
| `performed_by` | `text` | NO | — | User ID who performed the action |
| `performed_by_role` | `text` | NO | — | Role of the user at time of action |
| `performed_by_org_id` | `integer` | NO | — | Organisation ID of the actor |
| `old_status` | `text` | YES | — | Previous task status (for status change events) |
| `new_status` | `text` | YES | — | New task status |
| `snapshot_data` | `json` | YES | — | JSON snapshot of relevant context at time of event. For `UNDERTAKING_SIGNED`: `{"declaration_text": "..."}`. For `TASK_DEFERRED`: `{"reason": "...", "target_date": "..."}`. For `ADHOC_TASK_CREATED`: `{"task_name": "...", "owner_role": "..."}`. For `CLIENT_REVIEW_REJECTED`: `{"reason": "..."}`. |
| `notes` | `text` | YES | — | Freeform notes (e.g., rejection reason) |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` | Immutable timestamp |

**Indexes:**
- `idx_audit_log_instance_id`: `(instance_id)` — for loading full audit trail of an instance
- `idx_audit_log_task_id`: `(task_id)` — for loading history of a specific task
- `idx_audit_log_event_type`: `(event_type)` — for filtering by event type

**Foreign Keys:**
- `instance_id` → `tradefinance.checklist_instances(id)` ON DELETE CASCADE
- `task_id` → `tradefinance.checklist_instance_tasks(id)` ON DELETE SET NULL

**Notes:**
- No `updated_at` or `deleted_at` — this is an append-only immutable log.
- Uses `bigIncrements` (bigserial) since this table will grow significantly faster than others.

**Migration File:** `YYYYMMDD_05_create_checklist_task_audit_log_table.js`

---

### Modified Tables

#### `lending.workflow` — New Rows Seeded

**Module:** Module 1
**Changes:** INSERT new rows for two new workflow types. No column changes.

**Workflow Type: `CHECKLIST_CF_ASSESSMENT`** (Credit Facility Checklist)

| user_role | workflow | priority | allowed_services | allowed_actions | configurable | final_authority |
|-----------|----------|----------|------------------|-----------------|--------------|-----------------|
| `CA` | `CHECKLIST_CF_ASSESSMENT` | 1 | `SUBMIT,EDIT` | `SUBMIT` | false | false |
| `HOC` | `CHECKLIST_CF_ASSESSMENT` | 2 | `APPROVE,REJECT,SEND_BACK` | `APPROVE,REJECT,SEND_BACK` | false | true |

**Workflow Type: `CHECKLIST_APP_ASSESSMENT`** (Application Checklist)

| user_role | workflow | priority | allowed_services | allowed_actions | configurable | final_authority |
|-----------|----------|----------|------------------|-----------------|--------------|-----------------|
| `OM` | `CHECKLIST_APP_ASSESSMENT` | 1 | `SUBMIT,EDIT` | `SUBMIT` | false | false |
| `CHECKER` | `CHECKLIST_APP_ASSESSMENT` | 2 | `APPROVE,REJECT,SEND_BACK` | `APPROVE,REJECT,SEND_BACK` | false | true |

**Migration File:** `YYYYMMDD_06_seed_checklist_workflow_types.js`

**Rollback:** `exports.down` deletes these rows by `workflow` type.

---

### Migration Order

Run in this exact order:

| # | Migration File | Action | Dependencies |
|---|---------------|--------|--------------|
| 1 | `YYYYMMDD_01_create_checklist_templates_table.js` | CREATE `tradefinance.checklist_templates` | None |
| 2 | `YYYYMMDD_02_create_checklist_template_tasks_table.js` | CREATE `tradefinance.checklist_template_tasks` | Migration 1 (FK to templates) |
| 3 | `YYYYMMDD_03_create_checklist_instances_table.js` | CREATE `tradefinance.checklist_instances` | None (no FK deps) |
| 4 | `YYYYMMDD_04_create_checklist_instance_tasks_table.js` | CREATE `tradefinance.checklist_instance_tasks` | Migrations 2 & 3 (FKs to both) |
| 5 | `YYYYMMDD_05_create_checklist_task_audit_log_table.js` | CREATE `tradefinance.checklist_task_audit_log` | Migrations 3 & 4 (FKs to instances and tasks) |
| 6 | `YYYYMMDD_06_seed_checklist_workflow_types.js` | INSERT into `lending.workflow` | None (table exists) |

### Rollback Safety

- **All migrations are rollback-safe: YES**
- Every `exports.up` has a corresponding `exports.down` that drops the created table or deletes the seeded rows
- Drop order in rollback: 6 (delete seed rows) → 5 → 4 → 3 → 2 → 1 (reverse of creation)
- No existing tables are altered (only new rows inserted into `lending.workflow`), so rollback of migration 6 is a safe DELETE by workflow type

---

### Joi Validation Schemas

#### POST `/lending/checklist-templates` — Create Template

```javascript
const Joi = require('@hapi/joi');
const config = require('@config/config');

const taskCategories = config.getConfig('CHECKLIST_TASK_CATEGORIES');
// ['DOCUMENTATION', 'LEGAL', 'COMPLIANCE', 'CREDIT', 'OPERATIONAL', 'FINANCE']

const completionCriteriaTypes = config.getConfig('CHECKLIST_COMPLETION_CRITERIA');
// ['DOCUMENT', 'INPUT_FIELD', 'UNDERTAKING', 'TEXT_RESPONSE']

const taskSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(256).required(),
  category: Joi.string().valid(...taskCategories).required(),
  stage: Joi.string().required(),
  owner_role: Joi.string().allow(null).optional(),
  is_mandatory: Joi.boolean().default(false),
  completion_criteria_type: Joi.string()
    .valid(...completionCriteriaTypes).required(),
  completion_criteria_value: Joi.string().allow(null).optional(),
  effective_from: Joi.date().iso().allow(null).optional(),
  effective_until: Joi.date().iso().allow(null).optional(),
  additional_info: Joi.string().max(10000).allow(null, '').optional(),
  sample_document_id: Joi.string().allow(null).optional(),
  sort_order: Joi.number().integer().min(0).default(0),
});

const schema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(256).required(),
  workflow_type: Joi.string().required(),
  parameter_values: Joi.object().default({}),
  tasks: Joi.array().items(taskSchema).min(1).required(),
  action: Joi.string().valid('SUBMIT').optional(),
  // If action = 'SUBMIT', create + submit in one step
});

module.exports = schema;
```

#### PATCH `/lending/checklist-templates/:templateId` — Unified Update

```javascript
const schema = Joi.object({
  // Data edit fields (all optional — only sent when editing)
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(256).optional(),
  workflow_type: Joi.string().optional(),
  parameter_values: Joi.object().optional(),
  tasks: Joi.array().items(taskSchema).optional(),

  // Workflow action (optional — when present, triggers state transition)
  action: Joi.string()
    .valid('SUBMIT', 'APPROVE', 'REJECT', 'SEND_BACK').optional(),
  notes: Joi.string().max(1000).when('action', {
    is: Joi.valid('REJECT', 'SEND_BACK'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
```

#### GET `/lending/checklist-templates` — List Filters

```javascript
const schema = Joi.object({
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  checklist_type: Joi.string()
    .valid('CREDIT_FACILITY', 'APPLICATION').optional(),
  status: Joi.string().optional(),
  created_by: Joi.string().optional(),
  workflow_type: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
```

#### PATCH `/lending/checklist-instances/:instanceId/tasks/status` — Batch Task Update

```javascript
const schema = Joi.object({
  tasks: Joi.array().items(
    Joi.object({
      taskId: Joi.number().integer().required(),
      status: Joi.string().valid('COMPLETED', 'PENDING').required(),
    })
  ).min(1).max(50).required(),
});
```

#### POST `/lending/checklist-instances/tasks/:taskId/defer` — Defer Task

```javascript
const schema = Joi.object({
  reason: Joi.string().max(2000).required(),
  target_date: Joi.date().iso().greater('now').required(),
});
```

#### POST `/lending/checklist-instances/:instanceId/adhoc-tasks` — Create Ad-Hoc Task

```javascript
const schema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(256).required(),
  category: Joi.string().valid(...taskCategories).required(),
  owner_role: Joi.string().required(), // Mandatory for ad-hoc (must assign)
  completion_criteria_type: Joi.string()
    .valid(...completionCriteriaTypes).required(),
  completion_criteria_value: Joi.string().allow(null).optional(),
});
```

#### POST `/lending/checklist-instances/tasks/:taskId/review` — Client Task Review

```javascript
const schema = Joi.object({
  action: Joi.string().valid('ACCEPT', 'REJECT').required(),
  notes: Joi.string().max(1000).when('action', {
    is: 'REJECT',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
```

---

### Workflow State Seeding

```javascript
// Migration: YYYYMMDD_06_seed_checklist_workflow_types.js

exports.up = async function(knex) {
  // CF Checklist workflow: CA → HOC
  await knex('lending.workflow').insert([
    {
      user_role: 'CA',
      workflow: 'CHECKLIST_CF_ASSESSMENT',
      priority: 1,
      allowed_services: 'SUBMIT,EDIT',
      allowed_actions: 'SUBMIT',
      configurable: false,
      final_authority: false,
    },
    {
      user_role: 'HOC',
      workflow: 'CHECKLIST_CF_ASSESSMENT',
      priority: 2,
      allowed_services: 'APPROVE,REJECT,SEND_BACK',
      allowed_actions: 'APPROVE,REJECT,SEND_BACK',
      configurable: false,
      final_authority: true,
    },
  ]);

  // Application Checklist workflow: OM → CHECKER
  await knex('lending.workflow').insert([
    {
      user_role: 'OM',
      workflow: 'CHECKLIST_APP_ASSESSMENT',
      priority: 1,
      allowed_services: 'SUBMIT,EDIT',
      allowed_actions: 'SUBMIT',
      configurable: false,
      final_authority: false,
    },
    {
      user_role: 'CHECKER',
      workflow: 'CHECKLIST_APP_ASSESSMENT',
      priority: 2,
      allowed_services: 'APPROVE,REJECT,SEND_BACK',
      allowed_actions: 'APPROVE,REJECT,SEND_BACK',
      configurable: false,
      final_authority: true,
    },
  ]);
};

exports.down = async function(knex) {
  await knex('lending.workflow')
    .whereIn('workflow', [
      'CHECKLIST_CF_ASSESSMENT',
      'CHECKLIST_APP_ASSESSMENT'
    ])
    .del();
};
```

---

### Config Constants (to be added to product_config)

```javascript
// CHECKLIST_TASK_CATEGORIES
['DOCUMENTATION', 'LEGAL', 'COMPLIANCE', 'CREDIT', 'OPERATIONAL', 'FINANCE']

// CHECKLIST_COMPLETION_CRITERIA
['DOCUMENT', 'INPUT_FIELD', 'UNDERTAKING', 'TEXT_RESPONSE']

// CHECKLIST_TASK_STATUS
['PENDING', 'COMPLETED', 'DEFERRED', 'REVIEW_PENDING', 'REJECTED']

// CHECKLIST_TEMPLATE_STATUS
['DRAFT', 'REVIEW_PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_PENDING']

// CHECKLIST_INSTANCE_STATUS
['ACTIVE', 'SUBMITTED']

// CHECKLIST_AUDIT_EVENT_TYPES
[
  'TASK_COMPLETED', 'TASK_UNCOMPLETED', 'TASK_DEFERRED',
  'DEFERRAL_RESOLVED', 'UNDERTAKING_SIGNED', 'ADHOC_TASK_CREATED',
  'CLIENT_REVIEW_SUBMITTED', 'CLIENT_REVIEW_ACCEPTED',
  'CLIENT_REVIEW_REJECTED', 'BATCH_STATUS_UPDATE'
]

// WORKFLOW_TYPE additions
{
  CHECKLIST_CF_ASSESSMENT: 'CHECKLIST_CF_ASSESSMENT',
  CHECKLIST_APP_ASSESSMENT: 'CHECKLIST_APP_ASSESSMENT',
}
```

---

### Entity Relationship Diagram (Text)

```
tradefinance.checklist_templates (1)
    │
    │ 1:N
    ▼
tradefinance.checklist_template_tasks (N)
    │
    │ snapshot (deep-copy at instance creation)
    ▼
tradefinance.checklist_instances (1) ──── entity_id ────▶ lendingcreditfacility.credit_facility_details
    │                                                    OR lendingfinance.finance
    │ 1:N
    ▼
tradefinance.checklist_instance_tasks (N)
    │
    │ N:1 (append-only)
    ▼
tradefinance.checklist_task_audit_log (N)

lending.workflow (seeded rows for CHECKLIST_CF_ASSESSMENT / CHECKLIST_APP_ASSESSMENT)
```

---

### Design Rationale — Key Decisions

1. **Deep-copy (Class vs Instance):** Template tasks are fully copied into instance tasks at creation time. Instance tasks never join back to template tasks at runtime. This ensures AC 5.5 (instance isolation) and AC 7.5 (declaration text persistence). The `source_template_task_id` column is preserved purely for traceability/debugging — ON DELETE SET NULL ensures template deletion doesn't cascade to live instances.

2. **Cached counters on `checklist_instances`:** `total_mandatory_tasks` and `completed_mandatory_tasks` are denormalized counters to avoid expensive `COUNT(*)` queries on every FAB render. They are updated atomically with task status changes in Module 4's batch update transaction.

3. **Polymorphic `entity_id`:** The instance table uses `(entity_id, entity_type)` rather than separate FK columns per entity type. This matches the existing pattern in `lending.state_transactions` where `owner_id` + `owner_type` reference multiple entity types.

4. **Flat deferral columns:** Deferral data (`deferral_reason`, `deferral_target_date`, etc.) is stored directly on the instance task rather than in a separate table. Since a task can only be deferred once at a time, a separate table would add unnecessary joins. The audit log captures the full history of deferral events including updates.

5. **Audit log bigint PK:** Uses `bigIncrements` instead of `increments` because this table is append-only and will grow proportionally to the product of (instances × tasks × status changes). bigint accommodates long-term growth.

6. **No `tenant_code`:** The existing `tradefinance` tables have `tenant_code` columns added via `20211208115747_tenant_code_all_table.js`. For new tables, I recommend confirming whether tenant_code is still required. The column can be added in a follow-up migration if needed. (Flagged as a question below.)

---

### Open Question

**Tenant Code:** Many existing `tradefinance` tables have a `tenant_code` column (e.g., `tradefinance.remarks`, `tradefinance.documents`). Should the new checklist tables include `tenant_code`? If yes, what default value should be used (the existing pattern uses `DEFAULT 'DTF'::tradefinance.tenant_code`)?

---

**⛔ CHECKPOINT 3 COMPLETE — AWAITING APPROVAL**

Please review and:
- Verify column types and constraints are correct
- Confirm the `(entity_id, entity_type)` polymorphic reference approach
- Confirm whether `tenant_code` is needed on new tables
- Validate the workflow seeding rows match the expected state machine
- Approve the Joi schema designs
- Confirm migration order is correct

I will not proceed to Phase 2 / Checkpoint 4 (Module Design) until I receive your explicit approval.