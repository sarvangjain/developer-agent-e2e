# Requirements Analysis — Checklist Feature Phase 1

## PRD Summary

The Checklist Feature introduces a system-led verification layer for the CargoFin lending platform. It operates in two phases: a **Seeding Phase** where Credit Analysts and Operations Makers configure checklist templates with parameterized tasks, and an **Execution Phase** where approved templates are instantiated as FAB (Floating Action Button) panels on Credit Facility and Application workflows. The feature covers 10 in-scope modules (Module 6: Data Deviation is deferred to Phase 2), encompassing template CRUD with maker-checker approval, runtime checklist rendering, DMS auto-verification, digital coaching/scroll-spy, parameter-based aggregation, undertaking declarations, deferral management, ad-hoc task injection, client portal integration, and role-based visibility locking.

---

## Requirement Breakdown

### REQ-1: Checklist Template CRUD (Module 1 — Governance & Configuration)

- **Existing capability:** No checklist tables or services exist. However, robust CRUD patterns exist across the codebase (exposure_control, credit_facility, dynamic_field_model). Maker-checker workflow infrastructure is mature via `processWorkflow()` and `lending.workflow` table seeding.
- **Gap:** Entirely new schema (`checklist_templates`, `checklist_template_tasks`), new CRUD service/controller/routes, new Joi validation schemas, new workflow type seeding for `CHECKLIST_CF` and `CHECKLIST_APP`, role-based workflow filtering (CA sees CF workflows, Ops Maker sees Application workflows), notification templates.
- **Complexity:** **High** — involves new schema, workflow seeding, role-gated business logic, parameter configuration (reusing Group Exposure parameter patterns), and document master list injection with dedup.

### REQ-2: Maker-Checker Workflow for Templates (Module 1)

- **Existing capability:** `processWorkflow()` in `lending/services/process_workflow/index.js` handles state transitions. `lending.workflow` and `lending.skipflow` tables define state machines. Notification service (`lending/services/notification_service/`) sends bell + email notifications. `lending.state_transactions` tracks state changes.
- **Gap:** New workflow type constants (`CHECKLIST_CF_ASSESSMENT`, `CHECKLIST_APP_ASSESSMENT`), new rows in `lending.workflow` for checklist-specific state transitions (Draft → Review Pending → Approved/Rejected/Resubmission), new notification templates (N1.1–N1.4), integration with `getUserDeptListForEmail()`.
- **Complexity:** **Medium** — follows well-established patterns; primarily configuration + wiring.

### REQ-3: Checklist Instance Creation & Parameter Aggregation (Module 5 — Rules Engine)

- **Existing capability:** `lending.exposure_terms_details` stores `parameter_values` as JSON and has parameter matching logic. `dynamicmodel.master_model_details` has parameter/field configuration patterns.
- **Gap:** New aggregation engine that, on workflow creation, queries all active approved templates matching the workflow's metadata (product, country, counterparty, etc.), performs UNION merging with de-duplication (strictest-mandatory-wins), and creates a deep-copy instance. Instance isolation (template changes must not affect existing instances). Global fallback template logic. Indexed parameter search optimization.
- **Complexity:** **High** — core algorithmic logic, multi-parameter matching with OR within groups and UNION across templates, de-duplication with mandatory override.

### REQ-4: Execution Interface / FAB (Module 2)

- **Existing capability:** This is primarily a frontend concern (Angular). Backend needs APIs to serve checklist instance data, update task status, and enforce the gatekeeper. No existing FAB or checklist-instance APIs exist.
- **Gap:** New APIs: get checklist instance by workflow ID, update task status (complete/uncomplete), get task details, category-tab aggregation. Gatekeeper hook: API to validate if all mandatory tasks are completed/deferred before workflow submission. Backend state management for task completion tracking.
- **Complexity:** **High** — many API endpoints, real-time state management, gatekeeper integration with existing workflow submission endpoints.

### REQ-5: DMS Auto-Verification (Module 3)

- **Existing capability:** `lending.documents` tracks documents with `document_type` and `owner_id`/`owner_type`. Document upload/delete services exist in `lending/services/document_service/`. No event/webhook system for DMS state changes currently exists.
- **Gap:** Observer pattern: checklist service must listen for document upload/delete events. Auto-check/uncheck task based on document type + workflow ID matching. Reversion on deletion. Manual override capability. Metadata-locked upload (auto-populate document type when uploading from checklist panel).
- **Complexity:** **High** — requires event-driven state synchronization between DMS and checklist service. May need Service Bus events or direct integration hooks.

### REQ-6: Digital Coach / Scroll Spy (Module 4)

- **Existing capability:** No scroll-spy or guidance infrastructure exists. The existing codebase has rich-text fields in various places.
- **Gap:** Primarily frontend. Backend needs: API to serve additional info / sample document URLs, pre-signed URL generation for golden samples, field-mapping data (which UI field each task maps to). Sample document storage/retrieval.
- **Complexity:** **LOW** (backend) — mostly serving static data. Heavy lift is on Angular frontend.

### REQ-7: Undertaking / Declarations (Module 7)

- **Existing capability:** No undertaking/attestation model exists. Workflow stage awareness exists via `processWorkflow()`.
- **Gap:** New task type `UNDERTAKING` with manual-only completion, stage-gate enablement (task becomes interactive only at matching workflow stage), role-locking enforcement, audit trail logging (immutable snapshot of declaration text + user + timestamp).
- **Complexity:** **Medium** — extends the task model with special completion logic and stage-gate rules.

### REQ-8: Deferral Management (Module 8)

- **Existing capability:** No deferral model exists. The gatekeeper concept is new.
- **Gap:** Deferral status on tasks with reason + target date. Gatekeeper logic: `DEFERRED` counts as `COMPLETED` for submission. Future-date validation. Audit trail for deferral events. Notification N8.1 on mandatory task deferral. Post-deferral resolution (deferred → completed when doc uploaded).
- **Complexity:** **Medium** — straightforward state extension with validation rules.

### REQ-9: Ad-Hoc Task Injection / Ask Management (Module 9)

- **Existing capability:** No ad-hoc task system exists.
- **Gap:** API to create ad-hoc tasks on a checklist *instance* (never template). Reuse same task schema. Default mandatory. Role-based actionability (only task owner can complete). Notification N9.1. Zero-propagate rule enforcement.
- **Complexity:** **Low-Medium** — reuses existing task schema, mainly new insert/validation logic.

### REQ-10: External Integration / Client Portal (Module 10)

- **Existing capability:** The platform has an external/arranging API layer (`lending/services/arranging_platform_service/`). Role-based filtering exists in various services.
- **Gap:** New client-facing API endpoint with strict role-based filtering (only `Client`-owned tasks visible). Review handshake workflow (client completes → `REVIEW_PENDING` → internal Accept/Reject). Notification N10.1 for client-assigned ad-hoc tasks. API security (double-lock filter).
- **Complexity:** **Medium-High** — new API surface with security implications, review handshake state machine.

### REQ-11: Role Visibility & Locking (Module 11)

- **Existing capability:** User role resolution exists via `getUserAllowedDetailsForWorkflow()`, `getUserDeptListForEmail()`, and middleware `user_object.js`. Permission system with `PERM_CODE` on routes.
- **Gap:** Stage-gate enforcement on checklist tasks (tasks become read-only after stage progresses). Role-locking at API level (403 if wrong role attempts task completion). Concurrency handling (last-in-wins or warning). Passive view rendering support.
- **Complexity:** **Medium** — extends existing role/permission patterns into the checklist domain.

---

## Delta Analysis

### What already exists and can be reused:

- `processWorkflow()` — state machine engine for maker-checker approval flow
- `lending.workflow` + `lending.skipflow` — workflow state definition tables
- `lending.state_transactions` — state change audit trail
- `lending/services/notification_service/` — bell + email notification sending
- `getUserDeptListForEmail()` — role-based notification recipient resolution
- `lending/services/document_service/` — document upload/download infrastructure
- `lending.documents` table — document storage with type + owner tracking
- `lending/services/db_service/helpers.js` — upsert, select utilities
- `exposure_terms_details.parameter_values` — JSON parameter storage pattern
- `dynamicmodel` — configurable field model patterns
- Joi validation infrastructure (`@utils/joi_validation`)
- Error handling classes (`ArgumentError`, `ForbiddenError`, etc.)
- Module alias imports (`@lending`, `@config`, `@utils`, etc.)
- `tf_common.workflow_definition` / `workflow_instance` — newer generic workflow pattern (potential reuse for checklist workflow)

### What is net-new:

- Entire `checklist` schema (5–8 new tables)
- Checklist template CRUD service, controller, routes
- Checklist instance creation and aggregation engine
- Checklist execution APIs (task status, gatekeeper, FAB data)
- DMS ↔ Checklist event synchronization
- Deferral management service
- Ad-hoc task injection service
- Client portal checklist API
- Stage-gate enforcement layer
- Undertaking audit trail
- 4+ new Joi validation schemas
- 6+ new notification templates
- 2 new workflow type definitions + seeding

### What needs modification:

- Workflow submission endpoints (Credit Facility + Finance Application) — add gatekeeper hook
- `processWorkflow()` or workflow helpers — add checklist workflow type handling
- `config/product_config` — add new `WORKFLOW_TYPE` constants for checklist
- Notification config files — add checklist notification templates
- Document upload service — add event/hook for checklist auto-verification
- Document delete handling — add checklist status reversion

---

## Assumptions

1. **Backend-only scope for this agent:** The PRD describes significant Angular frontend work (FAB, scroll-spy, expanded panel). This implementation covers the **backend API layer only**. Frontend work is handled separately.

2. **`lending` schema:** New checklist tables will be created under a new `checklist` schema (or under `lending` if preferred). I'm assuming a new `checklist` schema for clean separation.

3. **Existing workflow types config:** The `WORKFLOW_TYPE` config already contains types like `CREDIT_ASSESSMENT`, `CREDIT_UPDATE`, etc. New checklist types will follow the same pattern.

4. **Parameter types from Group Exposure:** The "Parameter Type" dropdown (Counterparty, Facility, Country, Product) reuses the same parameter taxonomy already defined in the `dynamicmodel.master_model_details` or exposure control configuration.

5. **Document types master list:** A global document types reference table exists (or will be created) that the "Add to Master List" feature writes to. Currently `lending.documents` tracks `document_type` as free text — a normalization table may need to be introduced.

6. **User roles mapping:** The PRD roles map to existing system roles: Credit Analyst → `CA`, Head of Credit → `HOC`, Operations Maker → `OPERATIONS`/`MAKER`, Operations Checker → `CHECKER`. The exact role codes will need confirmation.

7. **Module 6 (Data Deviation) is fully excluded.** No variance analysis, arithmetic comparison, or traffic-light logic will be built.

8. **Single-file sample documents** are stored via the existing document service infrastructure (S3-backed).

9. **"Workflow" dropdown** in the seeding phase refers to `WORKFLOW_TYPE` constants from the product config (e.g., `CREDIT_ASSESSMENT`, `FINANCE_DISBURSAL`), not dynamic workflow instances.

10. **Instance creation is triggered at workflow initiation** — when a new Credit Facility or Finance Application workflow begins, the system automatically creates a checklist instance by aggregating matching templates.

---

## Ambiguities (Questions for You)

1. **Schema location:** Should the new checklist tables live under the existing `lending` schema, a new dedicated `checklist` schema, or under `tf_common` (which already has generic workflow tables)?

2. **Parameter types:** The PRD says "ENUM dropdown based on the Group Exposure Parameters." Can you confirm the exact parameter types? From `exposure_terms_details`, I see `parameter_values` stored as JSON. Are these: Product Type, Country, Counterparty, Credit Facility, Client Type? Are there others?

3. **Role codes:** The PRD mentions Credit Analyst, Head of Credit, Operations Maker, Operations Checker, and Client. What are the exact role codes in the existing system? From the codebase I see `CA`, `HOC`, `CM`, `OPERATIONS`, `CHECKER`, `LEGAL`, `SALES`. Which map to the PRD personas, and is "Client" an existing role?

4. **Workflow type dropdown values:** What specific workflow types should appear for Credit Analysts vs. Operations Makers? For example, should CA see `CREDIT_ASSESSMENT`, `CREDIT_UPDATE`, `CREDIT_RENEW`? Should Ops Maker see `FINANCE_DISBURSAL`, `FINANCE_SETTLEMENT`, etc.? I need the exact list per role.

5. **Document types master table:** Currently `document_type` in `lending.documents` is free text. Is there an existing master lookup table for document types, or should we create one? The PRD's "Add to Master Document Types" implies a reference table with normalized dedup.

6. **Instance creation trigger point:** Where exactly in the existing workflow flow should checklist instance creation be hooked? Is it when `processWorkflow()` first runs for a new entity, or at a different step (e.g., when a CF moves to a specific status)?

7. **Completion Criteria "Input Field":** The PRD says the input field dropdown should "dynamically fetch the list of field labels from the respective workflow's schema." Is there an existing registry of UI field IDs/labels, or does this need to be built (e.g., a `data-checklist-id` registry table)?

8. **Client Portal:** Is the client portal a separate Angular app with its own API gateway, or does it share the same backend? How does authentication work for external clients?

9. **Concurrency model (Module 11):** The PRD mentions handling concurrent edits by same-role users. Should we implement optimistic locking (version column), last-write-wins, or a warning mechanism?

10. **Sample document storage:** Should golden sample documents be stored via the existing `lending.documents` / S3 infrastructure, or is there a separate storage path for reference/template documents?

---

## Dependencies

### External Systems:

- **Azure Service Bus** — for DMS event synchronization (document upload/delete events)
- **S3 / Document Service** — for sample document storage and golden sample retrieval (pre-signed URLs)
- **Oracle Fusion** — no direct dependency (checklist is orthogonal to accounting)

### Internal Modules:

- **Process Workflow** (`lending/services/process_workflow/`) — for maker-checker checklist approval flow
- **Notification Service** (`lending/services/notification_service/`) — for all checklist notifications (N1.1–N10.1)
- **Document Service** (`lending/services/document_service/`) — for DMS auto-verification integration
- **Credit Facility Service** (`lending/services/credit_facility/`) — gatekeeper hook on CF submission
- **Finance Application Service** (`lending/services/finance_application/`) — gatekeeper hook on application submission
- **Exposure Control / Dynamic Model** — for parameter type taxonomy reference
- **User/Org middleware** (`middlewares/user_object.js`) — for role resolution and user context

### Database (existing tables involved):

- `lending.workflow` — seeding new checklist workflow types
- `lending.skipflow` — skip conditions for checklist workflows
- `lending.state_transactions` — audit trail for checklist state changes
- `lending.documents` — DMS integration for auto-verification
- `lending.notifications` — bell notifications
- `dynamicmodel.master_model_details` — parameter type reference

---

## Risk Assessment

1. **Blast Radius on Workflow Submission (HIGH):** The gatekeeper logic modifies the behavior of existing CF and Application submission endpoints. A bug could block all submissions platform-wide. **Mitigation:** Feature flag on gatekeeper enforcement; fallback to bypass if checklist service errors.

2. **Performance — Aggregation Engine (MEDIUM):** The parameter-based template aggregation runs on every workflow creation. With many templates and complex parameter combinations, this could add latency. **Mitigation:** Index parameter columns; consider caching active templates; design the query to be a single DB roundtrip.

3. **DMS Event Reliability (MEDIUM):** Auto-verification depends on reliably detecting document uploads/deletes. If events are missed, task status becomes inconsistent. **Mitigation:** Consider polling fallback alongside event-driven approach; add a "refresh" action on the checklist panel.

4. **Instance Isolation (MEDIUM):** Template changes must not retroactively affect existing instances. Deep-copy logic must be bulletproof. **Mitigation:** Snapshot all template + task data into instance tables at creation time; never join instance data back to template tables at runtime.

5. **Schema Migration Volume (LOW-MEDIUM):** This feature introduces 5–8 new tables with multiple indexes and foreign keys. Migrations must be carefully ordered and rollback-safe. **Mitigation:** Separate migration files per table; test rollback in staging.

6. **Role Mapping Complexity (LOW):** The PRD introduces a nuanced role matrix (Owner vs. Contributor vs. Approver vs. View-Only) that doesn't perfectly map to the existing flat role system. **Mitigation:** Clarify role codes upfront (Ambiguity #3); may need a checklist-specific role-permission mapping.

7. **No Existing Checklist Patterns (LOW):** This is an entirely new subsystem with no prior art in the codebase. No PRD history was found. **Mitigation:** Lean heavily on existing patterns (exposure_control for CRUD, processWorkflow for maker-checker, notification_service for alerts) and treat the parameter aggregation engine as the primary novel component requiring extra testing.

---

**⛔ CHECKPOINT 1 COMPLETE — AWAITING APPROVAL**

Please review and:
- Confirm requirements are correctly understood
- Answer the 10 ambiguities above
- Correct any wrong assumptions
- Add any missing requirements

I will not proceed to Checkpoint 2 (Module Decomposition) until I receive your explicit approval.
