# ✋ CHECKPOINT 4: Data Model & API Contracts (Draft 1)

## Checklist Feature — Phase 1

**Status:** PENDING REVIEW  
**Date:** 2026-03-06  
**PRD:** `prds/current.md`  
**Approved Architecture:** `checkpoint2_architecture_design_draft4.md`

---

## Database Changes

### New Tables

#### 1. `tradefinance.checklist_templates`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `name` | `VARCHAR(100)` | NOT NULL | — | Template name (alphanumeric, no special chars) |
| `description` | `VARCHAR(256)` | NOT NULL | — | Template description |
| `workflow_type` | `TEXT` | NOT NULL | — | Target workflow (e.g., `CREDIT_ASSESSMENT`, `FINANCE_DISBURSEMENT`) |
| `checklist_type` | `TEXT` | NOT NULL | — | `CREDIT_FACILITY` or `APPLICATION` |
| `status` | `TEXT` | NOT NULL | `'DRAFT'` | Template lifecycle status |
| `active_user` | `TEXT` | NULL | — | Current active role in approval workflow |
| `active_workflow` | `TEXT` | NULL | — | Current approval workflow type |
| `author_user_id` | `TEXT` | NOT NULL | — | FK → `tradefinance.users.id` |
| `author_org_id` | `INTEGER` | NOT NULL | — | FK → `tradefinance.organisations.id` |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP WITH TZ` | NULL | — | Set by trigger |
| `deleted_at` | `TIMESTAMP WITH TZ` | NULL | — | Soft delete |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_templates_workflow_status` ON `(workflow_type, status)` — aggregation engine lookup
- `idx_checklist_templates_author` ON `(author_user_id)` — list by author filter

**Foreign Keys:**
- `author_user_id` → `tradefinance.users(id)` ON DELETE CASCADE
- `author_org_id` → `tradefinance.organisations(id)` ON DELETE CASCADE

**Trigger:** `set_checklist_templates_updated_at_timestamp` BEFORE UPDATE → `commons.trigger_set_timestamp()`

---

#### 2. `tradefinance.checklist_template_tasks`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `template_id` | `INTEGER` | NOT NULL | — | FK → `tradefinance.checklist_templates.id` |
| `category` | `TEXT` | NOT NULL | — | DOCUMENTATION, LEGAL, COMPLIANCE, CREDIT, OPERATIONAL, FINANCE |
| `name` | `VARCHAR(100)` | NOT NULL | — | Task name (alphanumeric, no special chars) |
| `description` | `VARCHAR(256)` | NOT NULL | — | Task description |
| `owner_role` | `TEXT` | NULL | — | Role assigned to complete the task (NULL = any role) |
| `stage` | `INTEGER` | NOT NULL | — | Workflow priority level (1, 2, 3...) |
| `is_mandatory` | `BOOLEAN` | NOT NULL | `false` | Whether task is mandatory for gatekeeper |
| `completion_criteria` | `TEXT` | NOT NULL | — | DOCUMENT, INPUT_FIELD, UNDERTAKING, TEXT_RESPONSE |
| `document_category` | `TEXT` | NULL | — | Required when completion_criteria = DOCUMENT |
| `document_type` | `TEXT` | NULL | — | Required when completion_criteria = DOCUMENT |
| `effective_from` | `DATE` | NULL | — | Task active from this date (checked against workflow creation date) |
| `effective_until` | `DATE` | NULL | — | Task active until this date |
| `additional_info` | `TEXT` | NULL | — | Rich text SOP guidance (max 10000 chars) |
| `sample_document_id` | `INTEGER` | NULL | — | Reference to uploaded sample document |
| `field_mapping` | `JSON` | NULL | — | Scroll Spy field-to-section mapping |
| `sort_order` | `INTEGER` | NOT NULL | `0` | Display order within template |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP WITH TZ` | NULL | — | Set by trigger |
| `deleted_at` | `TIMESTAMP WITH TZ` | NULL | — | Soft delete |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_template_tasks_template_id` ON `(template_id)` — fetch tasks by template

**Foreign Keys:**
- `template_id` → `tradefinance.checklist_templates(id)` ON DELETE CASCADE

**Trigger:** `set_checklist_template_tasks_updated_at_timestamp` BEFORE UPDATE → `commons.trigger_set_timestamp()`

---

#### 3. `tradefinance.checklist_template_parameters`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `template_id` | `INTEGER` | NOT NULL | — | FK → `tradefinance.checklist_templates.id` |
| `parameter_type` | `TEXT` | NOT NULL | — | Dynamic model field code (from EXPOSURE model) |
| `parameter_values` | `TEXT[]` | NOT NULL | — | Array of selected values (OR logic within group) |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP WITH TZ` | NULL | — | Set by trigger |
| `deleted_at` | `TIMESTAMP WITH TZ` | NULL | — | Soft delete |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_template_params_template_type` ON `(template_id, parameter_type)` — aggregation lookup

**Foreign Keys:**
- `template_id` → `tradefinance.checklist_templates(id)` ON DELETE CASCADE

**Trigger:** `set_checklist_template_parameters_updated_at_timestamp` BEFORE UPDATE → `commons.trigger_set_timestamp()`

---

#### 4. `tradefinance.checklist_instances`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `workflow_id` | `INTEGER` | NOT NULL | — | ID of the CF or Finance Application this instance is bound to |
| `workflow_type` | `TEXT` | NOT NULL | — | The workflow type this instance was created for |
| `checklist_type` | `TEXT` | NOT NULL | — | CREDIT_FACILITY or APPLICATION |
| `source_template_ids` | `INTEGER[]` | NULL | — | Array of template IDs that were aggregated |
| `workflow_creation_date` | `DATE` | NOT NULL | — | Workflow creation date (used for effective date checks) |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP WITH TZ` | NULL | — | Set by trigger |
| `deleted_at` | `TIMESTAMP WITH TZ` | NULL | — | Soft delete |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_instances_workflow_id` UNIQUE ON `(workflow_id)` — one instance per workflow

**Trigger:** `set_checklist_instances_updated_at_timestamp` BEFORE UPDATE → `commons.trigger_set_timestamp()`

---

#### 5. `tradefinance.checklist_instance_tasks`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `instance_id` | `INTEGER` | NOT NULL | — | FK → `tradefinance.checklist_instances.id` |
| `category` | `TEXT` | NOT NULL | — | Task category (deep-copied from template) |
| `name` | `VARCHAR(100)` | NOT NULL | — | Task name |
| `description` | `VARCHAR(256)` | NOT NULL | — | Task description |
| `owner_role` | `TEXT` | NULL | — | Role assigned to complete |
| `stage` | `INTEGER` | NOT NULL | — | Workflow priority level |
| `is_mandatory` | `BOOLEAN` | NOT NULL | `false` | — |
| `completion_criteria` | `TEXT` | NOT NULL | — | DOCUMENT, INPUT_FIELD, UNDERTAKING, TEXT_RESPONSE |
| `document_category` | `TEXT` | NULL | — | — |
| `document_type` | `TEXT` | NULL | — | — |
| `additional_info` | `TEXT` | NULL | — | — |
| `sample_document_id` | `INTEGER` | NULL | — | — |
| `field_mapping` | `JSON` | NULL | — | — |
| `status` | `TEXT` | NOT NULL | `'PENDING'` | PENDING, COMPLETED, DEFERRED, REVIEW_PENDING, ACCEPTED, REJECTED |
| `is_adhoc` | `BOOLEAN` | NOT NULL | `false` | True if injected via Ask Management |
| `source_template_ids` | `INTEGER[]` | NULL | — | Template(s) this task originated from (NULL for ad-hoc) |
| `completed_by` | `TEXT` | NULL | — | User ID who completed |
| `completed_at` | `TIMESTAMP WITH TZ` | NULL | — | — |
| `deferred_until` | `DATE` | NULL | — | Target resolution date for deferral |
| `deferral_reason` | `TEXT` | NULL | — | — |
| `deferred_by` | `TEXT` | NULL | — | User ID who deferred |
| `deferred_at` | `TIMESTAMP WITH TZ` | NULL | — | — |
| `declaration_text_snapshot` | `TEXT` | NULL | — | Immutable copy of undertaking text at sign time |
| `text_response` | `TEXT` | NULL | — | Text response for TEXT_RESPONSE criteria |
| `sort_order` | `INTEGER` | NOT NULL | `0` | — |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP WITH TZ` | NULL | — | Set by trigger |
| `deleted_at` | `TIMESTAMP WITH TZ` | NULL | — | Soft delete |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_instance_tasks_instance_category` ON `(instance_id, category)` — category-based retrieval
- `idx_checklist_instance_tasks_instance_status` ON `(instance_id, status)` — gatekeeper queries

**Foreign Keys:**
- `instance_id` → `tradefinance.checklist_instances(id)` ON DELETE CASCADE

**Trigger:** `set_checklist_instance_tasks_updated_at_timestamp` BEFORE UPDATE → `commons.trigger_set_timestamp()`

---

#### 6. `tradefinance.checklist_instance_task_audit`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `SERIAL (increments)` | NOT NULL | Auto-increment | Primary key |
| `task_id` | `INTEGER` | NOT NULL | — | FK → `tradefinance.checklist_instance_tasks.id` |
| `action` | `TEXT` | NOT NULL | — | COMPLETED, DEFERRED, UNDONE, REVIEWED, ACCEPTED, REJECTED, REVERTED_DOC_DELETED, CREATED |
| `user_id` | `TEXT` | NOT NULL | — | Who performed the action |
| `user_role` | `TEXT` | NULL | — | Role at time of action |
| `old_status` | `TEXT` | NULL | — | Status before action |
| `new_status` | `TEXT` | NOT NULL | — | Status after action |
| `details` | `JSON` | NULL | — | Action-specific data (declaration text, deferral reason, document info) |
| `created_at` | `TIMESTAMP WITH TZ` | NOT NULL | `CURRENT_TIMESTAMP` | Immutable — no updated_at |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_checklist_audit_task_id_created` ON `(task_id, created_at)` — audit trail queries

**Foreign Keys:**
- `task_id` → `tradefinance.checklist_instance_tasks(id)` ON DELETE CASCADE

**No update trigger** — this table is append-only (immutable audit trail).

---

### Modified Tables

No existing tables are altered. All changes are additive: new tables, new enum values, new workflow seed rows.

---

### Migration Files

| Migration File | Purpose | Rollback Safe? |
|----------------|---------|----------------|
| `YYYYMMDDHHMMSS_add_checklist_workflow_types.js` | Add `CHECKLIST_CF_APPROVAL` and `CHECKLIST_APP_APPROVAL` to `workflow_type` PostgreSQL enum | Yes — recreates enum without the new types |
| `YYYYMMDDHHMMSS_create_checklist_tables.js` | Creates all 6 new tables in `tradefinance` schema with indexes, foreign keys, and triggers | Yes — drops all 6 tables |
| `YYYYMMDDHHMMSS_seed_checklist_workflows.js` | Seeds `lending.workflow` rows for both checklist approval workflows | Yes — deletes the inserted rows |

**Migration order:** enum first → tables second → seed data third.

#### Migration 1: `add_checklist_workflow_types.js`

```javascript
'use strict';
require('module-alias/register');

exports.up = async function (knex) {
  console.log('Adding CHECKLIST_CF_APPROVAL and CHECKLIST_APP_APPROVAL to workflow_type enum');
  await knex.raw(`CREATE TYPE workflow_type_temp AS ENUM (
    'CREDIT_ASSESSMENT',
    'FINANCE_ASSESSMENT',
    'CREDIT_TERMS_ASSESSMENT',
    'CREDIT_TERM_SHEET',
    'CREDIT_UPDATE',
    'CREDIT_UPDATE_BUYER',
    'CREDIT_TERMS',
    'CREDIT_UPDATE_TERMS',
    'CREDIT_UPDATE_TERMS_ASSESSMENT',
    'FINANCE_OVERDUE_WAIVEOFF',
    'FINANCE_SETTLEMENT_ADJUSTMENT_WAIVER',
    'FINANCE_UPDATE_DUE_DATE',
    'FINANCE_DISBURSAL_TO_DEFAULTOR',
    'FINANCE_DISBURSEMENT',
    'FINANCE_SETTLEMENT',
    'FINANCE_SETTLEMENT_BY_FI',
    'EXPOSURE_ASSESSMENT',
    'EXPOSURE_UPDATE',
    'EXPOSURE_DELETE',
    'CREDIT_RENEW',
    'CREDIT_RENEW_TERMS',
    'CREDIT_RENEW_TERMS_ASSESSMENT',
    'FACILITY_FEE_PAYMENT',
    'CREDIT_EXTEND_BCC_REVIEW_DATE',
    'ACCOUNT_CATEGORY_UPDATE',
    'FINANCE_ASSESSMENT_FOR_DEFAULTER',
    'FINANCE_REJECT',
    'FINANCE_FUNDS_RETURNED',
    'FINANCIAL_ASSESSMENT',
    'PORTFOLIO_REVIEW',
    'FACILITY_CLOSURE',
    'AFF_INVOICE_CREATION',
    'AFF_INVOICE_SETTLEMENT',
    'CREDIT_NOTE_CREATION',
    'FINANCE_CUSTOM_INTEREST_UPDATE',
    'CREDIT_NOTE_APPLICATION',
    'CHECKLIST_CF_APPROVAL',
    'CHECKLIST_APP_APPROVAL'
  );

  ALTER TABLE lending.workflow
  ALTER COLUMN workflow DROP DEFAULT,
  ALTER COLUMN workflow TYPE workflow_type_temp USING workflow::text::workflow_type_temp;
  ALTER TABLE lending.skipflow
  ALTER COLUMN workflow DROP DEFAULT,
  ALTER COLUMN workflow TYPE workflow_type_temp USING workflow::text::workflow_type_temp;
  DROP TYPE IF EXISTS workflow_type;
  ALTER TYPE workflow_type_temp RENAME TO workflow_type;`);
};

exports.down = async function (knex) {
  console.log('Removing CHECKLIST_CF_APPROVAL and CHECKLIST_APP_APPROVAL from workflow_type enum');
  // Delete seeded rows first (in case seed migration hasn't been rolled back)
  await knex('lending.workflow').whereIn('workflow', ['CHECKLIST_CF_APPROVAL', 'CHECKLIST_APP_APPROVAL']).del();

  await knex.raw(`CREATE TYPE workflow_type_temp AS ENUM (
    'CREDIT_ASSESSMENT', 'FINANCE_ASSESSMENT', 'CREDIT_TERMS_ASSESSMENT',
    'CREDIT_TERM_SHEET', 'CREDIT_UPDATE', 'CREDIT_UPDATE_BUYER',
    'CREDIT_TERMS', 'CREDIT_UPDATE_TERMS', 'CREDIT_UPDATE_TERMS_ASSESSMENT',
    'FINANCE_OVERDUE_WAIVEOFF', 'FINANCE_SETTLEMENT_ADJUSTMENT_WAIVER',
    'FINANCE_UPDATE_DUE_DATE', 'FINANCE_DISBURSAL_TO_DEFAULTOR',
    'FINANCE_DISBURSEMENT', 'FINANCE_SETTLEMENT', 'FINANCE_SETTLEMENT_BY_FI',
    'EXPOSURE_ASSESSMENT', 'EXPOSURE_UPDATE', 'EXPOSURE_DELETE',
    'CREDIT_RENEW', 'CREDIT_RENEW_TERMS', 'CREDIT_RENEW_TERMS_ASSESSMENT',
    'FACILITY_FEE_PAYMENT', 'CREDIT_EXTEND_BCC_REVIEW_DATE',
    'ACCOUNT_CATEGORY_UPDATE', 'FINANCE_ASSESSMENT_FOR_DEFAULTER',
    'FINANCE_REJECT', 'FINANCE_FUNDS_RETURNED', 'FINANCIAL_ASSESSMENT',
    'PORTFOLIO_REVIEW', 'FACILITY_CLOSURE', 'AFF_INVOICE_CREATION',
    'AFF_INVOICE_SETTLEMENT', 'CREDIT_NOTE_CREATION',
    'FINANCE_CUSTOM_INTEREST_UPDATE', 'CREDIT_NOTE_APPLICATION'
  );
  ALTER TABLE lending.workflow
  ALTER COLUMN workflow DROP DEFAULT,
  ALTER COLUMN workflow TYPE workflow_type_temp USING workflow::text::workflow_type_temp;
  ALTER TABLE lending.skipflow
  ALTER COLUMN workflow DROP DEFAULT,
  ALTER COLUMN workflow TYPE workflow_type_temp USING workflow::text::workflow_type_temp;
  DROP TYPE IF EXISTS workflow_type;
  ALTER TYPE workflow_type_temp RENAME TO workflow_type;`);
};
```

#### Migration 2: `create_checklist_tables.js`

```javascript
'use strict';
require('module-alias/register');

exports.up = async function (knex) {
  // 1. checklist_templates
  console.log('Creating tradefinance.checklist_templates');
  await knex.schema.withSchema('tradefinance').createTable('checklist_templates', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('description', 256).notNullable();
    table.text('workflow_type').notNullable();
    table.text('checklist_type').notNullable();
    table.text('status').notNullable().defaultTo('DRAFT');
    table.text('active_user');
    table.text('active_workflow');
    table.text('author_user_id').notNullable();
    table.integer('author_org_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.timestamp('deleted_at');
    table.foreign('author_user_id').references('id').inTable('tradefinance.users')
      .withKeyName('checklist_templates_author_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.foreign('author_org_id').references('id').inTable('tradefinance.organisations')
      .withKeyName('checklist_templates_org_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.index(['workflow_type', 'status'], 'idx_checklist_templates_workflow_status');
    table.index(['author_user_id'], 'idx_checklist_templates_author');
  });
  await knex.raw(`CREATE TRIGGER set_checklist_templates_updated_at_timestamp
    BEFORE UPDATE ON tradefinance.checklist_templates
    FOR EACH ROW EXECUTE PROCEDURE commons.trigger_set_timestamp();`);

  // 2. checklist_template_tasks
  console.log('Creating tradefinance.checklist_template_tasks');
  await knex.schema.withSchema('tradefinance').createTable('checklist_template_tasks', table => {
    table.increments('id').primary();
    table.integer('template_id').notNullable();
    table.text('category').notNullable();
    table.string('name', 100).notNullable();
    table.string('description', 256).notNullable();
    table.text('owner_role');
    table.integer('stage').notNullable();
    table.boolean('is_mandatory').notNullable().defaultTo(false);
    table.text('completion_criteria').notNullable();
    table.text('document_category');
    table.text('document_type');
    table.date('effective_from');
    table.date('effective_until');
    table.text('additional_info');
    table.integer('sample_document_id');
    table.json('field_mapping');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.timestamp('deleted_at');
    table.foreign('template_id').references('id').inTable('tradefinance.checklist_templates')
      .withKeyName('checklist_template_tasks_template_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.index(['template_id'], 'idx_checklist_template_tasks_template_id');
  });
  await knex.raw(`CREATE TRIGGER set_checklist_template_tasks_updated_at_timestamp
    BEFORE UPDATE ON tradefinance.checklist_template_tasks
    FOR EACH ROW EXECUTE PROCEDURE commons.trigger_set_timestamp();`);

  // 3. checklist_template_parameters
  console.log('Creating tradefinance.checklist_template_parameters');
  await knex.schema.withSchema('tradefinance').createTable('checklist_template_parameters', table => {
    table.increments('id').primary();
    table.integer('template_id').notNullable();
    table.text('parameter_type').notNullable();
    table.specificType('parameter_values', 'TEXT[]').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.timestamp('deleted_at');
    table.foreign('template_id').references('id').inTable('tradefinance.checklist_templates')
      .withKeyName('checklist_template_params_template_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.index(['template_id', 'parameter_type'], 'idx_checklist_template_params_template_type');
  });
  await knex.raw(`CREATE TRIGGER set_checklist_template_parameters_updated_at_timestamp
    BEFORE UPDATE ON tradefinance.checklist_template_parameters
    FOR EACH ROW EXECUTE PROCEDURE commons.trigger_set_timestamp();`);

  // 4. checklist_instances
  console.log('Creating tradefinance.checklist_instances');
  await knex.schema.withSchema('tradefinance').createTable('checklist_instances', table => {
    table.increments('id').primary();
    table.integer('workflow_id').notNullable();
    table.text('workflow_type').notNullable();
    table.text('checklist_type').notNullable();
    table.specificType('source_template_ids', 'INTEGER[]');
    table.date('workflow_creation_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.timestamp('deleted_at');
    table.unique(['workflow_id'], 'idx_checklist_instances_workflow_id');
  });
  await knex.raw(`CREATE TRIGGER set_checklist_instances_updated_at_timestamp
    BEFORE UPDATE ON tradefinance.checklist_instances
    FOR EACH ROW EXECUTE PROCEDURE commons.trigger_set_timestamp();`);

  // 5. checklist_instance_tasks
  console.log('Creating tradefinance.checklist_instance_tasks');
  await knex.schema.withSchema('tradefinance').createTable('checklist_instance_tasks', table => {
    table.increments('id').primary();
    table.integer('instance_id').notNullable();
    table.text('category').notNullable();
    table.string('name', 100).notNullable();
    table.string('description', 256).notNullable();
    table.text('owner_role');
    table.integer('stage').notNullable();
    table.boolean('is_mandatory').notNullable().defaultTo(false);
    table.text('completion_criteria').notNullable();
    table.text('document_category');
    table.text('document_type');
    table.text('additional_info');
    table.integer('sample_document_id');
    table.json('field_mapping');
    table.text('status').notNullable().defaultTo('PENDING');
    table.boolean('is_adhoc').notNullable().defaultTo(false);
    table.specificType('source_template_ids', 'INTEGER[]');
    table.text('completed_by');
    table.timestamp('completed_at');
    table.date('deferred_until');
    table.text('deferral_reason');
    table.text('deferred_by');
    table.timestamp('deferred_at');
    table.text('declaration_text_snapshot');
    table.text('text_response');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.timestamp('deleted_at');
    table.foreign('instance_id').references('id').inTable('tradefinance.checklist_instances')
      .withKeyName('checklist_instance_tasks_instance_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.index(['instance_id', 'category'], 'idx_checklist_instance_tasks_instance_category');
    table.index(['instance_id', 'status'], 'idx_checklist_instance_tasks_instance_status');
  });
  await knex.raw(`CREATE TRIGGER set_checklist_instance_tasks_updated_at_timestamp
    BEFORE UPDATE ON tradefinance.checklist_instance_tasks
    FOR EACH ROW EXECUTE PROCEDURE commons.trigger_set_timestamp();`);

  // 6. checklist_instance_task_audit
  console.log('Creating tradefinance.checklist_instance_task_audit');
  await knex.schema.withSchema('tradefinance').createTable('checklist_instance_task_audit', table => {
    table.increments('id').primary();
    table.integer('task_id').notNullable();
    table.text('action').notNullable();
    table.text('user_id').notNullable();
    table.text('user_role');
    table.text('old_status');
    table.text('new_status').notNullable();
    table.json('details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // No updated_at or deleted_at — immutable append-only table
    table.foreign('task_id').references('id').inTable('tradefinance.checklist_instance_tasks')
      .withKeyName('checklist_audit_task_fkey').onUpdate('NO ACTION').onDelete('CASCADE');
    table.index(['task_id', 'created_at'], 'idx_checklist_audit_task_id_created');
  });
};

exports.down = async function (knex) {
  console.log('Dropping all checklist tables from tradefinance schema');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_instance_task_audit');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_instance_tasks');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_instances');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_template_parameters');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_template_tasks');
  await knex.schema.withSchema('tradefinance').dropTableIfExists('checklist_templates');
};
```

---

## API Contracts

### Template Management (Seeding Phase)

#### POST `/lending/checklist/template`
- **Permission:** `CHECKLIST_CREATE`
- **Authentication:** Required
- **Request Headers:** `X-User-Id`, `X-Org-Id`, `X-User-Token`
- **Request Body:**
```json
{
  "name": "string — Template name — max 100, alphanumeric only, required",
  "description": "string — Template description — max 256, alphanumeric only, required",
  "workflowType": "string — Target workflow name — required, must be valid WORKFLOW_TYPE",
  "checklistType": "string — CREDIT_FACILITY | APPLICATION — required",
  "parameters": [
    {
      "parameterType": "string — dynamic model field code — required",
      "parameterValues": ["string[] — selected values — required, min 1"]
    }
  ],
  "tasks": [
    {
      "category": "string — DOCUMENTATION|LEGAL|COMPLIANCE|CREDIT|OPERATIONAL|FINANCE — required",
      "name": "string — max 100, alphanumeric only — required",
      "description": "string — max 256, alphanumeric only — required",
      "ownerRole": "string — user role code — optional (null = any role)",
      "stage": "integer — workflow priority level — required",
      "isMandatory": "boolean — required",
      "completionCriteria": "string — DOCUMENT|INPUT_FIELD|UNDERTAKING|TEXT_RESPONSE — required",
      "documentCategory": "string — required if completionCriteria=DOCUMENT, else null",
      "documentType": "string — required if completionCriteria=DOCUMENT, else null",
      "effectiveFrom": "date (ISO 8601) — optional",
      "effectiveUntil": "date (ISO 8601) — optional",
      "additionalInfo": "string — max 10000 — optional",
      "sampleDocumentId": "integer — optional",
      "fieldMapping": "object (JSON) — optional"
    }
  ]
}
```
- **Response 200:**
```json
{
  "id": "integer — created template ID",
  "status": "DRAFT"
}
```
- **Error Responses:**
  - 400: Joi validation failure (missing required fields, invalid values)
  - 403: User lacks `CHECKLIST_CREATE` permission or wrong role for checklist type
  - 500: Internal server error

---

#### PATCH `/lending/checklist/template/:templateId`
- **Permission:** `CHECKLIST_CREATE`
- **Authentication:** Required
- **Request Body:** Same structure as POST (all fields optional for partial update). `tasks` and `parameters` replace the full set (delete + re-insert pattern).
- **Response 200:**
```json
{ "id": "integer", "status": "string" }
```
- **Error Responses:**
  - 400: Validation failure
  - 403: Not the author, or template not in DRAFT/RESUBMISSION_PENDING status
  - 404: Template not found
  - 500: Internal server error

---

#### POST `/lending/checklist/template/:templateId/submit`
- **Permission:** `CHECKLIST_CREATE`
- **Authentication:** Required
- **Request Body:**
```json
{
  "notes": "string — optional submission notes"
}
```
- **Response 200:**
```json
{ "id": "integer", "status": "REVIEW_PENDING", "activeUser": "string" }
```
- **Error Responses:**
  - 400: Template has no tasks, or missing mandatory fields
  - 403: Not the author or template not in submittable state
  - 404: Template not found

---

#### POST `/lending/checklist/template/:templateId/approve`
- **Permission:** `CHECKLIST_APPROVE`
- **Authentication:** Required
- **Request Body:**
```json
{ "notes": "string — optional approval notes" }
```
- **Response 200:**
```json
{ "id": "integer", "status": "APPROVED" }
```
- **Error Responses:**
  - 403: User is not the active checker for this template's workflow
  - 404: Template not found

---

#### POST `/lending/checklist/template/:templateId/reject`
- **Permission:** `CHECKLIST_APPROVE`
- **Authentication:** Required
- **Request Body:**
```json
{ "notes": "string — rejection reason — required" }
```
- **Response 200:**
```json
{ "id": "integer", "status": "REJECTED" }
```
- **Error Responses:**
  - 400: Notes required but missing
  - 403: User is not the active checker
  - 404: Template not found

---

#### POST `/lending/checklist/template/:templateId/send-rework`
- **Permission:** `CHECKLIST_APPROVE`
- **Authentication:** Required
- **Request Body:**
```json
{ "notes": "string — rework reason — required" }
```
- **Response 200:**
```json
{ "id": "integer", "status": "RESUBMISSION_PENDING", "activeUser": "string" }
```
- **Error Responses:**
  - 400: Notes required but missing
  - 403: User is not the active checker
  - 404: Template not found

---

#### GET `/lending/checklist/template/:templateId`
- **Permission:** `CHECKLIST_VIEW`
- **Authentication:** Required
- **Response 200:**
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "workflowType": "string",
  "checklistType": "string",
  "status": "string",
  "activeUser": "string",
  "authorUserId": "string",
  "authorName": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "parameters": [
    { "id": "integer", "parameterType": "string", "parameterValues": ["string"] }
  ],
  "tasks": [
    {
      "id": "integer", "category": "string", "name": "string", "description": "string",
      "ownerRole": "string", "stage": "integer", "isMandatory": "boolean",
      "completionCriteria": "string", "documentCategory": "string", "documentType": "string",
      "effectiveFrom": "date", "effectiveUntil": "date", "additionalInfo": "string",
      "sampleDocumentId": "integer", "fieldMapping": "object", "sortOrder": "integer"
    }
  ]
}
```
- **Error Responses:**
  - 404: Template not found

---

#### GET `/lending/checklist/templates`
- **Permission:** `CHECKLIST_VIEW`
- **Authentication:** Required
- **Query Parameters:**
  - `dateFrom` — ISO date (optional)
  - `dateTo` — ISO date (optional)
  - `checklistType` — CREDIT_FACILITY | APPLICATION (optional)
  - `status` — DRAFT | REVIEW_PENDING | APPROVED | REJECTED | RESUBMISSION_PENDING (optional)
  - `createdBy` — user ID (optional)
  - `workflowType` — workflow name (optional)
  - `_page` — integer, default 1
  - `_limit` — integer, default 20, max 100
- **Response 200:**
```json
{
  "data": [
    {
      "id": "integer", "name": "string", "checklistType": "string",
      "workflowType": "string", "status": "string", "authorName": "string",
      "taskCount": "integer", "createdAt": "ISO timestamp"
    }
  ],
  "pagination": { "page": "integer", "limit": "integer", "total": "integer" }
}
```

---

### Execution Phase (Instance Lifecycle)

#### POST `/lending/checklist/instance/create`
- **Permission:** Internal (called by CF/Application creation service)
- **Authentication:** Required
- **Request Body:**
```json
{
  "workflowId": "integer — CF or Finance Application ID — required",
  "workflowType": "string — workflow type name — required",
  "checklistType": "string — CREDIT_FACILITY | APPLICATION — required",
  "workflowCreationDate": "date (ISO 8601) — required",
  "parameterContext": {
    "PARAMETER_TYPE_CODE": ["value1", "value2"]
  }
}
```
- **Response 200:**
```json
{
  "instanceId": "integer",
  "taskCount": "integer",
  "mandatoryTaskCount": "integer",
  "sourceTemplateIds": ["integer"]
}
```
- **Error Responses:**
  - 400: Validation failure
  - 409: Instance already exists for this workflow_id

---

#### GET `/lending/checklist/instance/:workflowId`
- **Permission:** `CHECKLIST_VIEW`
- **Authentication:** Required
- **Response 200:**
```json
{
  "instanceId": "integer",
  "workflowId": "integer",
  "workflowType": "string",
  "checklistType": "string",
  "summary": {
    "totalMandatory": "integer",
    "completedMandatory": "integer",
    "canSubmit": "boolean"
  },
  "categories": ["string — list of categories that have at least 1 task"],
  "tasks": [
    {
      "id": "integer", "category": "string", "name": "string", "description": "string",
      "ownerRole": "string", "stage": "integer", "isMandatory": "boolean",
      "completionCriteria": "string", "documentCategory": "string", "documentType": "string",
      "additionalInfo": "string", "sampleDocumentId": "integer", "fieldMapping": "object",
      "status": "string", "isAdhoc": "boolean",
      "completedBy": "string", "completedAt": "ISO timestamp",
      "deferredUntil": "date", "deferralReason": "string",
      "deferredBy": "string", "deferredAt": "ISO timestamp",
      "declarationTextSnapshot": "string", "textResponse": "string",
      "isActionable": "boolean — true if current user role + stage matches",
      "isReadOnly": "boolean — true if stage has passed or role mismatch"
    }
  ]
}
```
- **Error Responses:**
  - 404: No instance found for workflow_id

---

#### PATCH `/lending/checklist/instance/task/:taskId`
- **Permission:** `CHECKLIST_EXECUTE`
- **Authentication:** Required
- **Request Body:**
```json
{
  "status": "string — COMPLETED | PENDING — required",
  "declarationText": "string — required if completion_criteria=UNDERTAKING and status=COMPLETED",
  "textResponse": "string — required if completion_criteria=TEXT_RESPONSE and status=COMPLETED"
}
```
- **Response 200:**
```json
{ "taskId": "integer", "status": "string", "updatedAt": "ISO timestamp" }
```
- **Error Responses:**
  - 400: Validation failure
  - 403: Role/stage mismatch (user not authorized for this task)
  - 404: Task not found

---

#### POST `/lending/checklist/instance/:instanceId/task`
- **Permission:** `CHECKLIST_EXECUTE`
- **Authentication:** Required
- **Request Body:**
```json
{
  "category": "string — required",
  "name": "string — max 100 — required",
  "description": "string — max 256 — required",
  "ownerRole": "string — required (who should complete it)",
  "stage": "integer — required",
  "completionCriteria": "string — DOCUMENT|INPUT_FIELD|UNDERTAKING|TEXT_RESPONSE — required",
  "documentCategory": "string — optional",
  "documentType": "string — optional"
}
```
- **Response 200:**
```json
{ "taskId": "integer", "status": "PENDING", "isMandatory": true, "isAdhoc": true }
```
- **Error Responses:**
  - 400: Validation failure
  - 404: Instance not found

---

#### POST `/lending/checklist/instance/task/:taskId/defer`
- **Permission:** `CHECKLIST_DEFER`
- **Authentication:** Required
- **Request Body:**
```json
{
  "deferredUntil": "date (ISO 8601) — must be future date — required",
  "deferralReason": "string — required"
}
```
- **Response 200:**
```json
{ "taskId": "integer", "status": "DEFERRED", "deferredUntil": "date" }
```
- **Error Responses:**
  - 400: Date in past, reason missing, or task is not mandatory
  - 403: Role/stage mismatch
  - 404: Task not found

---

#### POST `/lending/checklist/instance/task/:taskId/review`
- **Permission:** `CHECKLIST_EXECUTE`
- **Authentication:** Required
- **Request Body:**
```json
{
  "action": "string — ACCEPTED | REJECTED — required"
}
```
- **Response 200:**
```json
{ "taskId": "integer", "status": "string" }
```
- **Error Responses:**
  - 400: Task is not in REVIEW_PENDING status, or task owner_role != CLIENT
  - 403: User not authorized (must be internal user)
  - 404: Task not found

---

#### GET `/lending/checklist/instance/:workflowId/gatekeeper`
- **Permission:** `CHECKLIST_VIEW`
- **Authentication:** Required
- **Response 200:**
```json
{
  "canSubmit": "boolean",
  "totalMandatory": "integer",
  "completedOrDeferred": "integer",
  "incompleteCategories": ["string — categories with incomplete mandatory tasks"],
  "incompleteTaskIds": ["integer — IDs of blocking tasks"]
}
```
- **Error Responses:**
  - 404: No instance found for workflow_id

---

### Client Portal Endpoints

#### GET `/lending/checklist/client/instance/:workflowId`
- **Permission:** Client portal authentication
- **Authentication:** Required (client token)
- **Response 200:** Same structure as GET `/lending/checklist/instance/:workflowId` but tasks are **filtered** to only those where `owner_role = 'CLIENT'`. Internal tasks are completely excluded from the response.

---

#### PATCH `/lending/checklist/client/instance/task/:taskId`
- **Permission:** Client portal authentication
- **Authentication:** Required (client token)
- **Request Body:**
```json
{
  "status": "string — REVIEW_PENDING — required (clients can only submit for review)"
}
```
- **Response 200:**
```json
{ "taskId": "integer", "status": "REVIEW_PENDING" }
```
- **Error Responses:**
  - 400: Status must be REVIEW_PENDING
  - 403: Task owner_role is not CLIENT
  - 404: Task not found

---

### Utility Endpoints

#### GET `/lending/checklist/parameters`
- **Permission:** `CHECKLIST_VIEW`
- **Response 200:** Proxied response from `getDynamicFieldsService(db, 'EXPOSURE')` — array of component details with parameter types and dropdown values.

#### GET `/lending/checklist/workflows`
- **Permission:** `CHECKLIST_VIEW`
- **Response 200:**
```json
{
  "workflows": [
    { "key": "CREDIT_ASSESSMENT", "label": "Credit Assessment" }
  ]
}
```
Filtered by user role: Credit Analysts see `CREDIT_*` workflows, Operations Makers see `FINANCE_*` workflows.

#### GET `/lending/checklist/stages/:workflowType`
- **Permission:** `CHECKLIST_VIEW`
- **Response 200:**
```json
{
  "stages": [
    { "priority": 1, "userRole": "MAKER", "label": "Operations Maker" },
    { "priority": 2, "userRole": "CHECKER", "label": "Operations Checker" }
  ]
}
```

---

## Joi Validation Schemas

### `create_template_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const config = require('@config/config');
const checklistConfig = config.getConfig('CHECKLIST_CONFIG');

const taskSchema = Joi.object({
  category: Joi.string().required().valid(...checklistConfig.TASK_CATEGORIES),
  name: Joi.string().required().max(100).pattern(/^[a-zA-Z0-9\s]+$/),
  description: Joi.string().required().max(256).pattern(/^[a-zA-Z0-9\s]+$/),
  ownerRole: Joi.string().allow(null, '').optional(),
  stage: Joi.number().integer().required().positive(),
  isMandatory: Joi.boolean().required(),
  completionCriteria: Joi.string().required().valid(...checklistConfig.COMPLETION_CRITERIA_TYPES),
  documentCategory: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  }),
  documentType: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  }),
  effectiveFrom: Joi.date().iso().allow(null).optional(),
  effectiveUntil: Joi.date().iso().allow(null).optional(),
  additionalInfo: Joi.string().max(10000).allow(null, '').optional(),
  sampleDocumentId: Joi.number().integer().allow(null).optional(),
  fieldMapping: Joi.object().allow(null).optional()
});

const parameterSchema = Joi.object({
  parameterType: Joi.string().required(),
  parameterValues: Joi.array().items(Joi.string()).min(1).required()
});

const schema = Joi.object({
  name: Joi.string().required().max(100).pattern(/^[a-zA-Z0-9\s]+$/),
  description: Joi.string().required().max(256).pattern(/^[a-zA-Z0-9\s]+$/),
  workflowType: Joi.string().required(),
  checklistType: Joi.string().required().valid(...Object.values(checklistConfig.CHECKLIST_TYPES)),
  parameters: Joi.array().items(parameterSchema).optional().default([]),
  tasks: Joi.array().items(taskSchema).min(1).required()
});

module.exports = schema;
```

### `update_template_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const config = require('@config/config');
const checklistConfig = config.getConfig('CHECKLIST_CONFIG');

const taskSchema = Joi.object({
  id: Joi.number().integer().optional(),
  category: Joi.string().required().valid(...checklistConfig.TASK_CATEGORIES),
  name: Joi.string().required().max(100).pattern(/^[a-zA-Z0-9\s]+$/),
  description: Joi.string().required().max(256).pattern(/^[a-zA-Z0-9\s]+$/),
  ownerRole: Joi.string().allow(null, '').optional(),
  stage: Joi.number().integer().required().positive(),
  isMandatory: Joi.boolean().required(),
  completionCriteria: Joi.string().required().valid(...checklistConfig.COMPLETION_CRITERIA_TYPES),
  documentCategory: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  }),
  documentType: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  }),
  effectiveFrom: Joi.date().iso().allow(null).optional(),
  effectiveUntil: Joi.date().iso().allow(null).optional(),
  additionalInfo: Joi.string().max(10000).allow(null, '').optional(),
  sampleDocumentId: Joi.number().integer().allow(null).optional(),
  fieldMapping: Joi.object().allow(null).optional()
});

const parameterSchema = Joi.object({
  parameterType: Joi.string().required(),
  parameterValues: Joi.array().items(Joi.string()).min(1).required()
});

const schema = Joi.object({
  name: Joi.string().max(100).pattern(/^[a-zA-Z0-9\s]+$/).optional(),
  description: Joi.string().max(256).pattern(/^[a-zA-Z0-9\s]+$/).optional(),
  parameters: Joi.array().items(parameterSchema).optional(),
  tasks: Joi.array().items(taskSchema).min(1).optional()
});

module.exports = schema;
```

### `list_templates_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const config = require('@config/config');
const checklistConfig = config.getConfig('CHECKLIST_CONFIG');

const schema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  checklistType: Joi.string().valid(...Object.values(checklistConfig.CHECKLIST_TYPES)).optional(),
  status: Joi.string().valid(...Object.values(checklistConfig.TEMPLATE_STATUSES)).optional(),
  createdBy: Joi.string().optional(),
  workflowType: Joi.string().optional(),
  _page: Joi.number().integer().min(1).default(1),
  _limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = schema;
```

### `create_instance_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));

const schema = Joi.object({
  workflowId: Joi.number().integer().required(),
  workflowType: Joi.string().required(),
  checklistType: Joi.string().required().valid('CREDIT_FACILITY', 'APPLICATION'),
  workflowCreationDate: Joi.date().iso().required(),
  parameterContext: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).required()
});

module.exports = schema;
```

### `update_task_status_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi');

const schema = Joi.object({
  status: Joi.string().required().valid('COMPLETED', 'PENDING'),
  declarationText: Joi.string().max(10000).optional(),
  textResponse: Joi.string().max(10000).optional()
});

module.exports = schema;
```

### `defer_task_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));

const schema = Joi.object({
  deferredUntil: Joi.date().iso().greater('now').required(),
  deferralReason: Joi.string().required().max(2000)
});

module.exports = schema;
```

### `adhoc_task_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi');
const config = require('@config/config');
const checklistConfig = config.getConfig('CHECKLIST_CONFIG');

const schema = Joi.object({
  category: Joi.string().required().valid(...checklistConfig.TASK_CATEGORIES),
  name: Joi.string().required().max(100).pattern(/^[a-zA-Z0-9\s]+$/),
  description: Joi.string().required().max(256),
  ownerRole: Joi.string().required(),
  stage: Joi.number().integer().required().positive(),
  completionCriteria: Joi.string().required().valid(...checklistConfig.COMPLETION_CRITERIA_TYPES),
  documentCategory: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  }),
  documentType: Joi.when('completionCriteria', {
    is: 'DOCUMENT', then: Joi.string().required(), otherwise: Joi.allow(null).optional()
  })
});

module.exports = schema;
```

### `review_task_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi');

const schema = Joi.object({
  action: Joi.string().required().valid('ACCEPTED', 'REJECTED')
});

module.exports = schema;
```

### `workflow_action_schema.js`

```javascript
'use strict';
const Joi = require('@hapi/joi');

const schema = Joi.object({
  notes: Joi.string().required().max(5000)
});

module.exports = schema;
```

---

## Workflow State Seeding

### Migration 3: `seed_checklist_workflows.js`

```javascript
'use strict';
require('module-alias/register');

exports.up = async function (knex) {
  // CF Checklist Approval workflow
  const cfWorkflowData = [
    {
      user_role: 'CA',
      workflow: 'CHECKLIST_CF_APPROVAL',
      priority: 1,
      allowed_services: 'V_CHECKLIST',
      allowed_actions: 'APPROVED',
      configurable: false,
      final_authority: false
    },
    {
      user_role: 'HOC',
      workflow: 'CHECKLIST_CF_APPROVAL',
      priority: 2,
      allowed_services: 'V_CHECKLIST',
      allowed_actions: 'APPROVED, REJECT, SEND_REWORK',
      configurable: false,
      final_authority: true
    }
  ];

  console.log('Inserting CF checklist approval workflow data into lending.workflow');
  await knex('lending.workflow').insert(cfWorkflowData);

  // Application Checklist Approval workflow
  const appWorkflowData = [
    {
      user_role: 'MAKER',
      workflow: 'CHECKLIST_APP_APPROVAL',
      priority: 1,
      allowed_services: 'V_CHECKLIST',
      allowed_actions: 'APPROVED',
      configurable: false,
      final_authority: false
    },
    {
      user_role: 'CHECKER',
      workflow: 'CHECKLIST_APP_APPROVAL',
      priority: 2,
      allowed_services: 'V_CHECKLIST',
      allowed_actions: 'APPROVED, REJECT, SEND_REWORK',
      configurable: false,
      final_authority: true
    }
  ];

  console.log('Inserting Application checklist approval workflow data into lending.workflow');
  await knex('lending.workflow').insert(appWorkflowData);

  // No skipflow rows needed for Phase 1
};

exports.down = async function (knex) {
  console.log('Deleting checklist workflow rows from lending.workflow');
  await knex('lending.workflow').where('workflow', 'CHECKLIST_CF_APPROVAL').del();
  await knex('lending.workflow').where('workflow', 'CHECKLIST_APP_APPROVAL').del();
};
```

### `lending.skipflow` — No rows needed

Both checklist approval workflows are simple 2-step maker-checker flows with no auto-skip scenarios in Phase 1.

---

## Configuration Additions to `settings.js`

### `WORKFLOW_TYPE` object — add:
```javascript
CHECKLIST_CF_APPROVAL: 'CHECKLIST_CF_APPROVAL',
CHECKLIST_APP_APPROVAL: 'CHECKLIST_APP_APPROVAL',
```

### `LENDING_WORK_TYPE` object — add:
```javascript
CHECKLIST: 'CHECKLIST',
```

### New `CHECKLIST_CONFIG` block:
```javascript
CHECKLIST_CONFIG: {
  TASK_CATEGORIES: ['DOCUMENTATION', 'LEGAL', 'COMPLIANCE', 'CREDIT', 'OPERATIONAL', 'FINANCE'],
  COMPLETION_CRITERIA_TYPES: ['DOCUMENT', 'INPUT_FIELD', 'UNDERTAKING', 'TEXT_RESPONSE'],
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
  },
  AUDIT_ACTIONS: {
    COMPLETED: 'COMPLETED',
    DEFERRED: 'DEFERRED',
    UNDONE: 'UNDONE',
    REVIEWED: 'REVIEWED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    REVERTED_DOC_DELETED: 'REVERTED_DOC_DELETED',
    CREATED: 'CREATED'
  }
},
```

### New `CHECKLIST_PERMISSIONS` block:
```javascript
CHECKLIST_PERMISSIONS: {
  CREATE: 'CHECKLIST_CREATE',
  APPROVE: 'CHECKLIST_APPROVE',
  VIEW: 'CHECKLIST_VIEW',
  EXECUTE: 'CHECKLIST_EXECUTE',
  DEFER: 'CHECKLIST_DEFER'
},
```

### Product Config Key (via `commons.product_configuration` or environment variable):
```
CHECKLIST_GATEKEEPER_ENABLED = false  (default in all environments)
```

---

## Process Workflow Integration — DB Service Changes

### `_getWorkDetailsFromWorkIdAndType()` — new branch:

```javascript
else if (workType === lendingWorkType.CHECKLIST) {
  [entityDetails] = await trx.select(
    'ct.id', 'ct.name', 'ct.description', 'ct.workflow_type',
    'ct.checklist_type', 'ct.status', 'ct.active_user', 'ct.active_workflow',
    'ct.author_user_id', 'u.user_full_name as author_name'
  )
  .from('tradefinance.checklist_templates as ct')
  .leftJoin('tradefinance.users as u', 'u.id', 'ct.author_user_id')
  .where('ct.id', entityId);

  entityDetails.page_link = `https://${urlPrefixByEnv[appEnv]}finance.dpworld.com/lending/checklist/template?id=${entityDetails.id}`;
  entityDetails.author_user_id = entityDetails.author_user_id;
  entityDetails.id = entityDetails.id;
}
```

### `_updateWorkItemDetails()` — new branch:

```javascript
else if (workType === lendingWorkType.CHECKLIST) {
  await trx('tradefinance.checklist_templates')
    .update(updateObject)
    .whereIn('id', entityId);
}
```

---

**⛔ STOP — Awaiting Human Review (Draft 1)**

Please:
- Verify DB schema matches all requirements from Checkpoint 1
- Confirm API contracts match frontend expectations
- Validate Joi schemas cover all input cases and edge cases
- Confirm migration files are rollback-safe
- Verify workflow seeding rows are correct
- Approve to proceed to Checkpoint 5 (Implementation)
