# ✋ CHECKPOINT 1: Requirements Analysis Document

## Checklist Feature — Phase 1

**Status:** PENDING REVIEW  
**Date:** 2026-02-26  
**PRD:** `prds/current.md`

---

## PRD Summary

The PRD defines a **Checklist Service** for the CargoFin trade finance platform that operates in two phases: **Seeding** (template creation with maker-checker workflow approval) and **Execution** (runtime rendering as a Floating Action Button on Credit Facility and Application workflows). The service uses a **parameter-based aggregation engine** to match and merge multiple checklist templates into a single runtime "instance" per workflow, supporting task categories, role-based ownership, DMS auto-verification, deferral management, ad-hoc task injection, undertaking/attestation tasks, and external client portal visibility. **Module 6 (Data Deviation & Comparison) is explicitly deferred to Phase 2.**

---

## Requirement Breakdown

### REQ-1: Template (Checklist) CRUD with Maker-Checker Workflow (Module 1)
- **Description:** Credit Analysts create CF-related checklists; Operations Makers create Application-related checklists. Each checklist has name, description, workflow binding, parameter type/values, and N tasks. Requires maker-checker approval (CA→HOC for CF; OM→OC for App).
- **Existing capability:** The `lending.workflow` table and `processWorkflow()` service already manage state-machine workflows for CF and Finance Applications. The `lending.skipflow` table handles skip conditions. Notification service exists (`@lending/services/notification_service`).
- **Gap:** Entirely new domain — no checklist tables, routes, controllers, services, or schemas exist. New workflow type constants needed for `CHECKLIST_CF_APPROVAL` and `CHECKLIST_APP_APPROVAL`. New DB tables for `checklist_templates`, `checklist_template_tasks`, `checklist_template_parameters`. Maker-checker workflow state seeding for both CF and Application paths.
- **Complexity:** **High**

### REQ-2: Task Schema with Completion Criteria Types (Module 1, 7, 9)
- **Description:** Each task has: Category (Documentation/Legal/Compliance/Credit/Operational/Finance), Name, Description, Owner (role), Stage, Mandatory flag, Completion Criteria (Document/Input Field/Undertaking), Effective From/Until dates, Additional Info (rich text up to 10K chars), Sample Document. Undertaking tasks carry legal weight and require immutable audit trail of the exact declaration text.
- **Existing capability:** Document type management exists in `lending.loan_documents_product_info` and DMS. User roles/departments exist in `FINANCE_DEPARTMENT_TYPES` config.
- **Gap:** New `checklist_template_tasks` table with all task fields. New `checklist_task_categories` enum. Completion criteria types need distinct handling logic. Undertaking-specific audit trail with immutable declaration text snapshots.
- **Complexity:** **High**

### REQ-3: Parameter-Based Aggregation Engine (Module 5)
- **Description:** Templates are matched to workflows via parameter types (Counterparty, Facility, Country, Product, etc.) sourced from Group Exposure. The engine performs a UNION of all matching templates, de-duplicates tasks by name, and applies "strictest rule" (Mandatory wins over Optional). Supports global fallback templates (no parameters = applies to all). Multiselect parameters use OR logic within a parameter group.
- **Existing capability:** `exposure_terms_details` table and exposure control service exist. Group Exposure parameters are available in the existing system.
- **Gap:** Entirely new aggregation logic. New `checklist_template_parameters` table with parameter_type and parameter_values. Query optimization with indexing. Union + de-duplication + mandatory override algorithm.
- **Complexity:** **High**

### REQ-4: Checklist Instance Lifecycle (Module 2, 11)
- **Description:** When a workflow (CF/Application) is created, the system deep-copies all matched templates into a checklist "instance" bound to the workflow_id. The instance is a snapshot — template changes don't affect existing instances. Instances persist state (complete, deferred, pending) against the workflow_id. Role-based and stage-based interaction locking. Last-in-wins concurrency for same-role conflicts.
- **Existing capability:** State transaction patterns exist in `lending.state_transactions`. Workflow ID binding patterns exist in finance applications.
- **Gap:** New `checklist_instances` and `checklist_instance_tasks` tables. Deep-copy logic at workflow creation. Instance isolation from template. Stage-gate enforcement. Concurrency handling.
- **Complexity:** **High**

### REQ-5: FAB Execution Interface (Module 2)
- **Description:** Collapsed FAB shows `${mandatory_completed}/${total_mandatory}` counter. Expanded FAB shows category tabs (only if category has tasks), accordion task expansion, auto-check for Document/Input Field criteria, manual check for Undertaking. Gatekeeper blocks submission if mandatory tasks incomplete.
- **Existing capability:** Frontend concern mostly, but backend must provide APIs for: task status, completion counters, category grouping, gatekeeper validation endpoint.
- **Gap:** New API endpoints: get instance by workflow_id, update task status, get completion summary, validate gatekeeper. The gatekeeper hook needs integration into existing CF/Application submission flows.
- **Complexity:** **Medium** (backend portion)

### REQ-6: DMS Integration & Auto-Verification (Module 3)
- **Description:** Checklist subscribes to DMS events (FILE_UPLOADED, FILE_DELETED). Auto-checks Document tasks when matching Document Type is uploaded for the workflow_id. Reverts to incomplete on deletion. Context-aware upload auto-populates Document Type. Ad-hoc document uploads are scoped to instance only (not global DMS master).
- **Existing capability:** Document service exists at `@lending/services/document_service`. Document upload/download routes exist. Document types exist in `lending.loan_documents_product_info`.
- **Gap:** Event subscription mechanism (webhook or polling) for DMS changes. Auto-verification state sync logic. "Add to Master Document Types" feature with normalized string duplicate check. Context-aware upload with locked Document Type.
- **Complexity:** **High**

### REQ-7: Digital Coach — Guidance & Navigation (Module 4)
- **Description:** Rich-text rendering of Additional Info (SOP guidance). Golden Sample document links with pre-signed URLs opening in new tabs. Scroll Spy maps tasks to form field `data-checklist-id` attributes for section-level navigation with visual highlight.
- **Existing capability:** Pre-signed URL generation exists in document service. Rich text storage is supported.
- **Gap:** Field mapping configuration (task ↔ form field ID). Scroll Spy is primarily frontend. Backend needs to store and serve field-to-task mappings. Golden Sample storage (single file per task, JPG/PNG/PDF up to 10MB).
- **Complexity:** **Low** (backend portion — mostly frontend)

### REQ-8: Deferral Management (Module 8)
- **Description:** Mandatory tasks can be deferred with a future Target Date and Reason. Deferred status satisfies gatekeeper (treated same as Completed). Deferred tasks remain in checklist — can later transition to Completed if requirement is met. Each deferral update creates an immutable audit log entry.
- **Existing capability:** State transition logging exists in `lending.state_transactions`.
- **Gap:** Deferral fields on instance tasks (deferred_until, deferral_reason, deferred_by, deferred_at). Deferral audit trail. Gatekeeper formula: `Can_Submit = All Mandatory Tasks are (COMPLETED OR DEFERRED)`. Notification event N8.1 on deferral.
- **Complexity:** **Medium**

### REQ-9: Ad-Hoc Task Injection — Ask Management (Module 9)
- **Description:** Users can add transaction-specific tasks to an instance (never to template). Ad-hoc tasks reuse the same schema as template tasks. All ad-hoc tasks are Mandatory by default. Only the assigned Owner role can complete the task. Zero-propagation rule: saved only to instance_tasks table.
- **Existing capability:** None specific.
- **Gap:** Ad-hoc task creation endpoint. Instance-level isolation enforcement. Default mandatory flag. Role-based actionability. Notification event N9.1.
- **Complexity:** **Medium**

### REQ-10: External Client Portal Integration (Module 10)
- **Description:** Client-facing portal shows only tasks where Owner = "Client". Double-lock API filter (workflow_id + owner_role). Client completion triggers "Review Pending" (Orange) status — not auto-completed. Internal user must Accept/Reject. Submission blocked while client tasks are Pending/Review Pending/Rejected.
- **Existing capability:** External API patterns exist (public routes in the codebase). Role-based filtering exists.
- **Gap:** New client-facing API endpoint with strict role filtering. Review handshake state machine (Pending → Review Pending → Accepted/Rejected). Extended gatekeeper logic for client task states. Notification N10.1 only for ad-hoc client-assigned tasks.
- **Complexity:** **High**

### REQ-11: Role Visibility & Locking (Module 11)
- **Description:** All internal users can see all tasks (transparency). Tasks are only interactive for matching owner_role at matching workflow_stage. Stage-gate: once workflow advances, previous stage owners become read-only. Every interaction (upload, check, defer) persists immediately. API-level security: 403 for role-mismatch task completion attempts.
- **Existing capability:** Role-based access patterns exist in `getUserAllowedDetailsForWorkflow()`. State transaction logging exists.
- **Gap:** Checklist-specific role/stage intersection logic. Immediate persistence on interaction. API-level 403 enforcement for task operations. Passive view rendering data (grey/disabled indicators).
- **Complexity:** **Medium**

### REQ-12: Notification Events (Modules 1, 2, 3, 5, 8, 9, 10)
- **Description:** Multiple notification events across modules: N1.1-N1.4 (template workflow), N2.1-N2.2 (execution), N3.1 (doc deleted), N5.1 (template conflict), N8.1 (deferral), N9.1 (ad-hoc assigned), N10.1 (client ad-hoc).
- **Existing capability:** Full notification infrastructure exists: `sendNotification()`, `sendEmailNotification()`, bell notifications, email templates.
- **Gap:** New notification templates for each event. Recipient resolution logic per event type. Integration with existing notification service.
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
| Notification service | `@lending/services/notification_service/index.js` | All N*.* notification events |
| State transactions | `lending.state_transactions` table | Audit trail for task actions |
| Document service | `@lending/services/document_service/index.js` | File upload for sample documents, DMS integration |
| Document types | `lending.loan_documents_product_info` | Master document type list |
| User role resolution | `getUserAllowedDetailsForWorkflow()` | Role-based access control |
| Recipient resolution | `getUserDeptListForEmail()` | Notification recipient lists |
| Joi validation | `@utils/joi_validation` | All endpoint input validation |
| Error handling | `respondError()` + custom error classes | All controller error handling |
| Caching | `@utils/cache` (Redis) | Parameter value lookups, config caching |
| Product config | `commons.product_configuration` | New checklist-specific config constants |
| History/audit | `lending.history` table + `addHistory()` | Checklist change audit trail |
| Exposure parameters | `lending.exposure_terms_details` | Reference for Group Exposure parameter types |

### What is Net-New
| Component | Description |
|-----------|-------------|
| `checklist` schema (DB) | New PostgreSQL schema to house all checklist tables |
| `checklist_templates` table | Template header: name, description, workflow, status, created_by |
| `checklist_template_tasks` table | Task definitions within a template |
| `checklist_template_parameters` table | Parameter type/value bindings per template |
| `checklist_instances` table | Runtime copies bound to workflow_id |
| `checklist_instance_tasks` table | Runtime task copies + status + deferral + ad-hoc tasks |
| `checklist_instance_task_audit` table | Immutable audit trail for undertakings and deferrals |
| Checklist routes | `backend/src/lending/routes/checklist.js` |
| Checklist controller | `backend/src/lending/controllers/checklist.js` |
| Checklist service | `backend/src/lending/services/checklist/index.js` |
| Checklist DB service | `backend/src/lending/services/db_service/checklist.js` |
| Aggregation engine service | `backend/src/lending/services/checklist/aggregation_engine.js` |
| Checklist Joi schemas | `backend/src/lending/schemas/checklist/*.js` |
| Notification templates | New email/bell templates for N1.1–N10.1 |
| Workflow type constants | `CHECKLIST_CF_APPROVAL`, `CHECKLIST_APP_APPROVAL` |
| Permission codes | New permission codes for checklist CRUD and execution |

### What Needs Modification
| Component | File | Change |
|-----------|------|--------|
| Workflow type config | `COMMON_PRODUCT.config.js` or product_config DB | Add CHECKLIST workflow types |
| Workflow table seeding | New migration | Seed `lending.workflow` rows for checklist approval states |
| Skip flow seeding | New migration | Seed `lending.skipflow` for checklist skip conditions |
| CF submission flow | `credit_facility` service | Add gatekeeper hook to check checklist completeness before submit |
| Finance App submission flow | `finance_application` service | Add gatekeeper hook to check checklist completeness before submit |
| Document service | `document_service/index.js` | Hook for notifying checklist service on upload/delete events |
| Route registration | `backend/src/lending/routes/index.js` or equivalent | Register new checklist routes |
| Master document types | `loan_documents_product_info` related service | "Add to Master List" injection with duplicate check |

---

## Assumptions

1. **New DB schema:** A new `checklist` PostgreSQL schema will be created to keep checklist tables isolated from existing `lending` and `lendingcreditfacility` schemas.
2. **Workflow type registration:** New WORKFLOW_TYPE constants will be added to the product_configuration table (not hardcoded config files), following existing patterns.
3. **User roles mapping:** "Credit Analyst" maps to existing `CREDIT_ANALYST` in `FINANCE_DEPARTMENT_TYPES`; "Head of Credit" maps to `CREDIT_MANAGER`; "Operations Maker" maps to `OPERATIONS_MAKER`; "Operations Checker" maps to `OPERATIONS_CHECKER`. The PRD's "Client" role maps to existing external user types.
4. **DMS event subscription:** Since no existing webhook/event system for DMS changes exists, we will implement a **synchronous check pattern** — when documents are uploaded/deleted via existing endpoints, the checklist service is notified in the same transaction rather than via async events (Phase 1 simplification).
5. **Scroll Spy field mapping:** The `data-checklist-id` → form field mapping will be stored as a JSON configuration in the task record. The actual scrolling behavior is purely frontend.
6. **Rich text storage:** Additional Info (up to 10K chars) will be stored as plain text in the DB. Rich-text rendering is a frontend concern (HTML/Markdown interpretation).
7. **Sample document storage:** Uses the existing document service — uploaded to S3 via the existing document upload pipeline, with a reference stored in the task record.
8. **Effective From/Until logic:** Checked against **Workflow Creation Date** (not current date) per the PRD's explicit "Gotcha" note.
9. **Instance creation timing:** Checklist instances are created at workflow creation time (not lazy-loaded on first FAB open).
10. **Global fallback templates:** Templates with no parameters are included in every instance for their workflow type.
11. **No new npm packages required** — all functionality can be built with existing dependencies (Knex, Joi, etc.).
12. **Module 6 (Data Deviation) is fully excluded** from Phase 1 implementation scope.

---

## Ambiguities

1. **Parameter types source:** The PRD references "Group Exposure Parameters" (Counterparty, Facility, Country, Product). What is the **exhaustive list** of parameter types? Is it fetched dynamically from the `exposure_terms_details` table, or is it a fixed enum?

2. **Workflow names for dropdown:** The PRD says "If Credit Analyst → show Credit Facility Workflows" and "If Operations Maker → show Application Workflows." What are the exact workflow names to display? Are these the existing `WORKFLOW_TYPE` values (e.g., `CREDIT_ASSESSMENT`, `NEW_APPLICATION`, `DISBURSAL`, `LIMIT_UPDATE`), or a curated subset?

3. **Stage dropdown for tasks:** The task "Stage" field is a "Dropdown of Workflow Lifecycle stage." What are the exact stage values for each workflow? Are these the existing workflow priority/state values, or new ones?

4. **Document Category and Document Type:** When Completion Criteria = Document, the PRD says "Document Category and Document Type should be rendered conditionally." Are these fetched from the existing `loan_documents_product_info` table? What's the relationship between Category and Type?

5. **"Input Field" completion criteria:** The PRD mentions "Input Field" as a completion type with a Scroll Spy link. How is the list of available form fields provided to the seeding phase? Is this a hardcoded field registry per workflow type, or dynamically fetched from a JSON schema?

6. **Template versioning:** The PRD mentions "Instance Isolation" (AC 5.5 — existing instances don't change when template is modified). Does the system need to maintain template version history, or is the deep-copy at instance creation sufficient?

7. **Concurrent editing:** The PRD mentions "Last-In-Wins" for concurrent same-role access. Is a simple optimistic concurrency approach acceptable (last save wins), or do we need conflict detection/warning?

8. **Client Portal API separation:** Is the client portal served by the same backend (CargoFin_Backend) with different route prefixes, or is it a separate microservice that calls our API? This affects how we implement the "Double Lock" filter.

9. **Notification channel:** Should checklist notifications use BELL only, EMAIL only, or BOTH? The existing notification service supports both.

10. **Permission model:** Should new permission codes be created for each checklist operation (e.g., `CHECKLIST_CREATE`, `CHECKLIST_APPROVE`, `CHECKLIST_VIEW`, `CHECKLIST_EXECUTE`)? Or should they be tied to existing CF/Application permissions?

11. **"Add to Master Document Types" — approval required?** The PRD says the new document type appears "without requiring a separate approval" (AC 1.3). Is this intentional, or should it go through an admin approval?

12. **Template deletion/deactivation:** The PRD doesn't explicitly mention how to deactivate or archive a template after it's approved. Is "Rejected" the only terminal state besides "Approved"? Can an approved template be deactivated?

---

## Dependencies

### External Systems
| System | Integration Point | Direction |
|--------|------------------|-----------|
| DMS (Document Management) | File upload/delete event hooks | Bidirectional — upload triggers auto-check; delete triggers reversion |
| S3 (via Document Service) | Sample document storage, Golden Sample pre-signed URLs | Outbound |
| Client Portal | Client-facing task API | Outbound API |
| Redis | Parameter value caching, config caching | Internal |

### Internal Modules
| Module | Dependency | Reason |
|--------|-----------|--------|
| Credit Facility module | `lending/controllers/credit_facility.js` | Gatekeeper hook on CF submission/approval |
| Finance Application module | `lending/controllers/finance_application.js` | Gatekeeper hook on Application submission |
| Process Workflow | `lending/services/process_workflow/index.js` | Checklist template approval workflow |
| Notification Service | `lending/services/notification_service/index.js` | All notification events |
| Document Service | `lending/services/document_service/index.js` | DMS integration, sample uploads |
| Exposure Control | `lending/services/exposure_control/index.js` | Group Exposure parameter types reference |
| Auth/User Object | `middlewares/user_object.js` | User context (role, orgId, userId) |
| Product Config | `utils/product_config_utils.js` | Workflow type constants, status mappings |

### Database
| Table/Schema | Role |
|-------------|------|
| `lending.workflow` | Workflow state machine entries for checklist approval |
| `lending.skipflow` | Skip conditions for checklist workflow |
| `lending.state_transactions` | Audit trail pattern reference |
| `lending.notifications` | Notification persistence |
| `lending.history` | Change history pattern reference |
| `lending.documents` | Document reference pattern |
| `lending.loan_documents_product_info` | Master document type list for "Add to Master" feature |
| New `checklist.*` tables | All checklist-specific data |

---

## Risk Assessment

### Technical Risks
1. **Aggregation engine performance:** The UNION + de-duplication query for multiple parameter-matched templates at workflow creation time could be slow if there are many templates. Mitigation: index parameter columns; consider materialized views or caching.

2. **Gatekeeper integration coupling:** Hooking into existing CF and Finance Application submission flows creates tight coupling. If the checklist service is down, submissions could be blocked. Mitigation: configurable feature flag to enable/disable gatekeeper.

3. **DMS event synchronization:** Without a true event bus for DMS, the synchronous check pattern could miss documents uploaded through non-standard flows. Mitigation: provide a manual "refresh" endpoint for task auto-check status.

4. **Deep-copy data volume:** If templates have many tasks and many workflows are created simultaneously, the deep-copy operation could generate significant database load. Mitigation: batch inserts, consider async instance creation with status indicator.

### Backward Compatibility
- **No breaking changes to existing endpoints** — all checklist functionality is additive.
- **Gatekeeper hook must be behind a feature flag** so existing CF/Application flows continue working if checklist is not yet seeded.
- **New migration files only** — no modification to existing migrations.
- **Existing workflow table structure preserved** — only new rows inserted for checklist workflow types.

### Data Integrity
- **Instance immutability:** Template changes must never retroactively affect existing instances. This is enforced by the deep-copy design.
- **Undertaking audit trail:** Declaration text must be snapshotted at sign-time, not referenced from template. Stored in immutable audit table.
- **Deferral audit trail:** Each deferral action creates a new audit entry (append-only).

---

## Scope Confirmation — Modules In/Out

| Module | In Scope (Phase 1) | Notes |
|--------|-------------------|-------|
| Module 1: Governance & Configuration | ✅ Yes | Full CRUD + maker-checker workflow |
| Module 2: Execution Interface (FAB) | ✅ Yes | Backend APIs for FAB data |
| Module 3: DMS & Auto-Verification | ✅ Yes | Sync-check pattern (not async events) |
| Module 4: Digital Coach | ✅ Yes | Backend storage/serving; frontend rendering |
| Module 5: Parameter Config & Aggregation | ✅ Yes | Core aggregation engine |
| Module 6: Data Deviation & Comparison | ❌ **Phase 2** | Explicitly excluded per PRD |
| Module 7: Undertaking | ✅ Yes | Part of task completion criteria types |
| Module 8: Deferral Management | ✅ Yes | Simplified Phase 1 version |
| Module 9: Ask Management | ✅ Yes | Ad-hoc task injection |
| Module 10: External Integration | ✅ Yes | Client portal API |
| Module 11: Role Visibility & Locking | ✅ Yes | Role/stage enforcement |

---

**⛔ STOP — Awaiting Human Review**

Please:
- Confirm requirements are correctly understood
- Answer the 12 ambiguities listed above
- Correct any wrong assumptions
- Add any missing requirements
