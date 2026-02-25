# Checklist Service — Low-Level Design (LLD)

**Feature:** Trade Finance Checklist Service Phase 1
**Platform:** CargoFin Backend (Node.js / Express / PostgreSQL / Knex)
**Version:** 1.0 Draft
**Date:** 2026-02-23

---

## 1. Database Schema

### 1.1 `lending.checklist_templates`

Stores the master checklist template definitions.

```sql
CREATE TABLE lending.checklist_templates (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  description           VARCHAR(256) NOT NULL,
  workflow_type         VARCHAR(100) NOT NULL,       -- e.g., 'NEW_FACILITY', 'LIMIT_UPDATE', 'DISBURSAL'
  checklist_type        VARCHAR(20) NOT NULL,         -- 'CREDIT_FACILITY' or 'APPLICATION'
  status                VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                        -- ENUM: DRAFT, REVIEW_PENDING, REJECTED, RESUBMISSION_PENDING, APPROVED
  active_user           VARCHAR(50),                  -- Current workflow user role
  active_workflow       VARCHAR(100),                 -- Workflow name for process_workflow integration
  author_user_id        VARCHAR(50) NOT NULL,
  author_org_id         VARCHAR(50) NOT NULL,
  author_role           VARCHAR(50) NOT NULL,         -- 'CREDIT_ANALYST' or 'OPERATIONS_MAKER'
  checker_comments      TEXT,
  version               INTEGER NOT NULL DEFAULT 1,
  parent_template_id    INTEGER REFERENCES lending.checklist_templates(id),  -- For versioned updates
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_checklist_templates_status ON lending.checklist_templates(status);
CREATE INDEX idx_checklist_templates_workflow_type ON lending.checklist_templates(workflow_type);
CREATE INDEX idx_checklist_templates_checklist_type ON lending.checklist_templates(checklist_type);
CREATE INDEX idx_checklist_templates_author ON lending.checklist_templates(author_user_id);
```

### 1.2 `lending.checklist_template_tasks`

Stores tasks belonging to a template. One template has many tasks.

```sql
CREATE TABLE lending.checklist_template_tasks (
  id                    SERIAL PRIMARY KEY,
  template_id           INTEGER NOT NULL REFERENCES lending.checklist_templates(id),
  name                  VARCHAR(100) NOT NULL,
  name_normalized       VARCHAR(100) NOT NULL,         -- lowercase, no spaces — for de-duplication
  description           VARCHAR(256) NOT NULL,
  category              VARCHAR(20) NOT NULL,
                        -- ENUM: DOCUMENTATION, LEGAL, COMPLIANCE, CREDIT, OPERATIONAL, FINANCE
  is_mandatory          BOOLEAN NOT NULL DEFAULT false,
  owner_role            VARCHAR(50),                   -- NULL = any role can complete
  stage                 VARCHAR(100) NOT NULL,         -- Workflow lifecycle stage
  completion_criteria   VARCHAR(20) NOT NULL,
                        -- ENUM: DOCUMENT, INPUT_FIELD, UNDERTAKING, TEXT_RESPONSE
  -- Document-specific fields
  document_category     VARCHAR(100),
  document_type         VARCHAR(100),
  add_to_master_list    BOOLEAN DEFAULT false,
  -- Input-field-specific fields
  field_id              VARCHAR(200),                  -- data-checklist-id for scroll spy
  -- Undertaking-specific fields
  declaration_text      TEXT,
  -- Dates
  effective_from        DATE,
  effective_until       DATE,
  -- Guidance
  additional_info       TEXT,                           -- Rich text (HTML)
  sample_document_url   VARCHAR(500),                  -- S3 pre-signed URL base path
  sample_document_name  VARCHAR(200),
  -- Ordering
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_template_tasks_template_id ON lending.checklist_template_tasks(template_id);
CREATE INDEX idx_template_tasks_category ON lending.checklist_template_tasks(category);
CREATE INDEX idx_template_tasks_name_normalized ON lending.checklist_template_tasks(name_normalized);
```

### 1.3 `lending.checklist_template_parameters`

Stores parameter bindings for a template. One template has many parameter rows.

```sql
CREATE TABLE lending.checklist_template_parameters (
  id                    SERIAL PRIMARY KEY,
  template_id           INTEGER NOT NULL REFERENCES lending.checklist_templates(id),
  parameter_type        VARCHAR(50) NOT NULL,          -- e.g., 'PRODUCT', 'COUNTRY', 'COUNTERPARTY', 'FACILITY'
  parameter_value       VARCHAR(200) NOT NULL,         -- Specific value (supports multiselect via multiple rows)
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_template_params_template_id ON lending.checklist_template_parameters(template_id);
CREATE INDEX idx_template_params_type_value ON lending.checklist_template_parameters(parameter_type, parameter_value);
```

### 1.4 `lending.checklist_instances`

One instance per workflow (Credit Facility or Application). Created at workflow initiation time.

```sql
CREATE TABLE lending.checklist_instances (
  id                    SERIAL PRIMARY KEY,
  workflow_id           INTEGER NOT NULL,               -- CF ID or Finance Application ID
  workflow_type         VARCHAR(100) NOT NULL,           -- e.g., 'NEW_FACILITY', 'DISBURSAL'
  checklist_type        VARCHAR(20) NOT NULL,            -- 'CREDIT_FACILITY' or 'APPLICATION'
  total_mandatory       INTEGER NOT NULL DEFAULT 0,
  completed_mandatory   INTEGER NOT NULL DEFAULT 0,
  deferred_mandatory    INTEGER NOT NULL DEFAULT 0,
  can_submit            BOOLEAN NOT NULL DEFAULT false,  -- Gatekeeper flag
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_instance_workflow ON lending.checklist_instances(workflow_id, workflow_type);
```

### 1.5 `lending.checklist_instance_tasks`

Deep-copied tasks + ad-hoc tasks. Bound to an instance, never to a template.

```sql
CREATE TABLE lending.checklist_instance_tasks (
  id                    SERIAL PRIMARY KEY,
  instance_id           INTEGER NOT NULL REFERENCES lending.checklist_instances(id),
  source_template_id    INTEGER,                        -- NULL for ad-hoc tasks
  source_task_id        INTEGER,                        -- NULL for ad-hoc tasks
  name                  VARCHAR(100) NOT NULL,
  name_normalized       VARCHAR(100) NOT NULL,
  description           VARCHAR(256) NOT NULL,
  category              VARCHAR(20) NOT NULL,
  is_mandatory          BOOLEAN NOT NULL DEFAULT false,
  is_adhoc              BOOLEAN NOT NULL DEFAULT false,
  owner_role            VARCHAR(50),
  stage                 VARCHAR(100) NOT NULL,
  completion_criteria   VARCHAR(20) NOT NULL,
  -- Document fields
  document_category     VARCHAR(100),
  document_type         VARCHAR(100),
  -- Input-field fields
  field_id              VARCHAR(200),
  -- Undertaking fields
  declaration_text      TEXT,
  -- Status
  status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        -- ENUM: PENDING, COMPLETED, DEFERRED, REVIEW_PENDING, REJECTED_BY_INTERNAL
  -- Completion data
  completed_by_user_id  VARCHAR(50),
  completed_by_role     VARCHAR(50),
  completed_at          TIMESTAMP WITH TIME ZONE,
  text_response         TEXT,                            -- For TEXT_RESPONSE and UNDERTAKING completion
  -- Attestation snapshot
  signed_declaration    TEXT,                            -- Frozen text at time of undertaking sign
  -- Dates (inherited from template at instantiation)
  effective_from        DATE,
  effective_until       DATE,
  -- Guidance (inherited)
  additional_info       TEXT,
  sample_document_url   VARCHAR(500),
  sample_document_name  VARCHAR(200),
  -- Ordering
  sort_order            INTEGER NOT NULL DEFAULT 0,
  -- Ad-hoc creator info
  created_by_user_id    VARCHAR(50),
  created_by_role       VARCHAR(50),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_instance_tasks_instance_id ON lending.checklist_instance_tasks(instance_id);
CREATE INDEX idx_instance_tasks_status ON lending.checklist_instance_tasks(status);
CREATE INDEX idx_instance_tasks_category ON lending.checklist_instance_tasks(category);
CREATE INDEX idx_instance_tasks_doc_type ON lending.checklist_instance_tasks(document_type) WHERE document_type IS NOT NULL;
```

### 1.6 `lending.checklist_task_deferrals`

Audit trail for deferrals. Each update creates a new row (immutable log).

```sql
CREATE TABLE lending.checklist_task_deferrals (
  id                    SERIAL PRIMARY KEY,
  instance_task_id      INTEGER NOT NULL REFERENCES lending.checklist_instance_tasks(id),
  deferred_by_user_id   VARCHAR(50) NOT NULL,
  deferred_by_role      VARCHAR(50) NOT NULL,
  defer_until           DATE NOT NULL,
  reason                TEXT NOT NULL,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deferrals_task_id ON lending.checklist_task_deferrals(instance_task_id);
```

### 1.7 `lending.checklist_audit_log`

General-purpose audit log for all checklist actions.

```sql
CREATE TABLE lending.checklist_audit_log (
  id                    SERIAL PRIMARY KEY,
  entity_type           VARCHAR(30) NOT NULL,           -- 'TEMPLATE', 'INSTANCE', 'TASK'
  entity_id             INTEGER NOT NULL,
  action                VARCHAR(50) NOT NULL,           -- 'CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 
                                                        -- 'COMPLETED', 'DEFERRED', 'ATTESTATION', 'ACCEPTED', 'REJECTED_CLIENT'
  actor_user_id         VARCHAR(50) NOT NULL,
  actor_role            VARCHAR(50) NOT NULL,
  actor_org_id          VARCHAR(50),
  details               JSONB,                          -- Flexible payload (snapshot of signed text, comments, etc.)
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON lending.checklist_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON lending.checklist_audit_log(action);
```

### 1.8 `lending.document_type_master`

Global document type lookup, with normalized-string de-duplication.

```sql
CREATE TABLE lending.document_type_master (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(200) NOT NULL,
  name_normalized       VARCHAR(200) NOT NULL UNIQUE,   -- lowercase, no spaces
  category              VARCHAR(100),
  source                VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',  -- 'SYSTEM' or 'CHECKLIST'
  created_by_user_id    VARCHAR(50),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Service Layer — Detailed Function Signatures

### 2.1 `checklist/index.js` (Template Service)

```javascript
'use strict';

module.exports = {
  // Template CRUD
  createTemplate:       async (trx, payload, userId, orgId, userRole) => { ... },
  getTemplateById:      async (templateId) => { ... },
  getTemplates:         async (filterParams) => { ... },
  updateTemplate:       async (trx, templateId, payload, userId) => { ... },

  // Task CRUD within template
  addTask:              async (trx, templateId, taskPayload, userId) => { ... },
  updateTask:           async (trx, templateId, taskId, taskPayload, userId) => { ... },
  deleteTask:           async (trx, templateId, taskId, userId) => { ... },

  // Workflow actions (integrates with processWorkflow)
  submitForReview:      async (trx, templateId, userId, orgId) => { ... },
  approveTemplate:      async (trx, templateId, userId, orgId, comments) => { ... },
  rejectTemplate:       async (trx, templateId, userId, orgId, comments) => { ... },
  sendBackTemplate:     async (trx, templateId, userId, orgId, comments) => { ... },

  // Dropdowns
  getWorkflowsForRole:  async (userRole) => { ... },
  getParameterTypes:    async () => { ... },
  searchParameterValues: async (parameterType, searchTerm) => { ... },

  // Document master
  addToDocumentTypeMaster: async (trx, name, category, userId) => { ... },
};
```

### 2.2 `checklist/execution.js` (Execution Service)

```javascript
'use strict';

module.exports = {
  // Instance lifecycle
  createInstance:             async (trx, workflowId, workflowType, checklistType, workflowMetadata) => { ... },
  getInstanceByWorkflowId:    async (workflowId, workflowType, userId, userRole) => { ... },

  // Task operations
  completeTask:               async (trx, instanceTaskId, userId, userRole, payload) => { ... },
  undoCompleteTask:           async (trx, instanceTaskId, userId, userRole) => { ... },

  // Deferral
  deferTask:                  async (trx, instanceTaskId, userId, userRole, deferPayload) => { ... },

  // Ad-hoc tasks
  addAdhocTask:               async (trx, instanceId, taskPayload, userId, userRole) => { ... },

  // DMS Auto-verification
  syncDocumentStatus:         async (trx, instanceId, workflowId) => { ... },

  // Gatekeeper
  checkGatekeeperStatus:      async (workflowId, workflowType) => { ... },

  // Client portal handshake
  acceptClientTask:           async (trx, instanceTaskId, userId, userRole) => { ... },
  rejectClientTask:           async (trx, instanceTaskId, userId, userRole) => { ... },

  // External portal
  getInstanceForExternalPortal: async (workflowId, workflowType) => { ... },
  completeClientTask:           async (trx, instanceTaskId, clientUserId) => { ... },

  // Counter recalculation (internal)
  _recalculateCounters:       async (trx, instanceId) => { ... },
};
```

### 2.3 `checklist/notification.js` (Notification Service)

```javascript
'use strict';

module.exports = {
  // Template workflow notifications (Module 1)
  notifyReviewPending:        async (trx, template, submitterName) => { ... },
  notifyApproved:             async (trx, template) => { ... },
  notifyRejected:             async (trx, template, checkerName, comments) => { ... },
  notifyResubmission:         async (trx, template, checkerName, comments) => { ... },

  // Execution notifications (Module 2, 8, 9, 10)
  notifyAdhocTaskAdded:       async (trx, instance, task, adderName) => { ... },
  notifyMandatoryTaskDeferred: async (trx, instance, task, deferrerName, targetDate) => { ... },
  notifyClientTaskCreated:    async (trx, instance, task) => { ... },
  notifyDocumentDeleted:      async (trx, instance, task) => { ... },

  // Template conflict alert (Module 5)
  notifyTemplateConflict:     async (trx, templateA, templateB, workflowName) => { ... },
};
```

---

## 3. Aggregation Engine — Detailed Algorithm

This is the core of Module 5 and runs at instance creation time.

```
FUNCTION createInstance(trx, workflowId, workflowType, checklistType, workflowMetadata):

  1. CHECK if instance already exists for (workflowId, workflowType)
     → If yes, return existing instance (idempotent)

  2. FETCH all APPROVED templates WHERE:
     - checklist_type = checklistType
     - workflow_type = workflowType
     - deleted_at IS NULL

  3. PARTITION templates into:
     - globalTemplates: templates with ZERO parameters
     - paramTemplates: templates with parameters

  4. FILTER paramTemplates:
     FOR each template in paramTemplates:
       matched = false
       FOR each parameter_row in template.parameters:
         IF workflowMetadata[parameter_row.type] CONTAINS parameter_row.value:
           matched = true
           BREAK
       IF matched:
         add to matchedTemplates

  5. COMBINE: allTemplates = globalTemplates ∪ matchedTemplates

  6. COLLECT all tasks from allTemplates:
     allTasks = []
     FOR each template in allTemplates:
       FOR each task in template.tasks:
         IF task.effective_from AND workflow_created_date < task.effective_from:
           SKIP  -- Task not yet effective
         IF task.effective_until AND workflow_created_date > task.effective_until:
           SKIP  -- Task expired
         allTasks.push({ ...task, source_template_id: template.id })

  7. DE-DUPLICATE by name_normalized:
     taskMap = {}
     FOR each task in allTasks:
       key = task.name_normalized
       IF key NOT IN taskMap:
         taskMap[key] = task
       ELSE:
         -- Apply strictness: if ANY source says mandatory, result is mandatory
         IF task.is_mandatory:
           taskMap[key].is_mandatory = true
         -- Keep the task with the most complete data (longer description, etc.)

  8. CREATE instance record in checklist_instances

  9. BULK INSERT de-duplicated tasks into checklist_instance_tasks
     with instance_id, source_template_id, source_task_id, is_adhoc=false

  10. CALCULATE counters:
      total_mandatory = count(tasks WHERE is_mandatory = true)
      UPDATE instance SET total_mandatory, can_submit = (total_mandatory == 0)

  11. LOG to checklist_audit_log: action='CREATED', entity_type='INSTANCE'

  RETURN instance with tasks
```

---

## 4. Controller → Service → DB Service Call Chain

### 4.1 Example: Create Template

```
[POST /lending/checklist/template]
  │
  ▼
checklist_controller.createTemplate(req, res)
  │  1. Extract userId, orgId from headers
  │  2. Validate payload with Joi schema (create_checklist_template.js)
  │  3. Determine userRole and validate against checklist_type
  │     (Credit Analyst → CREDIT_FACILITY, Ops Maker → APPLICATION)
  │
  ▼
db.transaction(async trx => {
  checklistService.createTemplate(trx, validatedPayload, userId, orgId, userRole)
    │  1. Build template object
    │  2. INSERT into checklist_templates (status='DRAFT')
    │  3. FOR EACH task in payload.tasks:
    │     │  normalize name → INSERT into checklist_template_tasks
    │     │  IF completion_criteria = 'DOCUMENT' AND add_to_master_list:
    │     │    → addToDocumentTypeMaster(trx, docType, docCategory, userId)
    │  4. FOR EACH parameter in payload.parameters:
    │     │  INSERT into checklist_template_parameters
    │  5. LOG to checklist_audit_log
    │
    ▼
  return templateId
})
  │
  ▼
res.status(201).json({ template_id: templateId, status: 'DRAFT' })
```

### 4.2 Example: Complete a Task (Execution)

```
[PATCH /lending/checklist/instance/task/:instanceTaskId/complete]
  │
  ▼
checklist_execution_controller.completeTask(req, res)
  │  1. Extract userId, orgId, userRole from headers
  │  2. Validate payload with Joi schema (complete_task.js)
  │
  ▼
db.transaction(async trx => {
  executionService.completeTask(trx, instanceTaskId, userId, userRole, payload)
    │
    │  1. FETCH task from checklist_instance_tasks by id
    │  2. VALIDATE:
    │     a. task.status == 'PENDING' or 'DEFERRED' or 'REJECTED_BY_INTERNAL'
    │     b. IF task.owner_role IS NOT NULL:
    │        → userRole MUST MATCH task.owner_role (else throw ForbiddenError)
    │     c. IF task.stage IS NOT NULL:
    │        → current workflow stage MUST MATCH task.stage (else throw ForbiddenError)
    │     d. IF task.completion_criteria == 'UNDERTAKING':
    │        → ONLY owner can tick (manual). Verify role.
    │
    │  3. UPDATE task:
    │     status = 'COMPLETED' (or 'REVIEW_PENDING' if completed by Client role)
    │     completed_by_user_id = userId
    │     completed_by_role = userRole
    │     completed_at = NOW()
    │     text_response = payload.text_response (if TEXT_RESPONSE or UNDERTAKING)
    │     signed_declaration = task.declaration_text (if UNDERTAKING — freeze snapshot)
    │
    │  4. LOG to checklist_audit_log:
    │     action='COMPLETED' (or 'ATTESTATION' for undertaking)
    │     details = { signed_text, user_role, timestamp }
    │
    │  5. RECALCULATE counters:
    │     _recalculateCounters(trx, task.instance_id)
    │     → completed_mandatory = count(tasks WHERE is_mandatory AND status IN ('COMPLETED','DEFERRED'))
    │     → can_submit = (completed_mandatory + deferred_mandatory >= total_mandatory)
    │     → UPDATE checklist_instances
    │
    ▼
  return updatedTask
})
  │
  ▼
res.status(200).json(updatedTask)
```

### 4.3 Example: Instance Creation (triggered at Workflow creation)

```
[POST /lending/checklist/instance/create]
  │  body: { workflow_id, workflow_type, checklist_type, workflow_metadata }
  │  workflow_metadata: { product: 'INVOICE_FACTORING', country: 'UAE', ... }
  │
  ▼
checklist_execution_controller.createInstance(req, res)
  │
  ▼
db.transaction(async trx => {
  executionService.createInstance(trx, workflowId, workflowType, checklistType, metadata)
    │
    │  → Runs Aggregation Engine (Section 3 above)
    │  → Returns instance with tasks
    │
    ▼
})
  │
  ▼
res.status(201).json(instance)
```

---

## 5. Gatekeeper Integration

The gatekeeper is a **read-only check** that determines whether the main workflow's "Submit" / "Approve" / "Disburse" button should be enabled.

### 5.1 API Endpoint

```
GET /lending/checklist/instance/:workflowId/gatekeeper?workflowType=NEW_FACILITY
```

### 5.2 Response

```json
{
  "can_submit": false,
  "total_mandatory": 8,
  "completed_mandatory": 5,
  "deferred_mandatory": 2,
  "pending_mandatory": 1,
  "blocking_tasks": [
    {
      "task_id": 42,
      "name": "Board Resolution",
      "category": "DOCUMENTATION",
      "status": "PENDING"
    }
  ]
}
```

### 5.3 Integration with Existing Submit Flows

The existing CF and Finance Application submit flows in `credit_facility/index.js` and `finance_application/index.js` need a **pre-submit hook**:

```javascript
// Inside the existing submit/approve service function:
const { can_submit, blocking_tasks } = await checklistExecutionService.checkGatekeeperStatus(entityId, workflowType);
if (!can_submit) {
  throw new ArgumentError(`Mandatory checklist items pending: ${blocking_tasks.map(t => t.name).join(', ')}`);
}
```

This is the **only modification** needed in existing service files — a simple guard call before proceeding with the existing workflow logic.

---

## 6. DMS Auto-Verification Logic

### 6.1 Strategy: Check-on-Load + Event Subscription

Since the DMS event architecture is TBD (flagged as Ambiguity #1), we implement **check-on-load** as the baseline:

```
FUNCTION syncDocumentStatus(trx, instanceId, workflowId):

  1. FETCH all instance tasks WHERE completion_criteria = 'DOCUMENT'
  
  2. FETCH all documents from lending.documents WHERE owner_id = workflowId
  
  3. FOR each document_task:
     matchingDocs = documents.filter(d => d.document_type == task.document_type)
     
     IF matchingDocs.length > 0 AND task.status == 'PENDING':
       UPDATE task SET status = 'COMPLETED', completed_at = NOW()
       LOG audit: action = 'AUTO_COMPLETED_BY_DMS'
     
     ELSE IF matchingDocs.length == 0 AND task.status == 'COMPLETED' 
            AND task.completed_by_user_id IS NULL:  -- only revert auto-completions
       UPDATE task SET status = 'PENDING', completed_at = NULL
       LOG audit: action = 'REVERTED_BY_DMS_DELETION'
  
  4. RECALCULATE counters
```

This runs every time `getInstanceByWorkflowId` is called (i.e., every FAB open/refresh).

---

## 7. Maker-Checker Workflow Integration

### 7.1 New Work Type Registration

In `process_workflow.js`, add to `_getWorkDetailsFromWorkIdAndType`:

```javascript
else if (workType === lendingWorkType.CHECKLIST) {
  [entityDetails] = await getChecklistTemplateById(trx, entityId);
  entityDetails.id = entityDetails.id;
  entityDetails.page_link = `https://${urlPrefixByEnv[appEnv]}finance.dpworld.com/lending/checklist/template?id=${entityDetails.id}`;
}
```

Add to `_updateWorkItemDetails`:

```javascript
else if (workType === lendingWorkType.CHECKLIST) {
  await trx(`lending.checklist_templates`)
    .update(updateObject)
    .whereIn(`id`, entityId);
}
```

### 7.2 Workflow Seed Data

Two new workflows in `lending.workflow` table:

| workflow | user_role | priority |
|----------|-----------|----------|
| `CHECKLIST_CREDIT` | `CREDIT_ANALYST` | 1 |
| `CHECKLIST_CREDIT` | `HEAD_OF_CREDIT` | 2 |
| `CHECKLIST_APPLICATION` | `OPERATIONS_MAKER` | 1 |
| `CHECKLIST_APPLICATION` | `OPERATIONS_CHECKER` | 2 |

### 7.3 Config Constants

Add to `LENDING_WORK_TYPE`:
```javascript
CHECKLIST: 'CHECKLIST'
```

---

## 8. Role & Stage Locking — Enforcement Matrix

### 8.1 Task Interaction Decision Tree

```
CAN_INTERACT(user, task, workflowStage):
  
  IF user.isExternal AND task.owner_role != 'CLIENT':
    RETURN { visible: false, interactive: false }    -- Hide from portal
  
  IF task.owner_role IS NOT NULL AND user.role != task.owner_role:
    RETURN { visible: true, interactive: false }     -- Grey/disabled
  
  IF task.stage IS NOT NULL AND workflowStage != task.stage:
    RETURN { visible: true, interactive: false }     -- Grey/disabled, tooltip
  
  IF task.status == 'COMPLETED' AND workflowStage > task.stage:
    RETURN { visible: true, interactive: false }     -- Read-only after stage passes
  
  RETURN { visible: true, interactive: true }        -- Fully interactive
```

### 8.2 API Enforcement (403 Guard)

Every task mutation endpoint (complete, defer, accept, reject) includes:

```javascript
// In service layer, before any mutation:
const interactionCheck = _canInteract(userRole, task, currentWorkflowStage);
if (!interactionCheck.interactive) {
  throw new ForbiddenError(
    `Action not permitted. Task "${task.name}" is owned by ${task.owner_role} ` +
    `and actionable during ${task.stage} stage.`
  );
}
```

---

## 9. External Portal API — Double-Lock Filter

### 9.1 Query Pattern

```javascript
// db_service/checklist.js
getInstanceTasksForExternalPortal: async (trx, workflowId, workflowType) => {
  return trx
    .select('cit.*')
    .from('lending.checklist_instance_tasks AS cit')
    .join('lending.checklist_instances AS ci', 'ci.id', 'cit.instance_id')
    .where('ci.workflow_id', workflowId)
    .andWhere('ci.workflow_type', workflowType)
    .andWhere('cit.owner_role', 'CLIENT')      // LOCK 1: role filter
    .andWhereNull('cit.deleted_at');
}
```

The API response for external portal **never** contains tasks with `owner_role != 'CLIENT'`, including in any metadata, counts, or references.

### 9.2 Client Task State Machine

```
CLIENT submits → status = 'REVIEW_PENDING' (Orange)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
  INTERNAL ACCEPTS          INTERNAL REJECTS
  status = 'COMPLETED'     status = 'PENDING'
  (Green)                   (Back to client)
```

---

## 10. Notification Event Map

| Event ID | Trigger | Recipient | CC | Method | Module |
|----------|---------|-----------|-----|--------|--------|
| N1.1 | Template submitted for review | HOC / Ops Checker (by type) | Author | BELLANDEMAIL | 1 |
| N1.2 | Template approved | Author | — | BELLANDEMAIL | 1 |
| N1.3 | Template rejected | Author | — | BELLANDEMAIL | 1 |
| N1.4 | Template sent back | Author | — | BELLANDEMAIL | 1 |
| N2.1 | Ad-hoc task added | Task owner role | Creator | BELLANDEMAIL | 9 |
| N2.2 | Mandatory task deferred | HOC / Ops Checker | Risk Dept | BELLANDEMAIL | 8 |
| N3.1 | Mandatory document deleted | Task owner | Maker | BELLANDEMAIL | 3 |
| N5.1 | Overlapping template parameters | System Admin / Ops Lead | — | BELLANDEMAIL | 5 |
| N8.1 | Task deferred | CA group / Ops group | Current user | BELLANDEMAIL | 8 |
| N9.1 | Ad-hoc task assigned | Task owner role | Creator | BELLANDEMAIL | 9 |
| N10.1 | Client ad-hoc task created | Client user | Author | BELLANDEMAIL | 10 |

---

## 11. Joi Schema Specifications

### 11.1 `create_checklist_template.js`

```javascript
const Joi = require('@hapi/joi');

const taskSchema = Joi.object({
  name:                 Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(100).required(),
  description:          Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(256).required(),
  category:             Joi.string().valid('DOCUMENTATION','LEGAL','COMPLIANCE','CREDIT','OPERATIONAL','FINANCE').required(),
  is_mandatory:         Joi.boolean().default(false),
  owner_role:           Joi.string().optional().allow(null),
  stage:                Joi.string().required(),
  completion_criteria:  Joi.string().valid('DOCUMENT','INPUT_FIELD','UNDERTAKING','TEXT_RESPONSE').required(),
  document_category:    Joi.string().when('completion_criteria', { is: 'DOCUMENT', then: Joi.optional() }),
  document_type:        Joi.string().when('completion_criteria', { is: 'DOCUMENT', then: Joi.optional() }),
  add_to_master_list:   Joi.boolean().when('completion_criteria', { is: 'DOCUMENT', then: Joi.optional() }),
  field_id:             Joi.string().when('completion_criteria', { is: 'INPUT_FIELD', then: Joi.optional() }),
  declaration_text:     Joi.string().when('completion_criteria', { is: 'UNDERTAKING', then: Joi.required() }),
  effective_from:       Joi.date().optional().allow(null),
  effective_until:      Joi.date().optional().allow(null),
  additional_info:      Joi.string().max(10000).optional().allow(null, ''),
  sort_order:           Joi.number().integer().optional(),
});

const parameterSchema = Joi.object({
  parameter_type:       Joi.string().required(),
  parameter_value:      Joi.string().required(),
});

const schema = Joi.object({
  name:                 Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(100).required(),
  description:          Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(256).required(),
  workflow_type:        Joi.string().required(),
  tasks:                Joi.array().items(taskSchema).optional(),
  parameters:           Joi.array().items(parameterSchema).optional(),
});

module.exports = schema;
```

### 11.2 `defer_task.js`

```javascript
const Joi = require('@hapi/joi');

const schema = Joi.object({
  defer_until:          Joi.date().greater('now').required(),
  reason:               Joi.string().min(1).max(1000).required(),
});

module.exports = schema;
```

### 11.3 `create_adhoc_task.js`

```javascript
const Joi = require('@hapi/joi');

const schema = Joi.object({
  name:                 Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(100).required(),
  description:          Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(256).required(),
  category:             Joi.string().valid('DOCUMENTATION','LEGAL','COMPLIANCE','CREDIT','OPERATIONAL','FINANCE').required(),
  owner_role:           Joi.string().required(),
  completion_criteria:  Joi.string().valid('DOCUMENT','INPUT_FIELD','UNDERTAKING','TEXT_RESPONSE').required(),
  document_type:        Joi.string().optional(),
  field_id:             Joi.string().optional(),
  declaration_text:     Joi.string().optional(),
});

module.exports = schema;
```

---

## 12. Migration File Example

### `001_create_checklist_templates.js`

```javascript
'use strict';

exports.up = function(knex) {
  return knex.schema.withSchema('lending').createTable('checklist_templates', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('description', 256).notNullable();
    table.string('workflow_type', 100).notNullable();
    table.string('checklist_type', 20).notNullable();
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.string('active_user', 50);
    table.string('active_workflow', 100);
    table.string('author_user_id', 50).notNullable();
    table.string('author_org_id', 50).notNullable();
    table.string('author_role', 50).notNullable();
    table.text('checker_comments');
    table.integer('version').notNullable().defaultTo(1);
    table.integer('parent_template_id').references('id').inTable('lending.checklist_templates');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    table.index('status');
    table.index('workflow_type');
    table.index('checklist_type');
    table.index('author_user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('lending').dropTableIfExists('checklist_templates');
};
```

---

## 13. Config Constants File

### `backend/config/checklist_constants.js`

```javascript
'use strict';

module.exports = {
  CHECKLIST_TYPE: {
    CREDIT_FACILITY: 'CREDIT_FACILITY',
    APPLICATION: 'APPLICATION',
  },

  TEMPLATE_STATUS: {
    DRAFT: 'DRAFT',
    REVIEW_PENDING: 'REVIEW_PENDING',
    REJECTED: 'REJECTED',
    RESUBMISSION_PENDING: 'RESUBMISSION_PENDING',
    APPROVED: 'APPROVED',
  },

  TASK_CATEGORY: {
    DOCUMENTATION: 'DOCUMENTATION',
    LEGAL: 'LEGAL',
    COMPLIANCE: 'COMPLIANCE',
    CREDIT: 'CREDIT',
    OPERATIONAL: 'OPERATIONAL',
    FINANCE: 'FINANCE',
  },

  COMPLETION_CRITERIA: {
    DOCUMENT: 'DOCUMENT',
    INPUT_FIELD: 'INPUT_FIELD',
    UNDERTAKING: 'UNDERTAKING',
    TEXT_RESPONSE: 'TEXT_RESPONSE',
  },

  INSTANCE_TASK_STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    DEFERRED: 'DEFERRED',
    REVIEW_PENDING: 'REVIEW_PENDING',
    REJECTED_BY_INTERNAL: 'REJECTED_BY_INTERNAL',
  },

  CHECKLIST_WORKFLOWS: {
    CREDIT: 'CHECKLIST_CREDIT',
    APPLICATION: 'CHECKLIST_APPLICATION',
  },

  AUDIT_ACTIONS: {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SENT_BACK: 'SENT_BACK',
    COMPLETED: 'COMPLETED',
    ATTESTATION: 'ATTESTATION',
    DEFERRED: 'DEFERRED',
    AUTO_COMPLETED_BY_DMS: 'AUTO_COMPLETED_BY_DMS',
    REVERTED_BY_DMS_DELETION: 'REVERTED_BY_DMS_DELETION',
    ADHOC_CREATED: 'ADHOC_CREATED',
    ACCEPTED: 'ACCEPTED',
    REJECTED_CLIENT: 'REJECTED_CLIENT',
  },
};
```

---

## 14. File Summary

| Layer | File | Lines (est.) |
|-------|------|-------------|
| Route | `lending/routes/checklist.js` | ~120 |
| Controller | `lending/controllers/checklist.js` | ~350 |
| Controller | `lending/controllers/checklist_execution.js` | ~400 |
| Service | `lending/services/checklist/index.js` | ~500 |
| Service | `lending/services/checklist/execution.js` | ~650 |
| Service | `lending/services/checklist/notification.js` | ~200 |
| DB Service | `lending/services/db_service/checklist.js` | ~600 |
| Schemas (10) | `lending/schemas/checklist/*.js` | ~300 total |
| Migrations (7) | `db/migrations/v1.53.0/lending/migrations/*.js` | ~250 total |
| Constants | `config/checklist_constants.js` | ~60 |
| **TOTAL** | | **~3,430** |

---

*End of Low-Level Design*
