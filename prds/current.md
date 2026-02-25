TRADE FINANCE  
Checklist Feature Phase 1 PRD  
  
STAKEHOLDERS

| NAME              | ROLE     | DEPARTMENT        |
|-------------------|----------|-------------------|
| Abhishek B        | Author   | Product           |
| Mayank S & Ravi N | Reviewer | Credit            |
| Priyanka R        | Reviewer | Operations        |
| TBD               | Dev      | Development       |
| TBD               | Test     | Quality Assurance |

DOCUMENTATION

| DOCUMENT   | OWNER       | LINK                                                                         |
|------------|-------------|------------------------------------------------------------------------------|
| Wireframe  | Abhishek B  | Refer Ticket for EPIC for Attachment                                         |
| EPIC       | Abhinav S   | [Link ](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/239186) |

TIMELINES

| VERSION | UPDATE                   | DATE      | COMMENT                        |
|---------|--------------------------|-----------|--------------------------------|
| 0.1     | Initial Draft            | 14-Jan-26 | Added all relevant module      |
| 0.2     | Review Round 1           | 24-Jan-26 | Stakeholders                   |
| 0.3     | Review Round 2           | 02-Feb-26 | In Person Stakeholders Session |
| 0.4     | Tech and Design Grooming | 15-Feb-26 | Quality Assurance              |

**BACKGROUND**  
  
**Business Background**  
Any process led organisation would want to streamline their processes through standard operating procedures and have a system led verification system.  
  
**1. Error Rates on Credit Facility/Applications**  
Our existing error rate across the platform is under 4% (3.98% to be precise). This means that on an aggregate basis there would be \$40M worth of applications that may face Typographical or Technical error. So Far, due to a Maker Checker System we've been able to avert any financial loss due to internal/tech errors.  
We must build a Checklist service that catches any errors before the application is submitted.  
  
**2. Standard SOPs**  
Presently all standard operating procedures are monitored through excel checklist that reside in individual Credit and Operations team's laptop. These checklists have to be monitored using a visual QA. This increases the cognitive load on the team. System should be able to handle such SOPs and even guide incoming team members.  
  
**3. Exception Trackers**  
Credit team provides Exceptions on Credit Facilities during their entire course, and these exceptions are maintained and tracked offline. The Checklist service can simply have them nested as a Task for any given Credit Facility with Effective from and Effective Until dates ensuring best compliance.  
  
**4. Variance Analysis**  
Due to Increased Typographical errors by Makers, Checkers have to spend 20 minutes on average to do a VQA (Visual Quality Assurance) and it is the single most important factor leading to operational processing delay. With a Checklist service this variance analysis should be done by the machine using basic arithmetic checks.  
  
**5. Resource Utilisation**  
Presently, only designated personnel in Operations and Credit team handle Applications and CF workflows. This results in unequal utilisation of resources. Since Application processing has its own qwerks, it is mostly handled by only two Makers while KYC is handled by another two individuals. If Both Application processors are away, then Applications workflow is impacted. If the Checklist provides a guided tour, then this can be mitigated and KYC Ops officer can handle Applications as well.  
  
**6. Lack of Ask Management**  
There are multiple files circulating in the Internal Comments section of Application and Credit Facilities due to lack of proper Ask Management. Recently we faced this issue when auditors requested the files based on which certain enhancements were provided. We had to skim through all documents to finally find the file. With proper document management and its linking with Ask Management, we can mitigate said issues in the future.

**7. Existing Excessive Frontend Logic**  
We have 8 different products under applications with their own custom field validations; this is not a scalable to add switch case statements each time we have a new product. This must be addressed through a central service and Frontend should be light.  
  
**User Persona**

**1. The Credit Maker --- Credit Analyst**

- **Role Type:** Template Creator & Cross-Contributor.

- **Primary Domain:** Credit Facility Checklists (Facility Level).

- **Secondary Domain:** Contributor to Application Checklists (e.g., defining credit-specific covenants in the app flow).

- **Reporting Line (Checker):** Submits to **Head of Credit**.

> **Core Responsibilities:**

- **Drafting:** Creates the structural \"Skeleton\" of the Facility Checklist (e.g., determining that a \"Board Resolution\" is required).

- **Cross-Functional Input:** Inserts credit-critical checks into the Operations Application flow (e.g., \"Ensure LTV \< 80% before disbursal\").

- **Maintenance:** Manages the validity periods (Start/End dates) of credit policies.

> **Key Motivation:**

- \"I want to ensure that my credit rules are embedded directly into the Operations workflow so that nothing gets \'lost in translation\' between policy and execution.\"

**2. The Ops Maker --- Operations Maker (Author)**

- **Role Type:** Template Creator & Enricher.

- **Primary Domain:** Application Processing Checklists (Transaction Level).

- **Secondary Domain:** Contributor to Facility Checklists (e.g., adding \"Help Text\" or \"Golden Samples\" to Credit's requirements).

- **Reporting Line (Checker):** Submits to a **Peer Operations Manager** (Segregation of Duties).

> **Core Responsibilities:**

- **Drafting:** Creates the detailed \"Instructional\" layer of the Application Checklist (e.g., defining *how* to verify the Board Resolution).

- **Enrichment:** Adds the \"How-To\" layer (Tooltips, Golden Samples, Data Comparison Logic) to the requirements set by the Credit Analyst.

- **Optimization:** Configures parameter-based rules (e.g., \"Show this check only for Kenya clients\").

> **Key Motivation:**

- \"I want to take the rigid rules from Credit and turn them into a step-by-step guide that my junior team can execute without errors.\"

**3. The Credit Authority --- Head of Credit**

- **Role Type:** Checker / Approver.

- **Scope:** Final Sign-off on Facility Templates.

> **Core Responsibilities:**

- **Review:** Validates that the Facility Checklist covers all regulatory and risk requirements.

- **Approval:** Unlocks the \"Active\" status for templates created by the Credit Analyst.

- **Gatekeeping:** Rejects policy changes that weaken risk controls.

> **Key Motivation:**

- \"I need a \'Diff View\' to see exactly what the Analyst changed, so I don\'t accidentally approve a policy loophole.\"

**4. The Ops Controller --- Operations Checker (Peer Reviewer)**

- **Role Type:** Checker / Approver.

- **Scope:** Final Sign-off on Application Templates.

- **Constraint:** Cannot be the same person as the Author (Enforcing the \"Four-Eyes\" Principle).

**Core Responsibilities:**

- **Validation:** Ensures the operational logic (thresholds, validation rules) set by the Author is sound and efficient.

- **Standardization:** Checks that the \"Help Text\" and \"Golden Samples\" align with the bank\'s standard operating procedures (SOPs).

- **Approval:** Approves updates to the Application workflow.

> **Key Motivation:**

- \"I need to ensure my colleague hasn\'t created a workflow that is impossible to execute in the real world.\"

**Summary of the Workflow Matrix**

| **Feature**            | **Credit Analyst (Maker)**   | **Head of Credit (Checker)** | **Ops Manager (Maker)**          | **Ops Manager (Checker)**  |
|------------------------|------------------------------|------------------------------|----------------------------------|----------------------------|
| **Facility Checklist** | **Owner** (Drafts & Edits)   | **Approver** (Signs off)     | **Contributor** (Adds Help Text) | View Only                  |
| **App Checklist**      | **Contributor** (Adds Rules) | View Only                    | **Owner** (Drafts & Configs)     | **Approver** (Peer Review) |
| **Ad-Hoc Items**       | Can inject into Facility     | N/A                          | Can inject into App              | N/A                        |

**Functioning of Checklist Service \| Seeding**  
  
Checklist service is managed and maintained through a Checklist Module present on the Lending Platform.  
  
**Checklist service operates in two distinct phases:**  
**Seeding Phase** refers to the phase where either a Credit Analyst or an Operations manager would setup a new checklist against a Workflow. Every Checklist must be attached to a workflow. It ensures that the correct Checklist appears during the Execution Phase.  
Each Checklist contains the following fields:

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 20%" />
<col style="width: 59%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Checklist Field</strong></th>
<th><strong>Expected Input</strong></th>
<th><strong>Validation</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Checklist Name</td>
<td>String</td>
<td><ol type="a">
<li><p>Must only Contain Strings and Numbers.</p></li>
<li><p>No Special Characters.</p></li>
<li><p>Max length: 100 Characters</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Workflow</td>
<td>Dropdown of Workflow Names</td>
<td><ol type="a">
<li><p>If current user role is Credit Analyst, then show Credit Facility Workflow.</p></li>
<li><p>If user is Operations Maker, then show Application related Workflows.</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Description</td>
<td>String</td>
<td><ol type="a">
<li><p>Must only Contain Strings and Numbers.</p></li>
<li><p>No Special Characters.</p></li>
<li><p>Max length: 256 Characters</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Parameters Type</td>
<td>ENUM dropdown based on the Group Exposure Parameters. Like Counterparty, Facility, Country</td>
<td><ol type="a">
<li><p>Dropdown of all Parameters that exist in Group Exposure today</p></li>
<li><p>Render the Parameter Value Input only after the Parameter Type is selected</p></li>
<li><p>Parameter Type is a single field, if more than one Parameter is to be selected then pick up a new row</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Parameter Value</td>
<td></td>
<td><ol type="a">
<li><p>Allow Multiselect values</p></li>
<li><p>Should search values when 3 characters are typed in.</p></li>
<li><p>Example, if Parameter type is Credit Facility then the user must enter the first three characters of the name of the CF for it to render in the dropdown.</p></li>
<li><p>In case of multiselect, the previously picked up option would render below the dropdown</p></li>
</ol></td>
</tr>
<tr class="even">
<td>N Tasks</td>
<td>List of Tasks associated with the Checklist. One Checklist Contains Multiple tasks.</td>
<td><ol type="a">
<li><p>All Task should be in Collapsed state unless clicked on.</p></li>
<li><p>When Task is clicked then we should close the other Task list</p></li>
</ol></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 20%" />
<col style="width: 59%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Task Field</strong></th>
<th><strong>Expected Input</strong></th>
<th><strong>Validation</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Category</td>
<td>Dropdown</td>
<td><ol type="a">
<li><p>Contains list of Task type.</p></li>
<li><p>Exhaustive list: Documentation, Legal, Compliance, Credit, Operational, Finance</p></li>
<li><p>This category would help structure Task around Tabs during execution phase</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Name</td>
<td>String</td>
<td><ol type="a">
<li><p>Must only Contain Strings and Numbers.</p></li>
<li><p>No Special Characters.</p></li>
<li><p>Max length: 100 Characters</p></li>
<li><p>Mandatory field</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Mandatory Checkbox</td>
<td>Checkbox</td>
<td><ol type="a">
<li><p>If clicked, then the Task becomes mandatory</p></li>
<li><p>The Deference check in future would check if the task is mandatory, if yes then on Deference we would send notification to the user</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Owner</td>
<td>Dropdown of User Role(s)</td>
<td><ol type="a">
<li><p>Author would select who’d be completing the Task during specific lifecycle of the CF/Application workflow</p></li>
<li><p>Must select only a single user-role</p></li>
<li><p>Non Mandatory Field, if not set then Task can be completed by any user-role</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Stage</td>
<td>Dropdown of Workflow Lifecycle stage</td>
<td><ol type="a">
<li><p>Selection of the stage at which the Task would be populated during the Execution Phase.</p></li>
<li><p>Should be a single selection</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Description</td>
<td>String</td>
<td><ol type="a">
<li><p>Must only Contain Strings and Numbers.</p></li>
<li><p>No Special Characters.</p></li>
<li><p>Max length: 256 Characters</p></li>
<li><p>Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Completion Criteria</td>
<td>Dropdown</td>
<td><ol type="a">
<li><p>Contains list of Completion criteria from the following fixed fields:<br />
a1. Document ( in case of DMS document upload),<br />
a2. Input Field,<br />
a3. Undertaking (in case of simple Checkbox field),</p></li>
<li><p>In case of Document, The Document Category and Document Type should be rendered conditionally</p></li>
<li><p>In case of Document, there is a special checkbox called “Add to Master List” This is for cases where the users want to add the document type to the master checklist or keep it locally scoped to this Checklist.</p></li>
<li><p>Mandatory field</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Effective From</td>
<td>Data Picker</td>
<td><ol type="a">
<li><p>Must be a valid date (no upper or lower cap)</p></li>
<li><p>Effective from ensures that the Task would only show up if the current Date (on which checklist is rendered) is after the Effective From date</p></li>
<li><p>Non-Mandatory, if not set then Task is live by default</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Effective Until</td>
<td>Date Picker</td>
<td><ol type="a">
<li><p>Must be a valid date (no upper or lower cap)</p></li>
<li><p>Effective Until ensures that the Task would only show up if the current Date is before the Effective Until Date</p></li>
<li><p>Non-Mandatory, if not set then Task is live by Default</p></li>
</ol></td>
</tr>
<tr class="even">
<td>Additional Info</td>
<td>String</td>
<td><ol type="a">
<li><p>Contains String alongside with numbers</p></li>
<li><p>Character Limit: 10000</p></li>
<li><p>Non-Mandatory Field</p></li>
</ol></td>
</tr>
<tr class="odd">
<td>Sample Document</td>
<td>Document</td>
<td><ol type="a">
<li><p>Refers to the Document user is uploading for refence</p></li>
<li><p>JPG, PNG, PDF up to 10MB should be allowed</p></li>
<li><p>Only single file should be allowed</p></li>
</ol></td>
</tr>
</tbody>
</table>

**Maker-Checker Flow**  
1. A New Checklist or any Modification to the checklist has to be done through a workflow.

2\. The Credit Facility related checklist must be seeded by user holding role of Credit Analyst and must be approved by user holding role of Head of Credit.

3\. The Application related checklist must be seeded by user holding role of Operations Maker and must be apporved by user holding role of Operations Checker.

4\. Status of the checklist workflow is rendered on the Checklist service main screen.

5\. checklist Lifecyle stage is as below:

| CF Stage Description                            | Stage Name                             | User Role      |
|-------------------------------------------------|----------------------------------------|----------------|
| Checklist Draft when CA is working on Checklist | Checklist Draft Pending for Submission | Credit Analyst |
| When CA pushed it to HOC's queue                | Checklist Review Pending with HOC      | Head of Credit |
| When HOC rejects the Checklist                  | Checklist Rejected                     | NA             |
| HOC sends back Facility for Modification        | Checklist Resubmission Pending with CA | Credit Analyst |
| Once HOC approves the Checklist                 | Checklist Approved                     | NA             |

| CF Stage Description                                          | Stage Name                                | User Role          |
|---------------------------------------------------------------|-------------------------------------------|--------------------|
| Checklist Draft when Operations Maker is working on Checklist | Checklist Draft Pending for Submission    | Operations Maker   |
| When OM pushed it to Operations Checker's queue               | Checklist Review Pending with Checker     | Operations Checker |
| When Operations Checker rejects the Checklist                 | Checklist Rejected                        | NA                 |
| Operations Checker sends back Facility for Modification       | Checklist Resubmission Pending with Maker | Operations Maker   |
| Once Operations Checker approves the Checklist                | Checklist Approved                        | NA                 |

**Filter within the Checklist Service**  
Filter on the Main Checklist Module should have the following filters:

1.  Date between

2.  Type (Application/Credit Facility)

3.  Status of Checklist Workflow

4.  Created By (Author)

5.  CF/Application Workflow name

**Functioning of Checklist Service \| Execution**  
  
**Execution Phase is** when the Checklist that is in the Approved stage would come into action and would be rendered as a Floating Action Button (FAB) on the Application and the Credit Facility Workflows. The execution Phase involves two key UI components:  
  
**(A) Collapsed Floating Action Button (FAB)**  
1. By Default, the Checklist service would be in a collapsed stage so that it does not disturb the user.

2\. The FAB would only render the number of Task associated with the workflow alongside the list of Completed Task.

3\. The FAB would only show the count of Mandatory Task as there can be a lot of Good to have Task but may not be extensively required. Hence show \${Count of Mandatory task completed}/ \${Count of Total Mandatory Task}.  
  
4. Task that are marked Deferred would also be considered completed.

**(B) Expanded FAB**  
1. The Expanded FAB would have the completed task on the top, it is positioned on the right side of the screen and holds up to 50% of the current viewport.  
  
2. The Expanded FAB would have each Task Category as a Tab.  
  
3. Each Task Category would have the list of Mandatory Task under them as a Count.  
  
4. Categories would render as a Tab only and only if there is one Task under them (Mandatory or Good to Have).  
  
5. Each Task would contain a checkbox that auto checks if the user has performed the task successfully. There is an exception for the Task with Completion Criteria of "Undertaking". The Undertaking Task type would only be checked in if the Owner checks it in.  
  
6. There are non-frequently accessible fields like Sample, Additional Information and Option to Defer the Tasks that are nested in menu item.  
  
7. Task when clicked Expand; At one time only One Task will be Expanded.  
  
8. Data Required for Input Field /Document would have a Scroll Spy that takes user to either the Input field or the Document in the Document Management System.  
  
9. Add Task Button allows the user to create a new Task on an Adhoc basis. Any user can add this task to their colleague's Task board.  
  
10. A Task can be Deferred. Once Deferred then the Task can Still be Completed. When a Mandatory Task is Deferred then Notification Event is triggered.

11\. On Submit, if any Mandatory Task is incomplete then the Category goes in Red. Once all mandatory task is done then it is in Green.

**REQUIREMENTS**

**Module 1: Governance & Configuration (Template Management)**

**Azure DevOps ID:** TBD

**Module Description:** This module encompasses the \"Seeding Phase.\" It allows Credit Analysts and Operations Makers to define the rules, parameters, and tasks that constitute a checklist. It also includes the Maker-Checker workflow required to push a template into the \"Active\" state.

**1. Notification Events**

<table style="width:100%;">
<colgroup>
<col style="width: 8%" />
<col style="width: 17%" />
<col style="width: 14%" />
<col style="width: 11%" />
<col style="width: 17%" />
<col style="width: 30%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>Status</strong></th>
<th><strong>Recipient</strong></th>
<th><strong>CC</strong></th>
<th><strong>Subject</strong></th>
<th><strong>Body</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>N1.1</td>
<td><strong>Review Pending</strong></td>
<td>Head of Credit / Ops Checker</td>
<td>Maker (Author)</td>
<td>Action Required: New Checklist Template for Review</td>
<td>A new checklist template "[Checklist Name]" has been submitted by [Maker Name] for the [Workflow Name] workflow. Please review and approve.</td>
</tr>
<tr class="even">
<td>N1.2</td>
<td><strong>Approved</strong></td>
<td>Maker/CA (Author)</td>
<td>—</td>
<td>Checklist Template "[Checklist Name]" is now LIVE</td>
<td>The checklist template you created for [Workflow Name] has been approved and is now active for all matching instances.</td>
</tr>
<tr class="odd">
<td>N1.3</td>
<td><strong>Rejected</strong></td>
<td>Maker/CA (Author)</td>
<td>—</td>
<td>Action Required: Checklist Template Rejected</td>
<td>The checklist template "[Checklist Name]" was rejected by [Checker Name]. Reason: [Checker Comments].</td>
</tr>
<tr class="even">
<td>N.1.4</td>
<td><strong>Resubmission</strong></td>
<td>Maker/CA</td>
<td></td>
<td>Action Required: Checklist Template Resubmission</td>
<td>The checklist template "[Checklist Name]" is requested for Resubmission by [Checker Name]. Reason: [Checker Comments].<br />
<br />
Please modify and resubmit.</td>
</tr>
</tbody>
</table>

**2. Important Considerations (Developer \"Gotchas\")**

- **The \"Class vs. Instance\" Architecture:** Developers must treat the \"Approved Checklist\" as a static Class. When a Workflow (Application or Credit Facility) is triggered, the system must **instantiate** a copy of this checklist. Ad-hoc tasks (from Module 2) are added to this *Instance ID*, never the *Template ID*.

- **Field Mapping (Scroll Spy):** The \"Input Field\" dropdown in the seeding phase must dynamically fetch the list of field labels from the respective workflow\'s schema (e.g., if \"New Application\" is selected, fetch all field keys from the Application JSON).

- **Validity Logic:** The Effective From and Effective Until dates must be checked against the **Workflow Creation Date**, not the current viewing date, to ensure consistency throughout the lifecycle of a specific application.

- **Global Promotion:** Checking \"Add to Master Document Types\" must perform a duplicate check against the global DB using a \"Normalized String\" (lowercase, no spaces) to prevent \"Board Resolution\" and \"Board-Resolution\" from co-existing.

**3. Acceptance Criteria (QA Detailing)**

**AC 1.1: Multi-Parameter Aggregation Logic**

- **Scenario:** A user creates Checklist A (Param: Product = Invoice Factoring) and Checklist B (Param: Country = India).

- **Action:** Trigger a workflow for an Invoice Factoring application in India.

- **Expected Result:** The system must perform a \"Union\" of both checklists. If Checklist A has 5 tasks and Checklist B has 3 unique tasks, the execution panel must render 8 tasks.

- **Numeric Example:**

  - Template 1: \"Verify ID\" (Mandatory)

  - Template 2: \"Verify ID\" (Non-Mandatory)

  - *Result:* The aggregate instance must treat \"Verify ID\" as **Mandatory** (strictest rule applies).

**AC 1.2: Validity Date Enforcement**

- **Scenario:** Template Task \"Flood Cert\" has Effective From: 01-Feb-2026.

- **Test Case A:** Workflow created on 31-Jan-2026. *Result:* Task \"Flood Cert\" must NOT appear in the execution panel.

- **Test Case B:** Workflow created on 01-Feb-2026. *Result:* Task \"Flood Cert\" MUST appear.

> **AC 1.3: Document Master List Injection**

- **Action:** In the \"New Checklist\" screen, select Completion Criteria: Document, type \"Environmental Audit\" in Document Type Name, and check Add to Master Document Types. Click Create.

- **Verification:** Open a second, unrelated checklist. Open the Document Type dropdown.

- **Result:** \"Environmental Audit\" must now appear as a selectable option in the global list without requiring a separate approval.

**AC 1.4: Role-Based Workflow Filtering**

- **Action:** Log in as a \"Credit Analyst.\" Open the \"Workflow\" dropdown.

- **Verification:** Ensure only \"Credit Facility\" related workflows (e.g., New Facility, Limit Update) are visible.

- **Action:** Log in as \"Operations Maker.\"

- **Verification:** Ensure only \"Application\" related workflows (e.g., Disbursal, Renewal) are visible.

**AC 1.5: Data Integrity (Mandatory Fields)**

- **Action:** Attempt to click \"Create\" or \"Save as Draft\" with a blank Checklist Name or Workflow selection.

- **Expected Result:** Field must highlight in Red; system must prevent submission and show a toast: \"Mandatory fields missing.\"

**Module 2: Execution Interface (Runtime & FAB)**

**Azure DevOps ID:** ADO-MOD-02

**Module Description:** This module handles the rendering of the checklist \"Instance\" as a Floating Action Button (FAB) on the right side of the screen. It manages real-time status tracking, the \"Scroll Spy\" navigation to form fields, ad-hoc task injection, and the \"Gatekeeper\" logic that prevents submission of incomplete applications.

**1. Notification Events**

| **ID** | **Status**                  | **Recipient**                | **CC**    | **Subject**                                         | **Body**                                                                                                                          |
|--------|-----------------------------|------------------------------|-----------|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| N2.1   | **Ad-Hoc Task Added**       | Task Owner (Assigned Role)   | Maker     | Action Required: New Ad-Hoc Task in \[Workflow ID\] | A new ad-hoc task \"\[Task Name\]\" has been added to the checklist for \[Facility/App Name\] by \[User Name\].                   |
| N2.2   | **Mandatory Task Deferred** | Head of Credit / Ops Checker | Risk Dept | Alert: Mandatory Task Deferred for \[Workflow ID\]  | A mandatory checklist task \"\[Task Name\]\" has been deferred for \[Facility/App Name\] by \[User Name\]. Target Date: \[Date\]. |

**2. Important Considerations (Developer \"Gotchas\")**

- **Instance Lifecycle:** When a Workflow (Application/CF) is created, the system must create a deep copy of the matched Checklist Template(s). This instance is tied to the Workflow ID. Any ad-hoc tasks added here **must not** modify the original template.

- **The \"Gatekeeper\" Hook:** The \"Submit\" or \"Disburse\" button on the main application form must have a listener attached to the Checklist Instance status. It should only be enabled if Total Mandatory Tasks == Completed/Deferred Mandatory Tasks.

- **UI Field Identification (Scroll Spy):**

  - UI Engineers must ensure every input field and Section Header in the Lending Platform has a data-checklist-id attribute.

  - In the Seeding phase, the \"Input Field\" list is populated by these IDs.

  - In the Execution phase, clicking the \"Show Me\" icon must trigger a scrollIntoView event targeting the specific data-checklist-id.

- **Auto-Check Logic:**

  - For **Document** tasks: The checkbox auto-ticks once a file with the matching Document Type is successfully uploaded to the DMS for that specific Workflow ID.

  - For **Input Field** tasks: The checkbox auto-ticks once the targeted UI field is non-null/non-empty.

  - For **Undertaking**: No auto-tick; requires a manual user click.

- **Viewport Management:** The expanded FAB panel must occupy 50% of the viewport and \"push\" or \"overlay\" the main content. If the panel is open, the main form must remain scrollable independently.

**3. Acceptance Criteria (QA Detailing)**

**AC 2.1: FAB Counter Logic (Mandatory Only)**

- **Scenario:** A checklist instance has 5 Mandatory tasks and 10 \"Good to Have\" tasks.

- **Action:** Complete 2 Mandatory tasks and 5 \"Good to Have\" tasks.

- **Expected Result:** The collapsed FAB must display the fraction **2/5**. The non-mandatory tasks must not impact the counter.

**AC 2.2: Category Tab Rendering**

- **Action:** Open the Expanded FAB.

- **Verification:** Ensure that only Categories containing at least one task (Mandatory or Optional) appear as tabs.

- **Test Case:** If \"Legal\" category has 0 tasks for this specific product, the \"Legal\" tab must be hidden entirely.

**AC 2.3: Scroll Spy Navigation (Section Focus)**

- **Scenario:** A task is mapped to a field inside a \"Financial Covenants\" table.

- **Action:** Click the \"Scroll Spy\" (Data Required) icon on the checklist task.

- **Expected Result:** The main form must auto-scroll until the \"Financial Covenants\" Section Heading is at the top of the viewport. A temporary \"Glow\" or highlight effect should appear on the section header.

**AC 2.4: Ad-Hoc Task Injection (Instance Level)**

- **Action:** An Ops Checker opens an active Application and clicks \"+ Add Task.\" They create a task \"Verify Flood Insurance.\"

- **Verification 1:** Ensure the task appears in the current workflow instance with an \"Ad-Hoc\" tag.

- **Verification 2:** Open a **new** application of the same type.

- **Result:** The \"Verify Flood Insurance\" task must NOT appear in the new application (proving it didn\'t pollute the Template/Class).

**AC 2.5: The Gatekeeper (Hard Block)**

- **Scenario:** 1 Mandatory task is remaining (incomplete).

- **Action:** Click the \"Submit\" button on the main Application form.

- **Expected Result:**

  - Form submission is blocked.

  - Checklist Category tab containing the missing task turns **Red**.

  - A Toast message appears: \"Please complete all mandatory checklist items before proceeding.\"

**AC 2.6: Task Expansion Behaviour**

- **Action:** Click on Task A to expand it. Then click on Task B.

- **Expected Result:** Task A must automatically collapse when Task B expands (Accordion behaviour).

**Module 3: DMS & Auto-Verification**

**Azure DevOps ID:** TBD

**Module Description:** This module manages the synchronization between the Checklist Service and the Document Management System (DMS). It enables automatic status updates (Checked/Unchecked) based on document availability and ensures that documents uploaded via the checklist are correctly categorized.

**1. Notification Events**

| **ID** | **Status**           | **Recipient** | **CC** | **Subject**                                            | **Body**                                                                                                                                                                         |
|--------|----------------------|---------------|--------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| N3.1   | **Document Deleted** | Task Owner    | Maker  | Alert: Mandatory Document Removed from \[Workflow ID\] | The document \"\[Document Type\]\" which was satisfying a mandatory checklist task has been deleted. The task \"\[Task Name\]\" is now marked as Incomplete and requires action. |

**2. Important Considerations (Developer \"Gotchas\")**

- **State Synchronization (The Observer):** The Checklist Service must subscribe to DMS webhooks/events (FILE_UPLOADED, FILE_DELETED).

  - The link must be based on a combination of Workflow ID + Document Type ID.

  - If a workflow has multiple documents of the same type, the task is considered \"Complete\" as long as count(Document Type) \> 0.

- **Known Limitation (No OCR):** The system **cannot** validate the contents of the document (e.g., expiry dates, names, or values). Verification only confirms the *presence* of a file tagged with the correct Document Type.

- **Manual Override:** Since the system only checks for \"Presence,\" a task auto-checked by a document upload can still be manually \"Unchecked\" by a Checker if the document quality is poor (this triggers a \"Return\" workflow).

- **Scoped Tagging (Ad-Hoc):** Documents uploaded specifically for Ad-Hoc tasks must be flagged as \"Transaction-Specific.\" These tags must not be injected into the Global DMS Document Type Master list to prevent clutter.

**3. Acceptance Criteria (QA Detailing)**

**AC 3.1: Auto-Verification Handshake**

- **Scenario:** A Checklist Task \"Board Resolution\" is pending.

- **Action:** User uploads a PDF to the DMS and selects \"Board Resolution\" from the document type dropdown.

- **Expected Result:**

  - The Checklist Service detects the upload for that specific Workflow ID.

  - The \"Board Resolution\" task in the FAB panel immediately updates to a **Green Checkmark**.

  - The completion counter (e.g., 1/5) updates in real-time.

**AC 3.2: Reversion on Deletion (Live State)**

- **Scenario:** A task is currently marked \"Complete\" because a document exists.

- **Action:** User deletes that specific document from the DMS.

- **Expected Result:**

  - The Checklist task must immediately revert to **Incomplete (Unchecked)**.

  - If the task was Mandatory, the FAB counter must decrement.

  - The \"Gatekeeper\" logic must immediately **Disable** the \"Submit/Disburse\" button on the main form.

**AC 3.3: Ad-Hoc Document Isolation**

- **Scenario:** An Ad-hoc task \"Special Flood Permit\" is created for a specific application.

- **Action:** User uploads the document via the checklist panel.

- **Verification:** Navigate to the \"Checklist Seeding/Config\" module and look at the \"Global Document Types\" list.

- **Result:** \"Special Flood Permit\" must NOT appear in the global list. It must remain local to that specific Workflow ID.

**AC 3.4: Context-Aware Upload (Metadata Locking)**

- **Action:** Within the Expanded Checklist Panel, click the \"Upload\" icon next to a \"Tax Certificate\" task.

- **Expected Result:**

  - The DMS upload interface opens as a modal or new tab.

  - The Document Type field is **auto-populated** with \"Tax Certificate.\"

  - The Document Type field is **disabled/read-only** to ensure the user doesn\'t accidentally change the tag and break the auto-verification link.

**Module 4: Digital Coach (Guidance & Navigation)**

**Azure DevOps ID:** TBD

**Module Description:** This module provides the instructional layer for users executing the checklist. It leverages SOP guidance through rich-text \"Help Text\" and \"Golden Samples\" (reference documents). It also manages the \"Scroll Spy\" feature, which navigates users to specific sections of the application form to reduce search time.

**1. Notification Events**

| **ID** | **Status** | **Recipient** | **CC** | **Subject** | **Body**                                                                                              |
|--------|------------|---------------|--------|-------------|-------------------------------------------------------------------------------------------------------|
| ---    | **None**   | ---           | ---    | ---         | This module is strictly informational/UI-driven and does not trigger system notifications in Phase 1. |

**2. Important Considerations (Developer \"Gotchas\")**

- **Rich Text Rendering:** The \"Additional Info\" field must support formatting (bold, italics, bullet points). The UI component in the Execution Panel must render this as HTML to preserve the SOP structure.

- **Golden Sample Redirection:** When a user clicks a Golden Sample link, the system must generate a secure, temporary pre-signed URL.

  - **Behavior:** The document must open in a **new browser tab**.

  - **User Action:** Once in the new tab, the user can use native browser functions to download or print the sample.

- **Scroll Spy (Section Landing):**

  - If a task is mapped to a specific field, the system must scroll to the **Section Header/Label** where that field resides (rather than the individual input box).

  - **Visual Cue:** The target section header must \"Glow\" or \"Flash\" (e.g., a subtle yellow or blue fade-in/out) for 2-3 seconds to orient the user.

- **Phase 2 Deferral (Variance Analysis):**

  - **Note:** Any automated arithmetic checks or \"Data Deviation\" logic (e.g., comparing requested amount vs. limit) is **excluded from Phase 1**. This logic will be addressed as a dedicated module in Phase 2. All data-related tasks in Phase 1 are confirmed via manual verification or simple field \"presence\" checks.

**3. Acceptance Criteria (QA Detailing)**

**AC 4.1: Rich-Text SOP Guidance**

- **Scenario:** A checklist task \"Collateral Appraisal\" has help text with bold headers and a numbered list of steps.

- **Action:** Click the \"Info\" icon on the task in the Expanded Checklist panel.

- **Expected Result:**

  - The instructional text renders with the correct formatting (not as a single block of unformatted string).

  - The panel must be scrollable if the text exceeds the viewport height.

**AC 4.2: Golden Sample Navigation**

- **Scenario:** Task \"Standard Board Resolution\" has a reference PDF attached.

- **Action:** User clicks the \"View Sample\" button.

- **Expected Result:**

  - A new tab opens in the browser.

  - The sample PDF is displayed successfully.

  - The main application page and the checklist panel remain open and functional in the original tab.

**AC 4.3: Scroll Spy \"Section Focus\"**

- **Scenario:** A task is mapped to the \"Insurance Expiry Date\" field located inside the \"Asset Details\" section.

- **Action:** Click the \"Show Me\" icon on the task.

- **Expected Result:**

  - The main form auto-scrolls.

  - The **\"Asset Details\" Section Heading** is positioned at the top of the viewport.

  - The section heading performs a temporary background color flash to highlight itself to the user.

**AC 4.4: Handling of Broken Links**

- **Action:** A user clicks a Golden Sample link that points to a file that was moved or deleted on the server.

- **Expected Result:** The system must show a non-breaking toast notification: \"Reference sample is currently unavailable. Please contact the Operations Head.\"

**Module 5: Parameter Config & Aggregation (The Rules Engine)**

**Azure DevOps ID:** ADO-MOD-05

**Module Description:** This module is the \"Brain\" of the Checklist Service. It defines the logic for how templates are selected and merged for a specific transaction. Instead of a 1-to-1 mapping, the system uses a **Parameter-Based Aggregation Engine** to assemble a customized checklist \"Instance\" based on the metadata of the Credit Facility or Application (e.g., Product Type, Country, Client Type).

**1. Notification Events**

| **ID** | **Status**            | **Recipient**           | **CC** | **Subject**                                 | **Body**                                                                                                                                                          |
|--------|-----------------------|-------------------------|--------|---------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| N5.1   | **Template Conflict** | System Admin / Ops Lead | ---    | Alert: Overlapping Checklist Rules Detected | Checklist Template \"\[Template A\]\" and \"\[Template B\]\" have overlapping parameters for \[Workflow Name\]. Please verify if this duplication is intentional. |

**2. Important Considerations (Developer \"Gotchas\")**

- **The Aggregation Logic (Union):** When a workflow is triggered, the system must fetch **ALL** active templates where the parameters match.

  - *Logic:* Matched_Checklist = Checklist(Product) UNION Checklist(Country) UNION Checklist(General).

- **De-duplication & Strictness:** If Task X appears in two different matched templates:

  - **Rule:** The task is rendered only **once** in the execution panel.

  - **Mandatory Override:** If Template A says Task X is \"Optional\" and Template B says Task X is \"Mandatory,\" the resulting Instance must treat Task X as **Mandatory**.

- **Search Optimization:** Parameter values (Counterparty, Country, etc.) must be indexed. When the runtime instance is created, the system should perform a single query to fetch all relevant templates to minimize latency.

- **Global Fallback:** If a template is created with **no parameters** (left blank), it acts as a \"Global Template\" for that Workflow Type and will be included in every instance of that workflow.

- **Multiselect Handling:** Parameters allow multiselect (e.g., Country = India, Kenya). The engine must treat this as an OR condition within that parameter group.

**3. Acceptance Criteria (QA Detailing)**

**AC 5.1: Multi-Parameter Matching (The Union Check)**

- **Setup:**

  - Template 1: Workflow = New Application \| Parameter: Product = **Invoice Factoring** (Task: \"Verify Invoice\")

  - Template 2: Workflow = New Application \| Parameter: Country = **UAE** (Task: \"VAT Certificate\")

- **Action:** Create a \"New Application\" for an **Invoice Factoring** product in the **UAE**.

- **Expected Result:** The Checklist Instance must contain **both** tasks (\"Verify Invoice\" AND \"VAT Certificate\").

**AC 5.2: De-duplication and Mandatory Conflict**

- **Setup:**

  - Template A (Global): Task \"Director ID\" \| Mandatory = **OFF**.

  - Template B (Country: India): Task \"Director ID\" \| Mandatory = **ON**.

- **Action:** Trigger an application for Country: India.

- **Expected Result:**

  - The checklist shows \"Director ID\" only **once**.

  - The task is marked with the **Red Asterisk (\*)** as Mandatory (Strictness wins).

**AC 5.3: Parameter Search (3-Character Trigger)**

- **Action:** In the Seeding Phase, select Parameter Type = \"Credit Facility.\" Type \"ABC\" into the Parameter Value field.

- **Expected Result:**

  - The system must not search until the 3rd character is typed.

  - After \"C,\" it must return all Credit Facilities starting with \"ABC\" (e.g., ABC Ports, ABC Logistics).

**AC 5.4: Global Template Enforcement**

- **Setup:** Template C has no parameters selected (only Workflow = \"Limit Update\").

- **Action:** Create a \"Limit Update\" workflow for any product in any country.

- **Expected Result:** The tasks from Template C must appear in the checklist regardless of other specific parameter matches.

**AC 5.5: Instance Isolation (Persistence)**

- **Scenario:** An application is created and matches Template A. Later, an Admin modifies Template A to add a new task.

- **Expected Result:** The **existing** application checklist (the Instance) must NOT change. It must remain a snapshot of the template at the time of the application\'s creation. Only new applications created after the modification should reflect the change.

**Module 6: Data Deviation & Comparison (PHASE 2 \| Ignore for Current development)**

**Azure DevOps ID:** ADO-MOD-06 (Phase 2)

**Module Description:** This module automates the \"Visual Quality Assurance\" (VQA) process. It allows the system to perform arithmetic and logic-based comparisons between different data points (e.g., comparing the \"Requested Amount\" in an Application vs. the \"Approved Limit\" in the Credit Facility). It uses a \"Traffic Light\" system to highlight deviations to the Checker.

**1. Notification Events**

| **ID** | **Status**                 | **Recipient**              | **CC**  | **Subject**                                    | **Body**                                                                                                                                 |
|--------|----------------------------|----------------------------|---------|------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| N6.1   | **Critical Breach**        | Risk Head / Head of Credit | Checker | Alert: Policy Breach in \[Workflow ID\]        | A critical data deviation has been detected in \[Facility Name\]. Field \"\[Field A\]\" exceeds \"\[Field B\]\" by \[Value/Percentage\]. |
| N6.2   | **Deviation Acknowledged** | Maker                      | Checker | Notification: Deviation Justification Accepted | The deviation identified in \[Task Name\] has been acknowledged and the justification provided has been accepted by the Checker.         |

**2. Important Considerations (Developer \"Gotchas\")**

- **Dependency on Field Mapping:** This module relies entirely on the unique data-checklist-id attributes established in Phase 1. Without unique IDs for every UI field, the arithmetic engine cannot fetch values.

- **Threshold Definitions:** The seeding phase must allow for \"Buffer\" percentages.

  - *Example:* A deviation of \<5% might be a \"Yellow Warning,\" while \>5% is a \"Red Block.\"

- **Operator Logic:** Developers must support standard operators: Equal To, Greater Than, Less Than, and Not Equal To.

- **Snapshot vs. Live:** Unlike document presence, data values change frequently during the \"Maker\" phase. The \"Comparison Check\" should only trigger its final \"Pass/Fail\" state when the Maker attempts to \"Submit\" to the Checker.

- **Justification Loop:** If a \"Red\" breach is detected, the system must force a mandatory text comment (Justification) before the Maker can proceed.

**3. Acceptance Criteria (QA Detailing)**

**AC 6.1: Comparison Rule Configuration (Seeding)**

- **Action:** In the Checklist Seeding phase, select Completion Criteria: Data Comparison.

- **Requirement:**

  - Select Field A (e.g., Requested Amount).

  - Select Operator (e.g., Less Than or Equal To).

  - Select Field B (e.g., Facility Limit).

  - Define Tolerance (e.g., 2%).

- **Expected Result:** The rule is saved and successfully linked to the checklist template.

**AC 6.2: Visual Deviation Highlighting (Execution)**

- **Scenario:** Requested Amount = \$105,000 \| Limit = \$100,000 (5% Deviation).

- **Expected Result:**

  - The Checklist Task status icon turns **Red**.

  - A \"Comparative Bar\" appears in the task details showing both values side-by-side.

  - The text displays: \"Breach: Value exceeds limit by 5%.\"

**AC 6.3: \"Traffic Light\" Logic (Yellow vs. Red)**

- **Setup:** Warning Threshold = 2% \| Breach Threshold = 5%.

- **Test Case A (3% deviation):** Task turns **Yellow**. Maker can submit, but Checker sees a \"Soft Warning.\"

- **Test Case B (6% deviation):** Task turns **Red**. Maker is blocked from submitting until a \"Justification Comment\" is entered.

**AC 6.4: Justification Persistence**

- **Action:** Maker enters a justification for a Red Breach: \"One-time exception approved by regional head.\"

- **Expected Result:**

  - The justification is saved to the Checklist Instance.

  - When the Checker opens the application, the justification is immediately visible next to the failed task.

**AC 6.5: Cross-Workflow Data Fetching**

- **Requirement:** Field A is in the \"Application\" workflow, but Field B is in the \"Credit Facility\" master data.

- **Expected Result:** The engine must be able to fetch \"Limit\" data from the parent Facility record to compare against the child Application\'s \"Requested Amount.\"

**Module 7: Undertaking (Declarations & Liability)**

**Azure DevOps ID:** TBD

**Module Description:** This module handles \"Off-System\" checks where a user must legally attest to a fact or process that cannot be verified automatically (e.g., \"I confirm I have physically verified the warehouse\"). These rely on a manual checkbox and assign legal liability to a specific user role (Maker or Checker).

**1. Notification Events**

| **ID** | **Status** | **Recipient** | **CC** | **Subject** | **Body**                                                                                                       |
|--------|------------|---------------|--------|-------------|----------------------------------------------------------------------------------------------------------------|
| ---    | **None**   | ---           | ---    | ---         | This module is strictly execution-driven within the UI and does not trigger external notifications in Phase 1. |

**2. Important Considerations (Developer \"Gotchas\")**

- **Global Visibility (Audit Transparency):** Every Undertaking task associated with a workflow instance must be visible to **all users** (Maker, Checker, and Viewers) from the moment the workflow is initiated. This ensures the Maker knows what the Checker will eventually be attesting to.

- **Stage-Gate Interaction (The Lock):**

  - While visible to everyone, an Undertaking only becomes **Interactive (Enabled)** when the Workflow Stage matches the Stage defined in the Checklist Template.

  - *Example:* A \"Final Disbursement Declaration\" assigned to the \"Checker Approval\" stage will appear \"Disabled/Read-Only\" while the application is in the \"Maker Draft\" stage.

- **Role-Based Enforcement:** Even if the stage matches, only the user holding the assigned Owner role can tick the box.

- **Audit Trail (Immutability):** The system must log a permanent record of the attestation:

  - User ID, Role, and Timestamp.

  - The **exact text of the declaration** at the time of the click (to protect the user from later template wording changes).

- **Visual Distinction:** Use a distinct \"Undertaking\" icon (e.g., a Shield or Gavel) in the panel to signify that this task carries legal weight.

**3. Acceptance Criteria (QA Detailing)**

**AC 7.1: Undertaking Configuration (Seeding)**

- **Action:** In Seeding Phase, select Completion Criteria: Undertaking.

- **Requirement:**

  - Enter Declaration Text (e.g., \"I confirm all original documents were sighted\").

  - Select Owner (e.g., Operations Checker).

  - Select Stage (e.g., Checker Approval).

- **Expected Result:** The task is saved and correctly linked to the specific workflow lifecycle point.

**AC 7.2: Universal Visibility / Conditional Interaction**

- **Scenario:** Application is in the \"Maker Draft\" stage. A task \"Compliance Sign-off\" is assigned to \"Checker Approval\" stage.

- **Action:** Log in as **Maker**.

- **Expected Result:**

  - The Maker **can see** the \"Compliance Sign-off\" task in the checklist panel.

  - The checkbox is **Disabled** (Greyed out).

  - A tooltip appears: \"Actionable only during Checker Approval stage.\"

**AC 7.3: Role-Locking at the Correct Stage**

- **Scenario:** Application moves to the \"Checker Approval\" stage.

- **Action:** A user with the \"Viewer\" or \"Maker\" role tries to click the checkbox for a \"Checker-owned\" undertaking.

- **Expected Result:**

  - The system prevents the click.

  - A message appears: \"Only the assigned Operations Checker can sign this declaration.\"

**AC 7.4: The Hard-Stop Gatekeeper**

- **Scenario:** A mandatory Undertaking for the current stage is unticked.

- **Action:** The Checker attempts to click \"Approve/Submit.\"

- **Expected Result:**

  - Submission is blocked.

  - The checklist panel auto-expands to the relevant category.

  - Error message: \"Mandatory attestation missing.\"

**AC 7.5: Persistence of Declaration Text**

- **Action:** A user signs an undertaking. Later, an Admin changes the text of that undertaking in the Master Template.

- **Verification:** View the Checklist Instance for the completed application.

- **Expected Result:** The Checklist Instance must still display the **original text** that the user signed, not the new updated text.

**Module 8: Deferral Management (Simplified Phase 1)**

**Azure DevOps ID:** TBD

**Module Description:** This module allows users to unblock a workflow when a mandatory requirement (document or check) cannot be met immediately. In Phase 1, marking a task as \"Deferred\" satisfies the Gatekeeper logic, allowing the application to proceed. The system captures the intent, a target resolution date, and a reason for audit purposes.

**1. Notification Events**

| **ID** | **Status**        | **Recipient**      | **CC**                    | **Subject**                                        | **Body**                                                                                                                   |
|--------|-------------------|--------------------|---------------------------|----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| N8.1   | **Task Deferred** | CA group/Ops group | Current User who deferred | Alert: Mandatory Task Deferred for \[Workflow ID\] | A mandatory task \"\[Task Name\]\" has been deferred for \[Facility/App Name\] by \[User Name\]. **Target Date:** \[Date\] |

**2. Important Considerations (Developer \"Gotchas\")**

- **Gatekeeper Logic (Unblocking):** The \"Submit\" button logic must treat a status == DEFERRED exactly the same as status == COMPLETED.

  - *Formula:* Can_Submit = (All Mandatory Tasks are Completed OR Deferred).

- **Target Date Validation:** The \"Deferred Until\" date must be a **future date**. The system should not allow a user to pick today or a past date.

- **State Visualization:** Deferred tasks must use a distinct UI state (e.g., a **Purple Clock icon**) to differentiate them from tasks that were actually performed.

- **Immutability of Reason:** Once a deferral is submitted, the \"Reason\" and \"Target Date\" should be logged in the audit trail. In Phase 1, since there is no handshake, the user can \"Update\" the deferral, but each update must create a new audit log entry.

- **Task Persistence:** A deferred task **stays in the checklist**. Even after the application is submitted or approved, the task remains \"Pending Resolution.\" If a document is uploaded later, the status should transition from \"Deferred\" to \"Completed.\"

**3. Acceptance Criteria (QA Detailing)**

**AC 8.1: Deferral Trigger & Modal**

- **Action:** Click the \"Three Dots\" menu on a Mandatory Task and select \"Defer Task.\"

- **Expected Result:**

  - A modal opens.

  - Fields: Defer Until Date (Mandatory), Reason for Deferral (Mandatory Text Area).

  - Clicking \"Cancel\" closes the modal without changing the task state.

**AC 8.2: Validation of Deferral Inputs**

- **Action:** Try to click \"Submit Deferral\" with an empty reason or a past date.

- **Expected Result:**

  - System prevents submission.

  - Errors: \"Reason is required\" and \"Date must be in the future.\"

**AC 8.3: The \"Unblock\" Effect (Gatekeeper)**

- **Scenario:** Application has 1 Mandatory Task remaining (Incomplete). The main \"Submit\" button is currently **Disabled**.

- **Action:** Defer the remaining task.

- **Expected Result:**

  - The task status icon turns into a **Purple Clock**.

  - The Checklist Counter updates (e.g., from 4/5 to 5/5).

  - The main \"Submit\" button on the application form is immediately **Enabled**.

**AC 8.4: Real-time Notification Trigger**

- **Action:** Complete a deferral for a Mandatory Task.

- **Verification:** Check the notification logs/outbox.

- **Result:** Event N8.1 must be triggered immediately, sending an alert to the Checker/Risk role.

**AC 8.5: Post-Deferral Resolution**

- **Scenario:** A task is currently \"Deferred.\"

- **Action:** The user uploads the missing document required for that task.

- **Expected Result:**

  - The status must change from \"Deferred\" (Purple Clock) to \"Completed\" (Green Checkmark).

  - The audit log must show the transition from Deferred -\> Completed.

You are absolutely right. Since the **Description** field already exists in the task schema (Max 256 characters), we should utilize it as the primary medium for instructions. Adding a separate \"Note\" section would be redundant and clutter the database.

Here is the final, streamlined version of **Module 9**.

**Module 9: Ask Management (Ad-hoc Task Injection)**

**Azure DevOps ID:** TBD

**Module Description:** This module allows users to inject new, transaction-specific mandatory requirements into the checklist \"Instance.\" By using the existing Task schema, users can assign work to specific roles. The **Description** field serves as the communication channel where the \"Adder\" explains the requirement to the \"Receiver.\"

**1. Notification Events**

| **ID** | **Status**               | **Recipient**              | **CC**  | **Subject**                                        | **Body**                                                                                                                                        |
|--------|--------------------------|----------------------------|---------|----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| N9.1   | **Ad-hoc Task Assigned** | Task Owner (Assigned Role) | Creator | Action Required: New Task Added to \[Workflow ID\] | A new task \"\[Task Name\]\" has been added to the checklist for \[Facility/App Name\] by \[User Name\]. **Instruction:** \[Task Description\]. |

**2. Important Considerations (Developer \"Gotchas\")**

- **Schema Re-use:** Ad-hoc tasks must use the exact same data structure as template tasks (Name, Category, Description, Owner, Completion Criteria). There is no \"Notes\" field; all context must be provided in the **Description**.

- **Default Mandatory:** To ensure compliance, all tasks injected via Ask Management are **Mandatory** by default. They cannot be marked as \"Optional.\"

- **Role-Based Interaction:** The task is only \"Actionable\" (upload allowed, checkbox clickable) if the logged-in user\'s role matches the Owner field of the ad-hoc task. For all other roles, it is \"View-Only.\"

- **Zero-Propagate Rule:** Developers must ensure these tasks are saved to the Checklist_Instance_Tasks table and never the Checklist_Template_Tasks table.

- **Terminology:** Use the term **\"Task\"** exclusively across all UI and notifications.

**3. Acceptance Criteria (QA Detailing)**

**AC 9.1: Ad-hoc Task Creation (Using Existing Fields)**

- **Action:** Click \"+ Add Task\" in the expanded checklist.

- **Requirement:**

  - Enter **Task Name** (e.g., \"Verify Signature on Page 4\").

  - Enter **Description** (e.g., \"The signature on the board resolution appears different from the ID; please verify with the client\").

  - Select **Owner** (e.g., Operations Maker).

  - Select **Completion Criteria** (e.g., Text Response).

- **Expected Result:** The task is created. The \"Description\" provides the full context to the Maker without needing an extra field.

**AC 9.2: Targeted Actionability**

- **Scenario:** A Checker adds a task assigned to the \"Operations Maker.\"

- **Action:** Log in as the **Checker** and try to complete the task you just created.

- **Expected Result:** The \"Complete\" checkbox or \"Upload\" button is **Disabled** for the Checker. The system identifies them as the \"Adder,\" but only the \"Owner\" (Maker) can fulfil it.

**AC 9.3: Completion via Text Response**

- **Requirement:** An ad-hoc task is created with \"Text Response\" as the criteria.

- **Action:** The Task Owner types: \"Verified with client via phone on 12-Feb; signature is valid.\" and clicks \"Complete.\"

- **Expected Result:**

  - The task turns **Green**.

  - The response is saved and displayed in the task details for auditors.

**AC 9.4: Hard Gate Enforcement**

- **Scenario:** A user attempts to \"Approve\" or \"Submit\" a workflow while an ad-hoc task is still \"Incomplete.\"

- **Expected Result:**

  - Submission is blocked.

  - The FAB counter shows the task as pending (e.g., 5/6).

  - The category containing the ad-hoc task is highlighted in **Red**.

**AC 9.5: Notification Content Verification**

- **Action:** Trigger notification N9.1.

- **Verification:** Ensure the email/in-app notification body includes the string from the **Description** field of the task.

**Module 10: External Integration (Client Portal Visibility)**

**Azure DevOps ID:** TBD

**Module Description:** This module integrates the internal checklist with the External Client Portal. Visibility is strictly controlled by **User-Role assignment**. Clients only see tasks where their specific role is the \"Owner.\" This allows clients to fulfil document or undertaking requirements directly within their portal while allowing internal staff to maintain quality control through a manual verification handshake.

**1. Notification Events**

| **ID** | **Status**              | **Recipient** | **CC**            | **Subject**                                           | **Body**                                                                                                                                                       |
|--------|-------------------------|---------------|-------------------|-------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| N10.1  | **Ad-hoc Task Created** | Client User   | Adhoc Task Author | Action Required: New Requirement for your Application | A new task \"\[Task Name\]\" has been added to your application checklist for \[Facility/App Name\]. Please log in to the portal to complete this requirement. |

*Note: As per requirements, no other notifications (Review Pending or Rejections) are triggered. Users track status updates via their respective dashboards.*

**2. Important Considerations (Developer \"Gotchas\")**

- **Role-Based API Filtering:** The API endpoint serving the Client Portal must strictly enforce a \"Double Lock\" filter:

  - Filter 1: Current Workflow_ID.

  - Filter 2: Owner_Role == \"Client\".

  - *Result:* Clients only see their own tasks. Internal-only tasks (Compliance, Credit Review) are never exposed to the external API.

- **Ad-hoc Notification Trigger:** Notification N10.1 must **only** fire when a user creates an Ad-hoc task (Module 9) and assigns the \"Client\" role as the Owner during the execution phase. Template-based tasks do not trigger this event.

- **The Manual Verification Handshake:**

  - When a client completes a task (uploads a file), the internal status changes to **\"Review Pending\" (Orange Circle)**.

  - The task is **not** auto-completed. An internal user (Maker) must manually review and click **\[Accept\]** or **\[Reject\]**.

- **Submission Block:** The internal \"Submit\" button remains disabled as long as any mandatory task assigned to the \"Client\" role is in a \"Pending,\" \"Review Pending,\" or \"Rejected\" state.

**3. Acceptance Criteria (QA Detailing)**

**AC 10.1: Role-Based Visibility (Portal)**

- **Setup:**

  - Task A: Owner = Operations Maker (Internal).

  - Task B: Owner = Client (External).

- **Action:** Log in to the Client Portal for the specific Workflow ID.

- **Expected Result:**

  - Task B is visible and interactive.

  - Task A is **completely hidden** (not even visible as read-only).

  - The API response contains zero data regarding Task A.

**AC 10.2: Ad-hoc Notification Trigger**

- **Action:** An internal user adds an Ad-hoc task and sets Owner = **Client**.

- **Expected Result:**

  - Notification N10.1 is triggered to the Client.

- **Test Case 2:** An internal user adds an Ad-hoc task and sets Owner = **Operations Checker**.

- **Expected Result:** Notification N10.1 is **NOT** triggered (as it is internal-only).

**AC 10.3: Internal Review Handshake**

- **Action:** Client uploads a document for their assigned task.

- **Expected Result:**

  - On the internal checklist panel, the task icon changes to **Orange (Review Pending)**.

  - The internal user sees two options: **\[Accept\]** and **\[Reject\]**.

  - The internal FAB completion counter does not increment yet.

**AC 10.4: Verification Logic (Accept/Reject)**

- **Action A:** Internal user clicks **\[Reject\]**.

  - *Result:* Task reverts to \"Pending\" status on the Client Portal. No notification is sent.

- **Action B:** Internal user clicks **\[Accept\]**.

  - *Result:* Task turns **Green (Complete)** on both the Internal and Client panels. The internal FAB counter increments (e.g., 4/5 -\> 5/5).

**AC 10.5: Client Task Gatekeeping**

- **Scenario:** A client has not yet uploaded a mandatory document.

- **Action:** Internal Maker attempts to \"Submit\" the application.

- **Expected Result:**

  - Submission is blocked.

  - The checklist panel highlights the Client-owned category in **Red**.

  - Message: \"Client requirements pending completion.\"

**Module 11: Role Visibility & Locking (Workflow-Bound States)**

**Azure DevOps ID:** TBD

**Module Description:** This module ensures the security and integrity of the Checklist Service by enforcing role-based access controls and segregation of duties. It binds the state of the checklist instance to the unique **Workflow ID** and the current **Lifecycle Stage**. While most tasks are visible to all internal users for transparency, they are only \"Interactive\" for the user whose role matches the Task Owner and whose current stage matches the Workflow Stage.

**1. Notification Events**

| **ID** | **Status** | **Recipient** | **CC** | **Subject** | **Body**                                                                                        |
|--------|------------|---------------|--------|-------------|-------------------------------------------------------------------------------------------------|
| ---    | **None**   | ---           | ---    | ---         | This module is a security/state-management layer and does not trigger standalone notifications. |

**2. Important Considerations (Developer \"Gotchas\")**

- **Workflow State Persistence:** The checklist instance must be \"Stateful.\" Every interaction (Upload, Check, Defer) must be saved immediately to the database against the Workflow_ID. The state must persist even if the user refreshes the page or logs out.

- **The \"Passive\" View:** Internal users who are not the \"Task Owner\" must still see the tasks to understand the progress of the application.

  - **UI Requirement:** Non-actionable tasks must be rendered with a **Grey background** and **Disabled inputs**.

- **Stage-Gate Enforcement:** A task might be assigned to a \"Maker,\" but if the workflow has already moved to the \"Checker Approval\" stage, the Maker can no longer modify that task. The checklist becomes \"Read-Only\" for the previous stage owners.

- **Concurrency Handling:** If two users with the same role (e.g., two Operations Makers) open the same checklist, the system must handle \"Last-In-Wins\" or provide a warning if a document is being replaced simultaneously.

- **Audit-Ready States:** Every change in visibility or interaction state (e.g., when a task becomes enabled because the stage changed) does not need a log, but the **result** of the interaction (the click/upload) must always capture the user\'s role at that specific time.

**3. Acceptance Criteria (QA Detailing)**

**AC 11.1: Workflow ID Binding & Persistence**

- **Action:**

  - Open Application \#101 and complete 3 tasks.

  - Close the browser.

  - Log back in and open Application \#101.

- **Expected Result:**

  - The checklist must automatically load the instance for \#101.

  - All 3 tasks must remain in the \"Complete\" state.

  - The FAB counter must show 3/X.

**AC 11.2: Interaction Locking (Segregation of Duties)**

- **Setup:** Task A is owned by \"Operations Maker.\" Task B is owned by \"Operations Checker.\"

- **Action:** Log in as **Operations Maker**.

- **Expected Result:**

  - Task A has an active checkbox/upload button.

  - Task B is visible but has a **Grey background** and the checkbox is **Disabled**.

  - Hovering over Task B displays: \"Owned by Operations Checker.\"

**AC 11.3: Stage-Driven Actionability**

- **Scenario:** A checklist task is assigned to \"Operations Maker\" for the \"Maker Draft\" stage.

- **Action:** The Maker completes the work and submits the application to the Checker. The workflow is now in \"Checker Approval\" stage.

- **Expected Result:**

  - The Maker opens the checklist again.

  - All their tasks (which they previously owned) are now **Read-Only**.

  - The Maker cannot \"Uncheck\" or \"Delete\" documents once the stage has progressed.

**AC 11.4: Universal Internal Visibility**

- **Action:** Log in as a \"Viewer\" role (e.g., Risk Officer) who does not own any tasks.

- **Expected Result:**

  - The user can open the FAB and expand all category tabs.

  - All tasks are visible (Status, Name, Description, and any uploaded documents).

  - All tasks are 100% Read-Only (Passive View).

**AC 11.5: Role Mismatch Prevention (API Security)**

- **Action (Technical):** Attempt to trigger a \"Complete Task\" API call for a Checker-owned task using a Maker\'s authentication token.

- **Expected Result:** The server must return a 403 Forbidden error, ensuring that UI-level \"locking\" is also enforced at the database/API level.

**End of Phase 1**
