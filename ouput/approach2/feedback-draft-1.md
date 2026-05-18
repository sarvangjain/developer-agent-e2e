# Feedback Draft 1 — Requirements Analysis Review

**Document Under Review:** `requirements-analysis.md`  
**Reference:** `prds/current.md` (Checklist Feature Phase 1 PRD)  
**Reviewer:** Technical Review  
**Date:** March 22, 2026

---

## Executive Summary

The Requirements Analysis demonstrates a solid understanding of the PRD's core architecture (Seeding vs. Execution phases, maker-checker workflow, parameter aggregation). However, there are **gaps in field-level specifications**, **missing acceptance criteria references**, and **some notification events not fully enumerated**. The ambiguities raised are largely valid, though some have partial answers in the PRD itself.

**Overall Assessment:** 🟡 Requires Revisions Before Proceeding

---

## Strengths

1. **Correct Phase Understanding:** The Seeding/Execution phase distinction is accurately captured.

2. **Module Mapping:** REQ-1 through REQ-11 correctly map to PRD Modules 1-11 (excluding Module 6).

3. **Delta Analysis:** The "What exists vs. what's new vs. what needs modification" breakdown is valuable and shows good codebase awareness.

4. **Risk Assessment:** The 7 identified risks are pragmatic, especially the gatekeeper blast radius concern with the suggested feature flag mitigation.

5. **Instance Isolation:** Correctly identified the critical "deep copy" requirement for template-to-instance creation.

---

## Gaps & Missing Requirements

### GAP-1: Filter Functionality Not Captured

**PRD Reference:** "Filter within the Checklist Service" section

The PRD explicitly defines 5 filter types for the Checklist Module main screen:
1. Date between
2. Type (Application/Credit Facility)
3. Status of Checklist Workflow
4. Created By (Author)
5. CF/Application Workflow name

**Impact:** This is a distinct API requirement (list/search endpoint with filters) not mentioned in the requirements breakdown.

**Recommendation:** Add as REQ-1A or expand REQ-1 to include filter/search functionality.

---

### GAP-2: Field-Level Validations Not Documented

**PRD Reference:** Checklist Fields table + Task Fields table

The PRD provides explicit validation rules that should be captured:

| Field | Validation |
|-------|------------|
| Checklist Name | Alphanumeric only, max 100 chars, mandatory |
| Description | Alphanumeric only, max 256 chars, mandatory |
| Task Name | Alphanumeric only, max 100 chars, mandatory |
| Task Description | Alphanumeric only, max 256 chars, mandatory |
| Additional Info | Max 10,000 chars, non-mandatory |
| Sample Document | JPG/PNG/PDF, max 10MB, single file only |
| Category | ENUM: Documentation, Legal, Compliance, Credit, Operational, Finance |

**Impact:** Without these in the requirements doc, Joi schema design may miss constraints.

**Recommendation:** Add a "Field Specifications" section or append to REQ-1.

---

### GAP-3: Input Field Auto-Verification Logic Missing

**PRD Reference:** Module 2, "Important Considerations" — Auto-Check Logic

The analysis captures Document auto-verification (REQ-5) but does NOT capture:

> "For **Input Field** tasks: The checkbox auto-ticks once the targeted UI field is non-null/non-empty."

This is distinct from Document tasks and requires the backend to either:
- Poll the frontend state, OR
- Have the frontend call an API when fields change

**Impact:** This is a core requirement for Module 2 that affects architecture.

**Recommendation:** Add explicit requirement for Input Field completion tracking mechanism.

---

### GAP-4: "Text Response" Completion Criteria Type

**PRD Reference:** Module 9, AC 9.3

The PRD mentions **"Text Response"** as a completion criteria type (used for ad-hoc tasks where the owner types a response). This is a 4th type not listed in the main completion criteria enum (Document, Input Field, Undertaking).

**Impact:** Task schema must support a `text_response` field; API must accept text input for task completion.

**Recommendation:** Confirm with PRD author if "Text Response" is a distinct completion criteria or a variant of "Undertaking."

---

### GAP-5: Validity Date Logic Clarification

**PRD Reference:** Module 1, "Important Considerations"

> "The Effective From and Effective Until dates must be checked against the **Workflow Creation Date**, not the current viewing date, to ensure consistency throughout the lifecycle of a specific application."

The analysis mentions Effective From/Until but doesn't capture this critical nuance. A task visible on Day 1 must remain visible throughout the workflow lifecycle even if the date range passes.

**Impact:** Affects aggregation engine query logic.

**Recommendation:** Add this explicitly to REQ-3 (Aggregation Engine).

---

### GAP-6: Document Type Normalization Rule

**PRD Reference:** Module 1, AC 1.3

> "Checking 'Add to Master Document Types' must perform a duplicate check against the global DB using a **Normalized String** (lowercase, no spaces) to prevent 'Board Resolution' and 'Board-Resolution' from co-existing."

**Impact:** Requires a `normalized_name` column or function for dedup logic.

**Recommendation:** Add to REQ-1 under document master list injection.

---

### GAP-7: Template Conflict Notification (N5.1) Missing

**PRD Reference:** Module 5, Notification Events table

Notification N5.1 for template overlap detection is not mentioned:

| ID | Status | Recipient | Subject |
|----|--------|-----------|---------|
| N5.1 | Template Conflict | System Admin / Ops Lead | Alert: Overlapping Checklist Rules Detected |

**Impact:** May need background job to detect parameter collisions.

**Recommendation:** Add to notification template list and assess if this is Phase 1 scope.

---

### GAP-8: Complete Notification Enumeration

The analysis states "6+ new notification templates" but should enumerate all:

| ID | Module | Trigger |
|----|--------|---------|
| N1.1 | 1 | Review Pending |
| N1.2 | 1 | Approved |
| N1.3 | 1 | Rejected |
| N1.4 | 1 | Resubmission |
| N2.1 | 2 | Ad-Hoc Task Added |
| N2.2 | 2 | Mandatory Task Deferred |
| N3.1 | 3 | Document Deleted |
| N5.1 | 5 | Template Conflict |
| N8.1 | 8 | Task Deferred |
| N9.1 | 9 | Ad-hoc Task Assigned |
| N10.1 | 10 | Ad-hoc Task Created (Client) |

**Note:** N2.1/N2.2 and N8.1/N9.1 may overlap — need clarification.

**Recommendation:** Create a notification matrix in the requirements doc.

---

## Ambiguity Feedback

### Ambiguity 1 (Schema location): ✅ Valid
Needs product/tech lead decision. Suggest `lending.checklist_*` tables for consistency with existing patterns.

### Ambiguity 2 (Parameter types): ✅ Valid
PRD says "Group Exposure Parameters" but doesn't enumerate. Critical for schema design.

### Ambiguity 3 (Role codes): ✅ Valid
Essential for workflow seeding and API security.

### Ambiguity 4 (Workflow type dropdown values): ✅ Valid
Critical for role-based filtering in seeding phase.

### Ambiguity 5 (Document types master table): ✅ Valid
PRD implies creation of a normalized master table.

### Ambiguity 6 (Instance creation trigger point): ✅ Valid
Need to identify exact hook in existing workflow initiation flow.

### Ambiguity 7 (Input Field registry): 🟡 Partially Answered in PRD

**PRD Answer (Module 2):**
> "UI Engineers must ensure every input field and Section Header in the Lending Platform has a `data-checklist-id` attribute. In the Seeding phase, the 'Input Field' list is populated by these IDs."

This implies:
1. Frontend owns the registry via `data-checklist-id` attributes
2. Backend needs an API to fetch available field IDs per workflow type
3. This registry may need to be seeded or extracted from Angular templates

**Recommendation:** Reframe question to ask: "How is the `data-checklist-id` registry populated and maintained?"

### Ambiguity 8 (Client Portal): ✅ Valid
Security-critical for Module 10 implementation.

### Ambiguity 9 (Concurrency model): 🟡 Partially Answered in PRD

**PRD Answer (Module 11):**
> "If two users with the same role (e.g., two Operations Makers) open the same checklist, the system must handle 'Last-In-Wins' or provide a warning if a document is being replaced simultaneously."

This suggests **Last-In-Wins is acceptable** but a warning mechanism is preferred.

**Recommendation:** Propose optimistic locking with warning toast on conflict detection.

### Ambiguity 10 (Sample document storage): ✅ Valid
PRD mentions pre-signed URLs for golden samples but doesn't specify storage path.

---

## Assumptions Feedback

| # | Assumption | Assessment |
|---|------------|------------|
| 1 | Backend-only scope | ✅ Valid |
| 2 | New `checklist` schema | 🟡 Needs confirmation (Ambiguity 1) |
| 3 | Existing WORKFLOW_TYPE config | ✅ Valid |
| 4 | Parameter types from Group Exposure | ✅ Valid but needs enumeration |
| 5 | Document types master list | ✅ Valid — PRD confirms this ("Add to Master List" feature) |
| 6 | User roles mapping | 🟡 Needs confirmation |
| 7 | Module 6 excluded | ✅ Correct per PRD |
| 8 | Single-file sample documents | ✅ Correct per PRD (single file, max 10MB) |
| 9 | Workflow dropdown = WORKFLOW_TYPE constants | ✅ Reasonable assumption |
| 10 | Instance creation at workflow initiation | 🟡 Needs confirmation (Ambiguity 6) |

---

## Missing Acceptance Criteria References

The requirements doc should reference key ACs that affect implementation:

| AC | Critical Implementation Detail |
|----|-------------------------------|
| AC 1.2 | Validity dates checked against **Workflow Creation Date** |
| AC 1.3 | Normalized string dedup for document types |
| AC 2.5 | Gatekeeper blocks submission + Red category highlight |
| AC 3.2 | Reversion logic on document deletion |
| AC 5.5 | Instance isolation — templates changes don't affect existing instances |
| AC 7.5 | Declaration text persistence — immutable snapshot at sign time |
| AC 10.3 | Review handshake — Orange "Review Pending" state |

**Recommendation:** Add an "Implementation-Critical ACs" appendix.

---

## Risk Assessment Additions

### Additional Risk: DMS Integration Breaking Existing Flows
**Severity:** MEDIUM  
If checklist hooks are added to document upload/delete services, bugs could break existing document management for non-checklist workflows.  
**Mitigation:** Implement checklist hooks as opt-in via workflow metadata check.

### Additional Risk: Notification Fatigue
**Severity:** LOW  
With 11+ notification types, users may experience alert overload.  
**Mitigation:** Consider notification preferences/digest options in Phase 2.

---

## Structural Recommendations

1. **Add a Field Specifications Section:** Document all field constraints (max length, allowed characters, mandatory/optional).

2. **Add a Notification Matrix:** Enumerate all notifications with trigger conditions, recipients, and template content.

3. **Add an AC-to-Requirement Mapping:** Link each REQ to its acceptance criteria for traceability.

4. **Clarify REQ Numbering vs. Module Numbering:** Currently REQ-3 maps to Module 5, REQ-4 to Module 2, etc. Consider using Module numbers directly (e.g., M1-REQ-1) or adding a mapping table.

5. **Separate "Seeding Phase APIs" from "Execution Phase APIs":** The current breakdown mixes them. A cleaner structure would help API design.

---

## Action Items Before Checkpoint 2

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Add filter functionality to requirements | Analyst | Yes |
| 2 | Document field-level validations | Analyst | Yes |
| 3 | Clarify "Text Response" as 4th completion criteria | PRD Author | Yes |
| 4 | Add validity date nuance (Workflow Creation Date) | Analyst | Yes |
| 5 | Add document type normalization rule | Analyst | No |
| 6 | Enumerate all notifications (11 total) | Analyst | No |
| 7 | Add N5.1 (Template Conflict) — confirm if Phase 1 | PRD Author | No |
| 8 | Refine Ambiguity 7 based on PRD's `data-checklist-id` info | Analyst | No |
| 9 | Propose Last-In-Wins + warning for concurrency | Analyst | No |
| 10 | Resolve remaining 8 ambiguities | PRD Author/Tech Lead | Yes |

---

## Conclusion

The requirements analysis provides a strong foundation but needs refinement before proceeding to Module Decomposition. The **4 blocking gaps** (Filters, Field Validations, Input Field auto-check, Text Response) and **8 unresolved ambiguities** should be addressed first.

**Recommended Next Step:** Update `requirements-analysis.md` with the identified gaps, then re-submit for Checkpoint 1 approval.

---

*End of Feedback Draft 1*
