# ✋ CHECKPOINT 1: Requirements Analysis Document (Draft 2)

## Checklist Feature — Phase 1

**Status:** REVISED — PENDING REVIEW  
**Date:** 2026-03-05  
**PRD:** `prds/current.md`  
**Revision:** Draft 2 — incorporates all feedback from Draft 1

---

## Change Log from Draft 1

| # | Section | Change | Reason |
|---|---------|--------|--------|
| 1 | Assumption 1 | Changed DB schema from new `checklist` to existing `tradefinance` | Feedback: use tradefinance schema for checklist tables |
| 2 | Assumption 2 | Corrected: workflow types are defined in `config/settings.js` and resolved via `config.getConfig('WORKFLOW_TYPE')`, NOT in product_configuration table | Feedback: product_configuration has nothing to do with workflow types |
| 3 | Assumption 4 | Replaced async event subscription with API-driven approach | Feedback: DMS changes captured by UI, sent via checklist APIs at submission |
| 4 | Assumption 10 | Removed global fallback assumption | Feedback: unclear, skip for now |
| 5 | Ambiguity 1 → Resolved | Parameter types from `dynamicmodel` schema, `model_type = 'EXPOSURE'` | Feedback answer |
| 6 | Ambiguity 2 → Resolved | CF workflows = `CREDIT_*`, App workflows = `FINANCE_*` from WORKFLOW_TYPE config | Feedback answer |
| 7 | Ambiguity 3 → Resolved | Stages derived from `lending.workflow` rows per workflow, each priority level = a stage | Feedback answer |
| 8 | Ambiguity 4 → Deferred | Document Category/Type to be seeded later; created TODO | Feedback answer |
| 9 | Ambiguity 5 → Deferred | Input field list to be seeded pre-implementation; created TODO | Feedback answer |
| 10 | Ambiguity 6 → Resolved | Deep-copy sufficient; need history of user interactions with instances | Feedback answer |
| 11 | Ambiguity 7 → Resolved | Last-save-wins, no conflict detection needed | Feedback answer |
| 12 | Ambiguity 8 → Resolved | Same backend; lending = platform, arranging = client side. Checklist in `tradefinance` schema shared by both | Feedback answer — critical architecture point |
| 13 | Ambiguity 9 → Resolved | Email notifications only for Phase 1 | Feedback answer |
| 14 | Ambiguity 10 → Resolved | New dedicated permission codes for checklist operations | Decision made per feedback |
| 15 | Ambiguity 11 → Deferred | Document types not stored yet; skip master list feature | Feedback answer |
| 16 | Ambiguity 12 → Resolved | No deactivation; only Rejected or Approved terminal states | Feedback answer |
| 17 | Delta Analysis | Updated all references from `checklist.*` schema to `tradefinance.*` | Follows schema correction |
| 18 | Dependencies | Added `dynamicmodel` schema and `tf_common` schema references | New dependencies discovered |
| 19 | REQ-6 (DMS) | Simplified to API-driven approach instead of event subscription | Follows DMS clarification |

---

## PRD Summary

The PRD defines a **Checklist Service** for the CargoFin trade finance platform that operates in two phases: **Seeding** (template creation with maker-checker workflow approval) and **Execution** (runtime rendering as a Floating Action Button on Credit Facility and Application workflows). The service uses a **parameter-based aggregation engine** to match and merge multiple checklist templates into a single runtime "instance" per workflow, supporting task categories, role-based ownership, DMS auto-verification, deferral management, ad-hoc task injection, undertaking/attestation tasks, and external client portal visibility. **Module 6 (Data Deviation & Comparison) is explicitly deferred to Phase 2.**

---

## Requirement Breakdown

### REQ-1: Template (Checklist) CRUD with Maker-Checker Workflow (Module 1)

- **Description:** Credit Analysts create CF-related checklists; Operations Makers create Application-related checklists. Each checklist has name, description, workflow binding, parameter type/values, and N tasks. Requires maker-checker approval (CA→HOC for CF; OM→OC for App).
- **Existing capability:** The `lending.workflow` table and `processWorkflow()` service manage state-machine workflows. The `lending.skipflow` table handles skip conditions. Notification service exists (`@lending/services/notification_service`). Workflow types are defined in `config/settings.js` via `config.getConfig('WORKFLOW_TYPE')` — CF workflows are prefixed `CREDIT_*` and application workflows are prefixed `FINANCE_*`.
- **Gap:** Entirely new domain — no checklist tables, routes, controllers, services, or schemas exist. New workflow type constants needed (e.g. `CHECKLIST_CF_APPROVAL`, `CHECKLIST_APP_APPROVAL`) added to `settings.js`. New DB tables in `tradefinance` schema for templates, tasks, parameters. Maker-checker workflow state seeding for both CF and Application paths.
- **Complexity:** **High**

### REQ-2: Task Schema with Completion Criteria Types (Module 1, 7, 9)

- **Description:** Each task has: Category (Documentation/Legal/Compliance/Credit/Operational/Finance), Name, Description, Owner (role), Stage, Mandatory flag, Completion Criteria (Document/Input Field/Undertaking), Effective From/Until dates, Additional Info (rich text up to 10K chars), Sample Document. Undertaking tasks carry legal weight and require immutable audit trail of the exact declaration text.
- **Existing capability:** Document type management exists in `lending.loan_documents_product_info` and DMS. User roles/departments exist in `FINANCE_DEPARTMENT_TYPES` config (CREDIT_ANALYST, OPERATIONS_MAKER, OPERATIONS_CHECKER, etc.).
- **Gap:** New `tradefinance.checklist_template_tasks` table with all task fields. Task category enum. Completion criteria types need distinct handling logic. Undertaking-specific audit trail with immutable declaration text snapshots. Stage field derived from `lending.workflow` priority records per workflow type.
- **Complexity:** **High**

### REQ-3: Parameter-Based Aggregation Engine (Module 5)

- **Description:** Templates are matched to workflows via parameter types sourced from Group Exposure. The engine performs a UNION of all matching templates, de-duplicates tasks by name, and applies "strictest rule" (Mandatory wins over Optional). Multiselect parameters use OR logic within a parameter group.
- **Existing capability:** Parameter types are dynamically fetched from `dynamicmodel.master_model_details` and `dynamicmodel.model_field_details` where `model_type = 'EXPOSURE'`. The `getDynamicFieldsService()` in `dynamic_field_model/index.js` already retrieves these. Exposure control service and `COMP_PARAMETER` component provide the dropdown values.
- **Gap:** Entirely new aggregation logic. New `tradefinance.checklist_template_parameters` table with parameter_type and parameter_values. Query optimization with indexing. Union + de-duplication + mandatory override algorithm.
- **Complexity:** **High**

### REQ-4: Checklist Instance Lifecycle (Module 2, 11)

- **Description:** When a workflow (CF/Application) is created, the system deep-copies all matched templates into a checklist "instance" bound to the workflow_id. The instance is a snapshot — template changes don't affect existing instances. Instances persist state (complete, deferred, pending) against the workflow_id. Role-based and stage-based interaction locking. Last-save-wins concurrency for same-role conflicts. History of all user interactions with an instance must be maintained.
- **Existing capability:** State transaction patterns exist in `lending.state_transactions`. Workflow ID binding patterns exist in finance applications. The `tf_common.workflow_instance` table provides a reference pattern for instance-based workflow tracking.
- **Gap:** New `tradefinance.checklist_instances` and `tradefinance.checklist_instance_tasks` tables. Deep-copy logic at workflow creation. Instance isolation from template. Stage-gate enforcement. Interaction history logging per instance.
- **Complexity:** **High**

### REQ-5: FAB Execution Interface (Module 2)

- **Description:** Collapsed FAB shows `${mandatory_completed}/${total_mandatory}` counter. Expanded FAB shows category tabs (only if category has tasks), accordion task expansion, auto-check for Document/Input Field criteria, manual check for Undertaking. Gatekeeper blocks submission if mandatory tasks incomplete.
- **Existing capability:** Backend provides data; frontend rendering is out of scope for this analysis.
- **Gap:** New API endpoints: get instance by workflow_id, update task status, get completion summary, validate gatekeeper. The gatekeeper hook needs integration into existing CF/Application submission flows.
- **Complexity:** **Medium** (backend portion)

### REQ-6: DMS Integration & Auto-Verification (Module 3)

- **Description:** Checklist tracks document upload/deletion for task auto-verification. When a document matching the required Document Type is uploaded for a workflow_id, the corresponding task is auto-checked. Deletion reverts the task to incomplete. Context-aware upload pre-selects and locks the Document Type. Ad-hoc document uploads are scoped to the instance only.
- **Existing capability:** Document service exists at `@lending/services/document_service`. Document upload/download routes exist.
- **Gap:** API-driven approach: the frontend captures checklist task completions (including document uploads) and sends status updates via checklist APIs at each stage submission. Backend needs endpoints for task status updates, document-task linking, and a verification check that can be triggered when processing a submission. "Add to Master Document Types" feature is **deferred** (document types not currently stored in the system).
- **Complexity:** **Medium** (reduced from High since no event subscription needed)

### REQ-7: Digital Coach — Guidance & Navigation (Module 4)

- **Description:** Rich-text rendering of Additional Info (SOP guidance). Golden Sample document links with pre-signed URLs opening in new tabs. Scroll Spy maps tasks to form fields for section-level navigation.
- **Existing capability:** Pre-signed URL generation exists in document service. Rich text stored as plain text; rendering is frontend.
- **Gap:** Backend stores field-to-task mappings as JSON in the task record. Golden Sample storage (single file per task, JPG/PNG/PDF up to 10MB) uses existing document service. All scroll spy and rendering behavior is frontend only.
- **Complexity:** **Low** (backend portion)

### REQ-8: Deferral Management (Module 8)

- **Description:** Mandatory tasks can be deferred with a future Target Date and Reason. Deferred status satisfies gatekeeper (treated same as Completed). Deferred tasks remain in checklist — can later transition to Completed if requirement is met. Each deferral update creates an immutable audit log entry.
- **Existing capability:** State transition logging exists in `lending.state_transactions` and `tf_common.workflow_state_transaction`.
- **Gap:** Deferral fields on instance tasks (deferred_until, deferral_reason, deferred_by, deferred_at). Deferral audit trail. Gatekeeper formula: `Can_Submit = All Mandatory Tasks are (COMPLETED OR DEFERRED)`. Notification event N8.1 on deferral.
- **Complexity:** **Medium**

### REQ-9: Ad-Hoc Task Injection — Ask Management (Module 9)

- **Description:** Users can add transaction-specific tasks to an instance (never to template). Ad-hoc tasks reuse the same schema as template tasks. All ad-hoc tasks are Mandatory by default. Only the assigned Owner role can complete the task. Zero-propagation rule: saved only to instance_tasks table.
- **Existing capability:** None specific.
- **Gap:** Ad-hoc task creation endpoint. Instance-level isolation enforcement (writes to `tradefinance.checklist_instance_tasks` only, never to template tables). Default mandatory flag. Role-based actionability. Notification event N9.1.
- **Complexity:** **Medium**

### REQ-10: External Client Portal Integration (Module 10)

- **Description:** Client-facing portal shows only tasks where Owner = "Client". Double-lock API filter (workflow_id + owner_role). Client completion triggers "Review Pending" status — not auto-completed. Internal user must Accept/Reject. Submission blocked while client tasks are Pending/Review Pending/Rejected.
- **Existing capability:** Same backend serves both lending (platform/LMS) and arranging (client) sides. Different schemas per side: `lendingcreditfacility` (platform) vs `creditfacility` (client), `lendingfinance` (platform) vs `logisticsfinance` (client). The checklist data in `tradefinance` schema is shared across both sides.
- **Gap:** New client-facing API endpoints with strict role filtering. Review handshake state machine (Pending → Review Pending → Accepted/Rejected). Extended gatekeeper logic for client task states. Notification N10.1 only for ad-hoc client-assigned tasks.
- **Complexity:** **High**

### REQ-11: Role Visibility & Locking (Module 11)

- **Description:** All internal users can see all tasks (transparency). Tasks are only interactive for matching owner_role at matching workflow_stage. Stage-gate: once workflow advances, previous stage owners become read-only. Every interaction (upload, check, defer) persists immediately. API-level security: 403 for role-mismatch task completion attempts.
- **Existing capability:** Role-based access patterns exist in `getUserAllowedDetailsForWorkflow()`. State transaction logging exists.
- **Gap:** Checklist-specific role/stage intersection logic. Immediate persistence on interaction. API-level 403 enforcement for task operations. Passive view rendering data (grey/disabled indicators via API flags).
- **Complexity:** **Medium**

### REQ-12: Notification Events (Modules 1, 2, 3, 5, 8, 9, 10)

- **Description:** Multiple notification events: N1.1-N1.4 (template workflow), N2.1-N2.2 (execution), N3.1 (doc deleted), N5.1 (template conflict), N8.1 (deferral), N9.1 (ad-hoc assigned), N10.1 (client ad-hoc).
- **Existing capability:** Full notification infrastructure exists: `sendNotification()`, `sendEmailNotification()`, email templates in `notifications.email_notification_templates`.
- **Gap:** New email templates for each event. Recipient resolution logic per event type. Integration with existing notification service. **Email channel only for Phase 1** (no bell notifications).
- **Complexity:** **Medium**

### REQ-13: Checklist List View with Filters (Module 1)

- **Description:** Main checklist module shows all checklists with filters: Date range, Type (Application/CF), Status, Created By, Workflow name.
- **Existing capability:** List/filter patterns exist extensively in credit_facility and finance_application controllers.
- **Gap:** New list endpoint with filter support. New DB queries for filtered checklist retrieval.
- **Complexity:** **Low**

---

## Delta Analysis

### What Already Exists and Can Be Reused

| Component | File/Pattern | Reuse For |
|-----------|-------------|-----------|
| Workflow state machine | `lending.workflow` table + `processWorkflow()` | Checklist maker-checker approval flow |
| Skip workflow | `lending.skipflow` table | Auto-skip conditions for checklist workflow |
| Notification service | `@lending/services/notification_service/index.js` | All notification events (email only) |
| State transactions | `lending.state_transactions` table | Audit trail pattern reference |
| Document service | `@lending/services/document_service/index.js` | File upload for sample documents, DMS integration |
| User role resolution | `getUserAllowedDetailsForWorkflow()` | Role-based access control |
| Recipient resolution | `getUserDeptListForEmail()` | Notification recipient lists |
| Joi validation | `@utils/joi_validation` | All endpoint input validation |
| Error handling | `respondError()` + custom error classes | All controller error handling |
| Caching | `@utils/cache` (Redis) | Parameter value lookups, config caching |
| History/audit | `lending.history` table + `addHistory()` | Checklist change audit trail |
| Dynamic model service | `dynamicmodel` schema + `dynamic_field_model/index.js` | Parameter types for aggregation engine (model_type = 'EXPOSURE') |
| Workflow types config | `config/settings.js` → `config.getConfig('WORKFLOW_TYPE')` | CF workflow names (`CREDIT_*`) and App workflow names (`FINANCE_*`) |
| tf_common workflow patterns | `tf_common.workflow_instance`, `tf_common.workflow_state_transaction` | Reference patterns for instance lifecycle and state tracking |

### What is Net-New

| Component | Description |
|-----------|-------------|
| `tradefinance.checklist_templates` table | Template header: name, description, workflow, status, created_by, type (CF/APP) |
| `tradefinance.checklist_template_tasks` table | Task definitions within a template |
| `tradefinance.checklist_template_parameters` table | Parameter type/value bindings per template |
| `tradefinance.checklist_instances` table | Runtime copies bound to workflow_id |
| `tradefinance.checklist_instance_tasks` table | Runtime task copies + status + deferral + ad-hoc flag |
| `tradefinance.checklist_instance_task_audit` table | Immutable audit trail for undertakings, deferrals, and all user interactions |
| Checklist routes | `backend/src/lending/routes/checklist.js` |
| Checklist controller | `backend/src/lending/controllers/checklist.js` |
| Checklist service | `backend/src/lending/services/checklist/index.js` |
| Checklist DB service | `backend/src/lending/services/db_service/checklist.js` |
| Aggregation engine | `backend/src/lending/services/checklist/aggregation_engine.js` |
| Checklist Joi schemas | `backend/src/lending/schemas/checklist/*.js` |
| Email templates | New templates for N1.1–N10.1 events |
| Workflow type constants | New entries in `config/settings.js` WORKFLOW_TYPE object |
| Permission codes | `CHECKLIST_CREATE`, `CHECKLIST_APPROVE`, `CHECKLIST_VIEW`, `CHECKLIST_EXECUTE`, `CHECKLIST_DEFER` |

### What Needs Modification

| Component | File | Change |
|-----------|------|--------|
| Workflow type config | `backend/config/settings.js` | Add new CHECKLIST workflow types to WORKFLOW_TYPE object |
| Workflow table seeding | New migration | Seed `lending.workflow` rows for checklist approval state transitions |
| Skip flow seeding | New migration | Seed `lending.skipflow` for checklist workflow skip conditions |
| CF submission flow | `lending/services/credit_facility/index.js` | Add gatekeeper hook to check checklist completeness before submit |
| Finance App submission flow | `lending/services/finance_application/index.js` | Add gatekeeper hook to check checklist completeness before submit |
| Route registration | `backend/config/routes.js` or lending route loader | Register new checklist routes |

---

## Assumptions (Revised)

1. **DB schema: `tradefinance`.** All new checklist tables will be created in the existing `tradefinance` PostgreSQL schema, keeping them co-located with other shared platform data.

2. **Workflow type registration.** New WORKFLOW_TYPE constants (e.g. `CHECKLIST_CF_APPROVAL`, `CHECKLIST_APP_APPROVAL`) will be added to `config/settings.js` under the WORKFLOW_TYPE configuration key, and corresponding rows will be seeded in `lending.workflow` to define the state transitions.

3. **User roles mapping.** PRD role → system role: "Credit Analyst" = `CREDIT_ANALYST`; "Head of Credit" = `CREDIT_MANAGER` (or equivalent HOC role); "Operations Maker" = `OPERATIONS_MAKER`; "Operations Checker" = `OPERATIONS_CHECKER`; "Client" = external user type on arranging side.

4. **DMS interaction model (API-driven).** No event subscription or webhook system is needed. The frontend captures checklist task completions (including document uploads via existing DMS flows) and sends the updated task statuses to the backend via dedicated checklist APIs at each stage submission. The backend validates and persists these status changes.

5. **Scroll Spy field mapping.** Stored as a JSON configuration in the task record (`field_mapping` column). The actual scrolling/navigation behavior is entirely frontend. Backend only stores and serves the mapping.

6. **Rich text storage.** Additional Info (up to 10K chars) stored as plain text in the DB. Rich-text rendering (bold, bullets, etc.) is a frontend concern.

7. **Sample document storage.** Uses the existing document service — uploaded to S3, reference stored in the task record as a document_id.

8. **Effective From/Until logic.** Checked against **Workflow Creation Date** (not current date) per the PRD's explicit "Gotcha" note.

9. **Instance creation timing.** Checklist instances are created eagerly at workflow (CF/Application) creation time — not lazy-loaded.

10. **No new npm packages required.** All functionality built with existing dependencies (Knex, Joi, etc.).

11. **Module 6 (Data Deviation) fully excluded** from Phase 1 implementation scope.

12. **Notifications: Email only** for Phase 1. Bell notifications may be added later.

13. **Concurrency: Last-save-wins.** No conflict detection or optimistic locking needed.

14. **No template deactivation.** Checklists can only reach Rejected or Approved as terminal states. No deactivation flow needed.

15. **Shared data across platform and client.** Checklist service and data in `tradefinance` schema is shared between lending (platform/LMS) and arranging (client) sides. The same backend serves both, using different route prefixes and schemas per side.

16. **Template versioning not needed.** The deep-copy at instance creation provides sufficient isolation. User interaction history with instances will be stored in a dedicated audit table.

---

## Resolved Ambiguities

| # | Question | Resolution | Source |
|---|----------|-----------|--------|
| 1 | Parameter types source | Dynamically fetched from `dynamicmodel.master_model_details` and `dynamicmodel.model_field_details` where `model_type = 'EXPOSURE'`. Seeded via migrations. Existing `getDynamicFieldsService(db, 'EXPOSURE')` retrieves them. | Feedback |
| 2 | Workflow names for dropdown | Existing `WORKFLOW_TYPE` values from `config/settings.js`. CF workflows = `CREDIT_*` prefix; Application workflows = `FINANCE_*` prefix. | Feedback |
| 3 | Stage dropdown for tasks | Derived from `lending.workflow` table records per workflow type. Each row has a `priority` (1, 2, ...) and `user_role`. Each priority level represents a stage in the lifecycle. For example, `FINANCE_DISBURSEMENT` might have priority 1 = OPERATIONS_MAKER and priority 2 = OPERATIONS_CHECKER. | Feedback |
| 4 | Document Category/Type | **Deferred (TODO).** Document categories and types are to be seeded at a later stage. No existing API found. Will create a TODO for this. | Feedback |
| 5 | Input Field list | **Deferred (TODO).** Input fields will be seeded before implementation phase. Backend will store the field reference in the task; actual list population deferred to later. | Feedback |
| 6 | Template versioning | Deep-copy at instance creation is sufficient. Additionally, all user interactions with a checklist instance (task completion, deferral, undoing, etc.) will be recorded in `tradefinance.checklist_instance_task_audit`. | Feedback |
| 7 | Concurrent editing | Last-save-wins approach. No conflict detection required. | Feedback |
| 8 | Client Portal API | Same backend (CargoFin_Backend). Platform/LMS side = "lending" (schemas: `lendingcreditfacility`, `lendingfinance`). Client/arranging side = "arranging" (schemas: `creditfacility`, `logisticsfinance`). Checklist data lives in `tradefinance` schema, shared by both sides. | Feedback — critical |
| 9 | Notification channel | Email only for Phase 1. | Feedback |
| 10 | Permission model | New dedicated permission codes: `CHECKLIST_CREATE`, `CHECKLIST_APPROVE`, `CHECKLIST_VIEW`, `CHECKLIST_EXECUTE`, `CHECKLIST_DEFER`. Separate from existing CF/Application permissions for cleaner RBAC and easier auditing. | Decision (feedback delegated) |
| 11 | "Add to Master Document Types" | **Deferred.** Document types are not currently stored in the system. This feature is skipped for Phase 1. | Feedback |
| 12 | Template deactivation | Not required. Only Rejected or Approved as terminal states. No deactivation workflow. | Feedback |

---

## Open TODOs (Deferred Items)

| # | Item | When | Notes |
|---|------|------|-------|
| TODO-1 | Document Category and Document Type seeding for completion criteria | Pre-implementation (later stage) | Need seed migration + API for CRUD |
| TODO-2 | Input Field list seeding for Scroll Spy / Input Field completion criteria | Pre-implementation phase | Fields must be seeded before checklist execution can reference them |
| TODO-3 | "Add to Master Document Types" feature | Future phase | Document types not yet stored in system |

---

## Dependencies

### External Systems

| System | Integration Point | Direction |
|--------|------------------|-----------|
| DMS (Document Management) | File upload via existing document service; task status updates via checklist APIs | Backend receives status from frontend |
| S3 (via Document Service) | Sample document storage, Golden Sample pre-signed URLs | Outbound |
| Redis | Parameter value caching, config caching | Internal |

### Internal Modules

| Module | Dependency | Reason |
|--------|-----------|--------|
| Credit Facility module | `lending/services/credit_facility/index.js` | Gatekeeper hook on CF submission/approval |
| Finance Application module | `lending/services/finance_application/index.js` | Gatekeeper hook on Application submission |
| Process Workflow | `lending/services/process_workflow/index.js` | Checklist template approval workflow |
| Notification Service | `lending/services/notification_service/index.js` | Email notification events |
| Document Service | `lending/services/document_service/index.js` | Sample document uploads |
| Dynamic Field Model | `lending/services/dynamic_field_model/index.js` | Parameter types for aggregation engine (EXPOSURE model) |
| Auth/User Object | `middlewares/user_object.js` | User context (role, orgId, userId) |
| Config (settings.js) | `config/settings.js` via `config.getConfig()` | WORKFLOW_TYPE constants, LENDING_USERS, FINANCE_DEPARTMENT_TYPES |

### Database

| Table/Schema | Role |
|-------------|------|
| `lending.workflow` | Workflow state machine entries + stage definitions (priority-based) |
| `lending.skipflow` | Skip conditions for checklist workflow |
| `lending.state_transactions` | Audit trail pattern reference |
| `lending.history` | Change history pattern reference |
| `dynamicmodel.master_model_details` | Parameter type definitions (model_type = 'EXPOSURE') |
| `dynamicmodel.model_field_details` | Parameter field definitions and dropdown values |
| `tradefinance.documents` | Document reference pattern |
| `tradefinance.*` (new tables) | All new checklist tables |
| `notifications.email_notification_templates` | Email template definitions |

---

## Risk Assessment

### Technical Risks

1. **Aggregation engine performance.** The UNION + de-duplication query for multiple parameter-matched templates at workflow creation time could be slow if there are many templates. **Mitigation:** Index parameter columns; single query to fetch all relevant templates; consider Redis caching of frequently matched template sets.

2. **Gatekeeper integration coupling.** Hooking into existing CF and Finance Application submission flows creates tight coupling. If the checklist service is down, submissions could be blocked. **Mitigation:** Configurable feature flag to enable/disable gatekeeper check.

3. **Deep-copy data volume.** If templates have many tasks and many workflows are created simultaneously, the deep-copy operation could generate significant database load. **Mitigation:** Batch inserts within a single transaction; limit tasks per template via validation.

4. **Stage mapping accuracy.** Deriving stages from `lending.workflow` priority records requires accurate mapping between workflow types and their priority levels. Workflow definitions may vary across environments. **Mitigation:** Validate stage mappings at template creation time; reject invalid stage references.

5. **Cross-side data consistency.** Since checklist data in `tradefinance` is shared between lending and arranging sides, any schema changes must be compatible with both API paths. **Mitigation:** Thorough testing of both platform and client API paths; shared Joi schemas for validation.

### Backward Compatibility

- **No breaking changes to existing endpoints** — all checklist functionality is additive.
- **Gatekeeper hook behind a feature flag** so existing CF/Application flows continue working before checklist is seeded.
- **New migration files only** — no modification to existing migrations.
- **Existing `lending.workflow` table structure preserved** — only new rows inserted for checklist workflow types.

### Data Integrity

- **Instance immutability.** Template changes never retroactively affect existing instances. Enforced by deep-copy design.
- **Undertaking audit trail.** Declaration text snapshotted at sign-time, stored in immutable audit table.
- **Deferral audit trail.** Each deferral action creates a new audit entry (append-only).
- **Interaction history.** All user interactions with an instance are logged with user_id, role, timestamp, and action details.

---

## Scope Confirmation — Modules In/Out

| Module | In Scope (Phase 1) | Notes |
|--------|-------------------|-------|
| Module 1: Governance & Configuration | ✅ Yes | Full CRUD + maker-checker workflow |
| Module 2: Execution Interface (FAB) | ✅ Yes | Backend APIs only; frontend is separate |
| Module 3: DMS & Auto-Verification | ✅ Yes | API-driven (frontend sends status at submission) |
| Module 4: Digital Coach | ✅ Yes | Backend storage/serving only |
| Module 5: Parameter Config & Aggregation | ✅ Yes | Core aggregation engine using dynamicmodel parameters |
| Module 6: Data Deviation & Comparison | ❌ **Phase 2** | Explicitly excluded per PRD |
| Module 7: Undertaking | ✅ Yes | Part of task completion criteria types |
| Module 8: Deferral Management | ✅ Yes | Simplified Phase 1 version |
| Module 9: Ask Management | ✅ Yes | Ad-hoc task injection |
| Module 10: External Integration | ✅ Yes | Client portal API (shared backend, tradefinance schema) |
| Module 11: Role Visibility & Locking | ✅ Yes | Role/stage enforcement |

---

**⛔ STOP — Awaiting Human Review (Draft 2)**

Please:
- Confirm the feedback has been correctly incorporated
- Flag any remaining concerns
- Approve to proceed to Checkpoint 2 (Architecture & Design)
