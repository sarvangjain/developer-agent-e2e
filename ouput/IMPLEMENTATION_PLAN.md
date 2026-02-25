# Checklist Service — Phase 1 Implementation Plan

**Feature:** Trade Finance Checklist Service (Phase 1)
**PRD Date:** 14-Jan-26 (v0.4 — 15-Feb-26)
**Module:** Lending
**Status:** Planning — Awaiting Approval

---

## 1. Scope Summary (Phase 1 — Backend Only)

Phase 1 covers PRD Modules 1, 2, 3, 4, 5, 7, 8, 9, 10, and 11.
**Module 6 (Data Deviation & Comparison) is explicitly excluded** per PRD.

The backend must deliver:

- **Template Management (Seeding):** CRUD + maker-checker workflow for checklist templates and tasks.
- **Parameter-Based Aggregation Engine:** Match and merge templates into instances at workflow creation time.
- **Execution Instance Lifecycle:** Deep-copy instantiation, FAB counter data, task completion tracking.
- **DMS Auto-Verification:** Subscribe to document events, auto-tick/un-tick tasks.
- **Deferral Management:** Defer mandatory tasks, gatekeeper unblock logic.
- **Ad-hoc Task Injection (Ask Management):** Instance-level task creation, zero-propagation rule.
- **Undertaking Tasks:** Stage-gated, role-locked manual attestation with immutable audit trail.
- **External Portal Integration:** Role-filtered API for client portal, manual accept/reject handshake.
- **Role Visibility & Locking:** Stage-driven, role-driven interaction states for all tasks.
- **Notifications:** Bell + email notifications for all lifecycle events.

---

## 2. Files to Create

### 2.1 Routes
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/lending/routes/checklist.js` | All checklist template management & execution endpoints |

### 2.2 Controllers
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/lending/controllers/checklist.js` | Template CRUD, workflow actions, listing/filtering |
| 2 | `backend/src/lending/controllers/checklist_execution.js` | Instance retrieval, task completion, deferral, ad-hoc tasks, gatekeeper check |

### 2.3 Services
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/lending/services/checklist/index.js` | Template lifecycle business logic (create, update, submit, approve, reject, send-back) |
| 2 | `backend/src/lending/services/checklist/execution.js` | Instance creation (aggregation engine), task completion, deferral, ad-hoc injection |
| 3 | `backend/src/lending/services/checklist/notification.js` | Checklist-specific notification message builders |

### 2.4 DB Services
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/lending/services/db_service/checklist.js` | All Knex queries for checklist templates, tasks, parameters, instances, instance tasks, deferrals, audit log |

### 2.5 Schemas (Joi Validation)
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/lending/schemas/checklist/create_checklist_template.js` | Validate template creation payload |
| 2 | `backend/src/lending/schemas/checklist/update_checklist_template.js` | Validate template update payload |
| 3 | `backend/src/lending/schemas/checklist/create_task.js` | Validate task creation within template |
| 4 | `backend/src/lending/schemas/checklist/update_task.js` | Validate task update |
| 5 | `backend/src/lending/schemas/checklist/checklist_workflow_action.js` | Validate submit/approve/reject/send-back payloads |
| 6 | `backend/src/lending/schemas/checklist/complete_task.js` | Validate task completion (text response, undertaking) |
| 7 | `backend/src/lending/schemas/checklist/defer_task.js` | Validate deferral payload (date, reason) |
| 8 | `backend/src/lending/schemas/checklist/create_adhoc_task.js` | Validate ad-hoc task injection |
| 9 | `backend/src/lending/schemas/checklist/list_checklists.js` | Validate filter/list query params |
| 10 | `backend/src/lending/schemas/checklist/accept_reject_client_task.js` | Validate internal accept/reject for client-submitted tasks |

### 2.6 Migrations
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/db/migrations/v1.53.0/lending/migrations/001_create_checklist_templates.js` | Templates table |
| 2 | `backend/db/migrations/v1.53.0/lending/migrations/002_create_checklist_template_tasks.js` | Template tasks table |
| 3 | `backend/db/migrations/v1.53.0/lending/migrations/003_create_checklist_template_parameters.js` | Template parameters table |
| 4 | `backend/db/migrations/v1.53.0/lending/migrations/004_create_checklist_instances.js` | Workflow-bound instances table |
| 5 | `backend/db/migrations/v1.53.0/lending/migrations/005_create_checklist_instance_tasks.js` | Instance tasks (deep copies + ad-hoc) |
| 6 | `backend/db/migrations/v1.53.0/lending/migrations/006_create_checklist_task_deferrals.js` | Deferral records with audit trail |
| 7 | `backend/db/migrations/v1.53.0/lending/migrations/007_create_checklist_audit_log.js` | Undertaking attestation log + general audit |

### 2.7 Config / Constants
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/config/checklist_constants.js` | Enums: statuses, categories, completion criteria, roles |

---

## 3. Files to Modify

| # | File Path | What to Change |
|---|-----------|----------------|
| 1 | `backend/src/lending/routes/index.js` (or route loader) | Register new `checklist.js` route file |
| 2 | `backend/config/config.js` | Add `CHECKLIST_*` config keys if needed (or use `product_config`) |
| 3 | `backend/src/lending/services/db_service/process_workflow.js` | Add `CHECKLIST` case to `_getWorkDetailsFromWorkIdAndType` and `_updateWorkItemDetails` for maker-checker integration |
| 4 | `backend/config/product_config/configs/COMMON_PRODUCT.config.js` | Add `CHECKLIST_TASK_CATEGORIES`, `CHECKLIST_COMPLETION_CRITERIA`, `CHECKLIST_STATUSES` enums |
| 5 | `backend/src/lending/services/process_workflow/index.js` | Register `CHECKLIST` as a new `workType` that can be processed through the existing `processWorkflow` function |

---

## 4. Patterns to Follow

| Pattern | Source File | Notes |
|---------|-------------|-------|
| **Route definition** | `backend/src/lending/routes/exposure_control.js` | Plain object exports with `method`, `path`, `function`, optional `middlewares` and `permission` |
| **Controller structure** | `backend/src/lending/controllers/exposure_control.js` | `try/catch`, `respondError`, `joiValidation.validate`, header extraction via `config.getConfig('HEADER.*')` |
| **Service layer** | `backend/src/lending/services/exposure_control/index.js` | Business logic, calls db_service, calls notification_service, transaction handling |
| **DB service** | `backend/src/lending/services/db_service/exposure_control.js` | Pure Knex queries, `(trx, params)` signature |
| **Maker-checker workflow** | `backend/src/lending/services/process_workflow/index.js` + `backend/src/lending/services/db_service/process_workflow.js` | `processWorkflow(trx, entityId, workflow, workType, action, notes, ...)` pattern, `_updateWorkItemDetails`, `_getWorkDetailsFromWorkIdAndType`, `insertStateTransactions` |
| **Notification** | `backend/src/lending/services/notification_service/index.js` | `sendNotification(trx, usersOrgsToNotify, ownerId, ownerType, message, type='BELLANDEMAIL', ...)` |
| **Joi schemas** | `backend/src/lending/schemas/credit_facility/set_credit_facility_details.js` | Standard Joi.object exports |
| **History/Audit** | `backend/src/lending/services/common/history.js` | `generateHistoryDiff(flowType, workFlow, idMapping, trx, db, ...)` |
| **Error handling** | `backend/src/errors/` | `APIError`, `ArgumentError`, `JoiSchemaError`, `ForbiddenError`, `NotFoundError` |

---

## 5. Test Plan

| Area | Test Type | What to Test |
|------|-----------|--------------|
| Schema validation | Unit | All 10 Joi schemas — valid input, missing mandatory fields, boundary values |
| Template CRUD | Unit + Integration | Create, read, update template; add/update/remove tasks; parameter assignment |
| Maker-checker flow | Integration | Submit → approve, submit → reject, submit → send-back → resubmit → approve |
| Instance creation (aggregation) | Unit + Integration | Parameter matching (union), de-duplication, mandatory override, global fallback, validity date filtering |
| Task completion | Unit | Document auto-check, input field auto-check, undertaking manual check, role enforcement |
| Deferral | Unit | Gatekeeper unblock, future-date validation, post-deferral resolution |
| Ad-hoc tasks | Integration | Zero-propagate rule (never pollutes template), mandatory-by-default, role-based actionability |
| External portal API | Integration | Double-lock filtering (workflow_id + owner_role=Client), accept/reject handshake |
| Role & stage locking | Unit | Role mismatch returns 403, stage-gate enforcement |
| Notifications | Unit | Correct recipients, message content per event type |
| Gatekeeper | Integration | Submit blocked when mandatory tasks incomplete; enabled when all completed/deferred |
| Instance isolation | Integration | Template changes after instantiation don't affect existing instances |

**Tooling:** Jest, `jest.mock` for external dependencies, test DB transactions for integration tests.
**Coverage target:** 80%

---

## 6. Assumptions

1. **The existing `processWorkflow` engine will be extended** to support a new `CHECKLIST` work type for maker-checker, rather than building a separate workflow system. This is consistent with how Exposure Control, Credit Notes, and Financial Assessments were integrated.

2. **"Workflow" dropdown values** (New Facility, Limit Update, Disbursal, Renewal, etc.) are already seeded in the existing `lending.workflow` table or `product_config`. The checklist will reference these by key/ID.

3. **"Parameter Type" values** (Counterparty, Facility, Country, Product, etc.) correspond to existing Group Exposure parameter types already in the system. The checklist service will query these from `lending.exposure_terms_details` or equivalent lookup tables.

4. **DMS integration** will use the existing `lending.documents` table's events or a polling mechanism. If the DMS doesn't emit webhook events today, Phase 1 will use a "check-on-load" strategy (verify document presence when the FAB is opened or refreshed) rather than real-time push.

5. **Sample document upload** for templates will reuse the existing `document_service/file_storage_service.js` pattern with S3 storage.

6. **"Add to Master Document Types"** will insert into a `lending.document_type_master` table (to be created) with normalized-string duplicate checking.

7. **Scroll Spy / `data-checklist-id`** is a frontend concern. The backend will store field IDs as strings in the task schema; frontend mapping is out of scope for this plan.

8. **Notification templates** will follow the existing email template pattern (`simple_text_email_template_18apr23`) with `MESSAGE` variable substitution. No new email templates need to be registered externally — we'll use the generic text template.

9. **The Client Portal** already has an API layer that can be extended. The new checklist endpoints will have a separate route group with an `isExternal=true` flag or a dedicated route file for portal-facing APIs.

10. **Instance persistence** uses `lending` schema in PostgreSQL, consistent with all other lending tables.

---

## 7. Ambiguities (Require Human Clarification)

| # | Question | Impact |
|---|----------|--------|
| 1 | **DMS Event Mechanism:** Does the current DMS emit real-time events (webhooks, Service Bus messages) on FILE_UPLOADED/FILE_DELETED? Or do we need to build polling? | Determines auto-verification architecture (Module 3). If no events exist, we'll implement check-on-load + periodic polling. |
| 2 | **Parameter Type Source:** Where exactly do the "Group Exposure Parameters" (Counterparty, Facility, Country, etc.) live in the DB today? Is it `lending.exposure_terms_details`, a config table, or product_config? | Impacts the parameter dropdown API and aggregation engine queries. |
| 3 | **Workflow Dropdown Values:** Should the checklist "Workflow" dropdown pull from `lending.workflow` table (distinct workflow names) or from a separate configuration/product_config? | Affects seeding-phase dropdown API. |
| 4 | **External Client Portal Architecture:** Is the client portal a separate Express app with its own auth, or does it share the same backend with role-based middleware filtering? | Determines whether Module 10 needs a separate route file or just additional middleware guards. |
| 5 | **Rich-Text Storage (Additional Info):** The PRD specifies rich-text rendering (bold, italics, bullets). Should the backend store HTML, Markdown, or a structured format (e.g., ProseMirror JSON)? | Affects the `additional_info` column type and validation. |
| 6 | **Maker-Checker for Credit vs. Operations Path:** Should both paths (Credit Analyst → HOC, Ops Maker → Ops Checker) use the **same** `lending.workflow` definition with different workflow names, or separate workflow mechanisms? | Affects how we register the workflows in the process_workflow engine. |
| 7 | **"Add to Master List" Approval Flow:** The PRD says document types added via checklist appear immediately in the global dropdown (no separate approval). Is this confirmed? Any risk of abuse? | Determines whether this needs a soft-review mechanism. |
| 8 | **Concurrent Editing (Module 11, AC 11.5):** The PRD mentions "Last-In-Wins" for concurrent access. Should we implement optimistic locking (`updated_at` check) or truly allow last-write-wins? | Affects the update queries for task completion. |
| 9 | **Version for migrations:** Should the new migration folder be `v1.53.0` or a different version? | Naming convention for the migration directory. |
| 10 | **New npm packages:** Are there any pre-approved packages for rich-text sanitization (e.g., `sanitize-html`, `DOMPurify`) or should we build basic sanitization in-house? Per agent rules, no new packages without flagging. | Affects Additional Info field handling. |

---

## ⛔ STOP — Awaiting Approval

This plan is ready for review. **No code will be written until explicit approval is given.** Please review:

1. The scope alignment with PRD modules
2. The file structure and naming
3. The pattern choices (especially the processWorkflow extension approach)
4. The assumptions (especially #1, #4, #6)
5. The ambiguities that need resolution

Once approved, implementation will proceed file-by-file following the patterns cited above.
