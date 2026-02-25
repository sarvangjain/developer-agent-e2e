TRADE FINANCE  
Credit Memo Automation PRD  
  
STAKEHOLDERS:

| NAME       | ROLE      | DEPARTMENT               |
|------------|-----------|--------------------------|
| Abhishek B | Author    | Product                  |
| Neeraj G   | Reviewer  | Product                  |
| Poomesh M  | Reviewer  | Finance                  |
| Priyanka R | Reviewer  | Operations               |
| TBD        | Dev       | Development              |
| TBD        | Test      | Quality Assurance        |
| Pankaj W   | Developer | Oracle Fusion Middleware |

DOCUMENTATION:

| DOCUMENT                     | OWNER           | LINK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|------------------------------|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Wireframe                    | Abhishek B      | Refer Ticket for Attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Figma                        | Krishnamorthy   | TBD                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| EPIC                         | Abhinav S       | [Link](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/216201)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Postman/ Swagger             | Pankaj Waghmare | TBD                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Oracle Fusion Integration KT | Abhishek B      | [Link](https://teams.microsoft.com/l/meetingrecap?driveId=b%21_grrEb1ti0OPdZ667g1rF4sWl7zsKERKofevXukmPGRnK3oDcwsyR7XK7djm5B-Q&driveItemId=01HLVJK7IDITCD4VAKT5DZ4WQSH6QWGF4H&sitePath=https%3A%2F%2Fdpworld-my.sharepoint.com%2F%3Av%3A%2Fp%2Fpankaj_waghmare1%2FEQNExD5UCp9HnloSP6FjF4cB5qZODglgWiSUoJfcqwLOGw&fileUrl=https%3A%2F%2Fdpworld-my.sharepoint.com%2Fpersonal%2Fpankaj_waghmare1_dpworld_com%2FDocuments%2FRecordings%2FCredit%2520memo%2520api-20250416_133136-Meeting%2520Recording.mp4%3Fweb%3D1&iCalUid=040000008200E00074C5B7101A82E008000000005F8060883AADDB010000000000000000100000001E394F0AD701DC469623A9C1EBC5E65F&threadId=19%3Ameeting_MzhkOTQ5MDQtZjVhNC00NDVjLTliYTEtNmNjODM5MGQ5YjEz%40thread.v2&organizerId=84fde7c2-897c-4e21-bbb0-5070195a1b2d&tenantId=2bd16c9b-7e21-4274-9c06-7919f7647bbb&callId=19c876c5-efd4-4ac5-bcca-332e1bd0c2cb&threadType=Meeting&meetingType=Scheduled&subType=RecapSharingLink_RecapCore) |

TIMELINES:

<table>
<colgroup>
<col style="width: 13%" />
<col style="width: 29%" />
<col style="width: 16%" />
<col style="width: 40%" />
</colgroup>
<thead>
<tr class="header">
<th>VERSION</th>
<th>UPDATE</th>
<th>DATE</th>
<th>COMMENT</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>0.1</td>
<td>Initial Draft</td>
<td>24-Apr-25</td>
<td>Added all relevant module</td>
</tr>
<tr class="even">
<td>0.2</td>
<td>Review Round 1</td>
<td></td>
<td>Product</td>
</tr>
<tr class="odd">
<td>0.3</td>
<td>Review Round 2</td>
<td></td>
<td>Development</td>
</tr>
<tr class="even">
<td>0.4</td>
<td>Tech and Design Grooming</td>
<td></td>
<td>Quality Assurance</td>
</tr>
<tr class="odd">
<td>0.5</td>
<td>Development Queue 279478</td>
<td>18-Nov</td>
<td>Add support for Fund Returned Cases</td>
</tr>
<tr class="even">
<td>0.6</td>
<td>Development Queue 279306</td>
<td>22-Dec</td>
<td>Fix the Credit Note Created date on Arranging to ensure successful creation</td>
</tr>
<tr class="odd">
<td>0.7</td>
<td><p>Development Queue</p>
<p>279460</p></td>
<td>26-Dec</td>
<td>Rename Credit Memo to Credit Note</td>
</tr>
</tbody>
</table>

TABLE OF CONTENTS

DEFINITIONS 1

BACKGROUND 3

PROBLEM STATEMENT 3

SCOPE LIMITATION 4

CURRENT PROCESS 5

REVISED PROCESS 6

REQUIREMENTS 8

APPENDIX 15

**DEFINITIONS:  
**

**Credit Memo**: A financial document issued to reduce or eliminate an outstanding Account Receivable balance. In Oracle Fusion, this can be created via an extended API, allowing for programmatic generation of credit memos against existing invoices.

**Journal Voucher**: An accounting entry that records financial transactions in the general ledger, typically used for internal accounting adjustments that don\'t involve external parties. This is the existing process used by the DPWFS finance team to reduce the receivables.

**Account Receivable (AR)**: Money owed to a business by its customers for goods or services delivered but not yet paid for. In Oracle, ARs are tracked as outstanding invoices awaiting payment. We create AR for Principle, Fees and Charges.

**VAT (Value Added Tax)**: A consumption tax placed on products and services whenever value is added at each stage of the supply chain. In Oracle, VAT calculations and reporting are handled through the tax module. Our VAT calculation will be dependent on the Oracle Party's Incorporation Country.  
Since DPWFS is registered in Dubai Free trade zone, certain services like Transaction fee can be deemed Exports and can attract 0% VAT in case the AR is created against an Oracle Party that is outside the UAE.

**Oracle Party**: A record in Oracle that represents any entity (customer, supplier, partner) with which the organization conducts business. Each party has a unique identifier and associated attributes.

**Credit Memo Number**: A unique identifier assigned to each credit memo document, following a specific numbering sequence defined in Oracle.

**Invoice Reference Number**: A unique identifier that links a credit memo to its original invoice, ensuring proper application of credits against specific AR items.

**Credit Memo Narration**: The explanatory text included in a credit memo that provides justification or reason for issuing the credit. This is where we will pass the key reason to apply the reversals.

**Oracle Fusion**: Oracle\'s cloud-based enterprise resource planning (ERP) application suite that includes financials, procurement, project portfolio management, and other modules. We have our Oracle Fusion Middleware managed within DP World.

**Receivables Module**: The Oracle component that manages customer invoicing, payment processing, and accounts receivable activities.

**Sub-ledger Accounting**: The Oracle process that creates accounting entries from transactions, maintaining detailed accounting information before transferring to the general ledger.

**AR Adjustments**: Modifications to receivables transactions, including credit memos, to correct errors or reflect business agreements with customers.

**Application Rule Set**: Defines how payments and credits are applied to invoices based on configurable business rules in Oracle.

**Auto-Application**: The automated process in Oracle that applies credit memos to invoices based on predefined rules. This ensures that we don't have to pass the Journal entry ourselves and Oracle does it for us.  
  
**Cash Application**: The process of applying receipts and credits to open invoices to reduce AR balances.  
  
**Aging Report**: A financial report showing unpaid invoices categorized by time periods, which may be affected by credit memo applications. This is used by Poomesh (Finance) Team to find out how much money is due to DPWFS.

**Annual Facility Fees (AFF)**: A periodic fee charged by DPWFS (our lending entity) to the borrower. AFF is charged and an AR for AFF is raised once the Facility setup is completed (Approved by Legal). AR for Facility has their own Start and End date that helps Oracle set correct Tenor and spread the Charge over said tenor.

BACKGROUND:

Credit memo is a tool used under Oracle to reduce an Accounts Receivable for our Trade Finance business. It represents a reduction in AR due to returns, discounts, or billing corrections. We use Credit Memos under the following scenarios:  
  
1. Annual Facility Fee reversal

2\. Interest overcharge reversal

3\. Reduce any Charge on Application at time of settlement  
4. Funds returned scenario if Applicant's bank refuses to receive funds  
  
Since inception, Finance team has been using a manual Journal Voucher Approach where they Debit one account and Credit the AR account to reduce it. This is an internal record keeping entry and does not create any document to the customer.  
While this may work for smaller entries, we are now progressing to Half a billion USD in Disbursals for FY 25 and we need to now move to a more formal and automated setup.  
  
Note:  
As per the discussion on "When Credit Memo should be applied" held on 30^th^ Jun 2025.  
  
Background

Core Constraint:  
We can only create a credit note against a valid AR number. Hence, AR needs to be present in Oracle before we can start the process of reducing the client\'s AR liability.

Settlement Workflow Design:  
In our settlement workflow for any loan application, we have the option for the operations team to waive overdue interest. This requires operations maker checker workflow before the overdue to be waived off. Once overdue is waived off, we do not create any AR for the overdue charges. This ensures that we do not create any unnecessary charges AR in the Oracle unless they are explicitly being approved by the Operations team.

Receipt Allocation Flexibility:  
At the time of settlement, we allow the operations team to choose how they want to use the receipts to clear the loan application between principal, interest, and charges (user can use this for any tweaks in the amount as long as the sum of the tweaks is not larger than the receipt\'s available balance).

How Credit Notes Work

AR Availability: Credit notes dropdowns can populate the ARs that are available in Oracle. Overdue charge AR can come up only after settlement. The same goes for Interest amount (for the period which has not been accounted in oracle - previous month\'s interest AR would be present).

Business Scenario Example

Initial Situation

Ops comes to settle the application of \$100 containing: \$80 Principal, \$10 as Interest and \$10 as Overdue interest

Client contests and says \"I will only pay \$80 and will not give interest or overdue amount\" (due to bad experience or anything)

Internally Ops (through email chain or Teams communication) get signoff from Business head to take the hit of \$20 and Business team approves it

**Process Execution**

Step 1: Waive Overdue (Before Settlement)

1.1 Ops starts the workflow to waive the overdue charge if required and get it approved. This is done before the settlement is completed for the application

1.2 Since Overdue charges are now Zero, the total outstanding on the application is \$80 Principal and \$10 Interest. The Receipt we have from Accounting Module based on Client\'s payment is of \$80

Step 2: Settlement with Receipt Allocation

2.1 Now the Ops team will use this \$80 and apply it in whatever split between interest and Principal as they deem fit:

2.2 They can apply \$80 for principal and leave interest as \$0, OR

As convention, they will apply \$10 in interest and leave \$70 in Principal

In either case, we have a deficit of \$10

Step 3: Settlement Outcome

3.1 The application would either be:

(a) Settled with short amount of \$10 rendered on the screen, OR

(b) Partial settled (in case the short amount is more than \$400 for higher applications)

Step 4: Oracle AR Status After Settlement

4.1 On the accounting end:

Principal AR: Already existed, so we only update with the Receipt

Interest AR: For the \$3 (assuming \$7 was already existing from previous months) would be created

4.2 Since no money was available for setting off Interest, the AR for Interest is still open while the Principal AR is closed

Step 5: Credit Note Process

5.1 Here is when Ops can click on \"Update Application\" and then visit the Credit Memo section to start the process:

5.1.1 Select the Interest AR from dropdown (now available in Oracle)

5.1.2 Enter the entire \$10 amount

5.1.3 Proceed with Maker Checker flow to finally approve the AR

Step 6: Final State

6.1 The short amount of \$10 will be removed from the application and instead we will showcase the credit note amount in the credit note component

**Key Summary:**

Critical Understanding: The user has to wait for ARs to be created in Oracle before they can create credit notes. This is why:

(a) Overdue charge ARs only appear after settlement

(b) Current month interest ARs are created during settlement

(c) The credit note dropdown is populated from actual Oracle AR records

**Workflow Sequence:**  
Waiver → Settlement → AR Creation → Credit Note (each step must complete before the next can begin)  
  
  
**PROBLEM STATEMENT:**  
  
1. Entire process of adjusting ARs for Fees/Charges/Principle is manual and needs to be automated to reduce any reconciliation issues.

2\. Current approach of Journal voucher creation to account for any reduction is AR is not a preferred approach as it does not settle the original AR and may cause the following issues:  
  
2.1 The original AR which should have been reduced does not get reduced. AR Aging report that tells us how much to collect would be incorrect  
  
2.2 There will be a trial balance mismatch between the AR Subledgers and Main Ledger  
  
2.3 The adjustment of VAT never takes place as JV are done on main ledger and not subledger where Oracle could adjust the VAT  
  
2.4 No Customer related document like a Credit Note is issued so in case customer has applied for Input tax credit then he/she will never know the reversal of Tax he/she needs to make.  
  
2.5 No Audit trail is ever to be found, unless the Finance manager explicitly records the AR in the Narration during Journal voucher entry

3\. The present Interest overcharge issue requires manual intervention monthly leading to annually 100H lost between Finance team

**SCOPE LIMITATION:**  
  
1. Credit Memo can only be generated with an Invoice reference number, i.e we can only generate a memo against a valid account receivable. We do not allow a general credit memo to be created on Oracle that can be adjusted later.

2\. Excess Funds for the Funds received from the customer will not come under the scope. This activity has to be driven by the Finance team offline with the customer.  
  
3. Credit Memo once approved, cannot be reversed through the API. The Finance team already has a Maker and Checker process to ensure they know the exact amount of Credit Note being adjusted against an AR. In adverse case, Finance team can cancel the credit memo from the Oracle Fusion.

4\. Credit Memo Format is not specified by the Finance Team till the date of creation of this PRD, hence we will not generate any Credit memo template that can be submitted to our clients.

5\. Funds returned scenario already has a defined workflow on the LMS platform and it involves AR and AP setoffs. While we can set off the AR, the AP cannot be setoff till we get the AP update API. We will pick the Funds returned in Phase 2.

6\. Charge reversals are not a common occurrence on the platform. Overdue Interest AR is created only at the time of settlement and can be adjusted by the Operations team so we don't have to set off Overdue Interest with Credit Memo. We will pickup charge reversal scenario in Phase 2.

**CURRENT PROCESS:  
**

**Step 1:** Request to correct AR received through either of the two channels: 1. Direct Email notification at the end of the month to fix excess interest charged across applications. 2. From Growth/Operations team for specific Annual Facility Fees or any Chargeback requests.  
  
**Step 2:** No Credit Memo related workflow exists, these requests are offline in nature and are addressed over emails. Once a Request is received, Finance Manager would manually create a Journal Voucher that essentially reduces the Revenue account and pass narration that "Discount on AFF extended".  
  
**Step 3:** No entry is passed in the subledger for that specific customer's account, leading to a mismatch in the Trial balance of individual ledgers and the main Ledger.  
  
**Step 4:** As no workflow is managed, there is no automatic communication to either internal admins or the client. Finance team would inform Operations who indirectly raise the correct invoices and close the transactions.

**REVISED PROCESS:**

**Step 1:** Request to correct AR received directly on the Platform from the following modules: 1. AFF revamp module with dedicated Credit Memo generation submodule. 2. ~~Scheduler running~~ (confirmed that this is not a scheduled job in the code but rather a per application job (triggered at the time of settlement if there is a past-dated settlement). )at the end of the month to correct the over-interest charged on the customer's outstanding amount in case of late repayment tagging by the operations. 3. Chargeback or reduction request directly on the application through dedicated section.  
  
**Step 2:** Workflow for Credit Memo will be generated for any explicit request made to the Finance Manager. For requests made from the Scheduler, no explicit consent required from the Finance Manager; A notification of all fixed interest ARs will be generated and shared at the starting week of each month (for the previous month's corrections).  
  
**Step 3:** Workflow initiated by the Finance Manager will be approved by another Finance Manager on the platform before the request is sent to Oracle through the Credit Memo Creation API.  
  
**Step 4:** Once Oracle reverts on the Credit Memo request, the success or failure message would be updated in the Status as a lifecycle stage and email communication would be shared with the Finance Manager(s) (Maker and Checker both).

**REQUIREMENTS:**  
  
**1. Credit Memo API Integration:**  
Oracle Fusion team has extended an API to Create Credit Memos. This API is to be used to communicate with the Oracle Accounting system. We had the following session with Oracle Fusion team for Integration KT. You can access it [here](https://teams.microsoft.com/l/meetingrecap?driveId=b%21_grrEb1ti0OPdZ667g1rF4sWl7zsKERKofevXukmPGRnK3oDcwsyR7XK7djm5B-Q&driveItemId=01HLVJK7IDITCD4VAKT5DZ4WQSH6QWGF4H&sitePath=https%3A%2F%2Fdpworld-my.sharepoint.com%2F%3Av%3A%2Fp%2Fpankaj_waghmare1%2FEQNExD5UCp9HnloSP6FjF4cB5qZODglgWiSUoJfcqwLOGw&fileUrl=https%3A%2F%2Fdpworld-my.sharepoint.com%2Fpersonal%2Fpankaj_waghmare1_dpworld_com%2FDocuments%2FRecordings%2FCredit%2520memo%2520api-20250416_133136-Meeting%2520Recording.mp4%3Fweb%3D1&iCalUid=040000008200E00074C5B7101A82E008000000005F8060883AADDB010000000000000000100000001E394F0AD701DC469623A9C1EBC5E65F&threadId=19%3Ameeting_MzhkOTQ5MDQtZjVhNC00NDVjLTliYTEtNmNjODM5MGQ5YjEz%40thread.v2&organizerId=84fde7c2-897c-4e21-bbb0-5070195a1b2d&tenantId=2bd16c9b-7e21-4274-9c06-7919f7647bbb&callId=19c876c5-efd4-4ac5-bcca-332e1bd0c2cb&threadType=Meeting&meetingType=Scheduled&subType=RecapSharingLink_RecapCore).  
  
The API will have the following fields:  
  
1.1 Requested payload fields

<table>
<colgroup>
<col style="width: 21%" />
<col style="width: 29%" />
<col style="width: 18%" />
<col style="width: 29%" />
</colgroup>
<thead>
<tr class="header">
<th>VARIABLE</th>
<th>DEFINITION</th>
<th>EXPECTED VALUE</th>
<th>VALIDATION</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>CreditMemoCurrencyCode</td>
<td>Currency Code</td>
<td>"USD"</td>
<td>Product</td>
</tr>
<tr class="even">
<td>TransactionNumber</td>
<td>A Unique Transaction Reference passed by the user. We will hardcode this as “InvoiceRefNumber_CM”</td>
<td>"122333-CM"</td>
<td>Unique validation check present on the Middleware to ensure we don’t reuse same Memo against different ARs.</td>
</tr>
<tr class="odd">
<td>TransactionDate</td>
<td>Date on which Credit Memo is attached</td>
<td>"2025-03-26"</td>
<td>YYYY-MM-DD format</td>
</tr>
<tr class="even">
<td>TransactionType</td>
<td>Detailed pre-defined Transaction type. Refer Annexure.</td>
<td>"CM -Interest RCF",</td>
<td>Any value passed appart from the Listed Types will result in failure. Reach out to Indira to Define new Transaction Type before UAT testing</td>
</tr>
<tr class="odd">
<td>TransactionSource</td>
<td>Hardcoded to LMS</td>
<td>"LMS",</td>
<td>No other value other than LMS</td>
</tr>
<tr class="even">
<td>Comments</td>
<td>Helps get input from the Finance team on reason to raise the said Credit Memo</td>
<td>"Extra amount paid",</td>
<td>256 Character String with no special character allowed</td>
</tr>
<tr class="odd">
<td>CustomertrxId</td>
<td>15 digit unique ID received from Oracle at time of AR creation. Memo is applied to AR corresponding to this ID</td>
<td>1000003224323</td>
<td>15 digit</td>
</tr>
<tr class="even">
<td>AccountingDate</td>
<td>Accounting Date can be same as the Memo Creation date as it just defines the date on which we need to Account it</td>
<td>"2025-03-26",</td>
<td>Same validation of Memo Date</td>
</tr>
<tr class="odd">
<td>LineAmount</td>
<td>Amount we need to reduce from the AR</td>
<td>2222.99</td>
<td>Up to 4 decimal</td>
</tr>
<tr class="even">
<td>TaxAmount</td>
<td>Tax commensurate to Line Amount we need to reduce.<br />
Tax to be reduced from the AR.</td>
<td>22.99</td>
<td>Same as above</td>
</tr>
</tbody>
</table>

1.1 Requested Payload structure:  
{  
  \"CreditMemoCurrencyCode\": \"USD\",  
  \"TransactionNumber\": \"122333-CM\",\-\--\>Add validation for duplicate check  
  \"TransactionDate\": \"2025-03-26\",  
  \"TransactionType\": \"CM -Interest  RCF\",  
  \"TransactionSource\": \"LMS\",  
  \"Comments\": \"Extra amount paid\",  
  \"CustomertrxId\": 1000003224323,  
  \"AccountingDate\": \"2025-03-26\",  
  \"LineAmount\": 2222.99,  
  \"TaxAmount\": 22.99  
}  
  
1.2 Requested Payload response  
{

\"API Status\" : \"Success\",

\"API Message\" : \"Invoice created\",

\"CreditMemoTransactionId\" : 300000696408363

}  
  
**Important Note:**  
The Credit Memo Transaction ID needs to be stored and rendered on the LMS Platform. This is done to ensure that the Finance team is aware about the successful application of the Transaction ID.  
Further, we can have multiple Credit Memos issued against a single AR across the Tenor of the AR. All Credit Memo transactions IDs must be maintained in the background.  
  
1.3 Requested Payload Error code  
To be provided from Pankaj from the fusion team.

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 17%" />
<col style="width: 63%" />
</colgroup>
<thead>
<tr class="header">
<th>ERROR CODE</th>
<th>ERROR MESSAGE</th>
<th>LMS HANDLING</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>500-Service unavailable</td>
<td></td>
<td><p>Step 1. Move the application stage to “Credit Memo Accounting Resubmission Requested”<br />
<br />
Step 2. Add an Auto Message from the system stating:</p>
<p>“Oracle Credit Memo creation service unavailable. Please resubmit the application to retry.”</p></td>
</tr>
<tr class="even">
<td>401- Invalid request</td>
<td></td>
<td><p>Step 1. Move the application stage to “Credit Memo Accounting Resubmission Requested”<br />
<br />
Step 2. Add an Auto Message from the system stating:</p>
<p>“Oracle Credit Memo creation failed. Please review the error message below: ${error message provided by the handler}.”</p></td>
</tr>
</tbody>
</table>

1.4 Misc Requirement for said API:  
  
**1.4.1 Pre-call Validation checks:**  
Ensure all validations mentioned in the table above are run before the API is triggered. Example:  
(a) Unique check for the Transaction Number used in the API payload should be unique.  
  
(b) The AccountingDate variable should be within the start and end date of the original Invoice (AR).

\(c\) The Line amount and Tax amount can not be higher than the AR's actual balance and Tax values shared at the time of AR generation.  
  
(d) The Comment variable should not contain any special characters to prevent SQL injection.  
  
(e) The Credit Memo Currency code should be the same currency code as that of the Original AR. We can fetch this from the Credit Facility Reference.  
  
(f) Transaction Type ENUM should be seeded with Indira and the Fusion team well in advance and they should have access to all expected Transaction Types. The ones that are seeded currently are product specifc. We should use more generic codes instead.  
  
**1.4.2 Error Handling scenario:**  
(a) Downtime/Timeout handling:  
Follow these sequential steps:

**Step 1: Implement automatic retry mechanism**

(a) Retry the credit memo creation request after 30 seconds

(b) If the second attempt fails, continue retrying at 30-second intervals

(c) Limit total attempts to 4 (covering a 2-minute period)

**Step 2: Handle service unavailability or Invalid Request**

(a) If Oracle credit memo service remains unresponsive after all retry attempts then simply move the Credit Memo lifecycle stage to "Credit Memo Accounting Resubmission Pending".

(b) Once the status changes, the active user still is the Checker. The Checker would have to resubmit the application without making any change.

(c) In case the request was failed due to some error in the application payload ( although unlikely since we already validate all checks before sending the request to Oracle) we will render the error on the Comments section.

**1.4.3 Lifecycle Stage for Credit Memo  
**(a) Introduce the following lifecycle stage for Application:**  
**

| NAME                                                             | ACTIVE USER        | USE CASE                                                                                                                                                      |
|------------------------------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Credit Memo Review Pending with Operations Checker               | Operations Checker | When CM is submitted by the Operations Maker to the Checker                                                                                                   |
| Credit Memo Rework Pending with Operations Maker                 | Operations Maker   | When CM is requested for rework by the Operations Checker to Operations Maker                                                                                 |
| Credit Memo Rejected by Operations Checker                       | Operations Maker   | When CM is rejected by the Operations Checker                                                                                                                 |
| Credit Memo Review Pending with Finance Manager                  | Finance Manager    | When CM is submitted by the Opeartion Checker                                                                                                                 |
| Credit Memo Rejected by Finance Manager                          | Operations Checker | When Finance Manager rejects the Operations Maker's CM and ends the Credit Memo's lifecycle                                                                   |
| Credit Memo Accounting Resubmission Pending with Finance Checker | Finance Manager    | Once Finance Checker Approves a Credit Memo, we will hit Oracle, in case oracle returns an error then the application will be in Resubmission requested stage |
| Credit Memo Accounting Approved                                  | Finance Manager    | If Oracle approves the Credit Memo, then status changes to Credit Memo Accounting Approved                                                                    |

**2. Removal of Redundant Interest Overcharge Process:**

**2.1 Current Interest Overcharge Scenario**

\- The Loan Management System (LMS) computes interest on a daily basis

\- Interest Accounts Receivable (AR) is pushed to Oracle at month-end

\- Interest overcharges occur when client payments are not recorded timely due to bank reporting delays

\- Current process: Send consolidated email to finance team listing applications and excess interest

\- Finance team manually passes journal vouchers to reduce receivables

\- No explicit action needed on the platform as the system correctly adjusts actual interest

**2.2 New Process with Credit Memo API**

\(a\) Implement Credit Memo API to replace manual journal voucher process

\(b\) System shall automatically generate Credit Memos for interest overcharge adjustments

\(c\) Credit Memos shall be submitted through the system to Oracle

**2.3 Email Reporting Requirements**

\(a\) System shall generate a consolidated report for Finance team

\(b\) Report must include the following in a table format:

<table>
<colgroup>
<col style="width: 21%" />
<col style="width: 12%" />
<col style="width: 23%" />
<col style="width: 19%" />
<col style="width: 22%" />
</colgroup>
<thead>
<tr class="header">
<th>CLIENT NAME</th>
<th>APPLICATION</th>
<th>ACCOUNT RECEIVABLE NUMBER</th>
<th>TOTAL INTEREST REVERSED</th>
<th>CREDIT MEMO ID</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>PetroNash Chemicals FZE</td>
<td>1120042</td>
<td>1000341352312</td>
<td>USD 23.4532*<br />
<br />
*Ensure Currency is picked correctly from the AR’s currency</td>
<td>1000341352312_CM</td>
</tr>
</tbody>
</table>

**3. UI Change on the Application Section:**  
3.1 Important considerations:  
3.1.1 Create new Credit Memo Section on the Application page that can be accessible only when the Application has moved from the Funds Transferred stage. For rest of the time Credit Memo section should not be rendered.  
3.1.2 The Credit Memo section will be able to set off charges that are to be settled at the time of settlement. This is to ensure we create Memo only where the ARs are still open.  
  
3.1.3 The Credit Memo section should be accessible to the following user-roles:  
(a)Operations Maker, Only Read and Write access  
(b)Operations Checker, Only Read and Write access  
(c) Finance Manager, Read and Write access  
  
3.1.4 Credit Memo should contain the following information:

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 14%" />
<col style="width: 18%" />
<col style="width: 48%" />
</colgroup>
<thead>
<tr class="header">
<th>FIELD</th>
<th>LABEL</th>
<th>TYPE</th>
<th>VALIDATION</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Dropdown of Charges</td>
<td>Charge to be Waived</td>
<td>Dropdown</td>
<td>Only render charges whose AR has been created in the System</td>
</tr>
<tr class="even">
<td>Line Amount</td>
<td>Amount to be Waived</td>
<td>Numeric Input Box</td>
<td>4 decimal points and no negative value.<br />
<br />
The line amount should not be higher than the AR Line amount.</td>
</tr>
<tr class="odd">
<td>Tax Amount</td>
<td>Tax to be Waived</td>
<td>Read Only field</td>
<td>System should return the VAT percentage and UI should auto calculate the Tax Amount based on the Line Amount value.<br />
<br />
Example: if Line amount is 100 and the VAT is 5% then Tax should be rendered as 105.</td>
</tr>
<tr class="even">
<td>Comment</td>
<td>Comment</td>
<td>Text Input field with Stretch element</td>
<td>No special Characters.<br />
Only 200 Characters max.</td>
</tr>
</tbody>
</table>

  
**Note:** Based on discussions with Operations, interest and overdue interest are the only charges typically contested by clients during settlement. Interest is contested when the client\'s repayment date differs from DPWFS\'s actual receipt date, as clients resist paying for the period when funds were in transit. Similarly, overdue interest is frequently waived by operations when clients made payments on time, regardless of when DPWFS actually received the funds.  
  
3.1.5 Ability to add more than one Charge for Settlement:  
The Operations Maker can add more than one Charge for waiver at time of Credit Memo Creation. The Summary fields at the bottom of the Credit Memo section will contain the following fields:

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 16%" />
<col style="width: 18%" />
<col style="width: 47%" />
</colgroup>
<thead>
<tr class="header">
<th>FIELD</th>
<th>LABEL</th>
<th>TYPE</th>
<th>VALIDATION</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Count of Charge to be waived</td>
<td>Charges count</td>
<td>Read only Field</td>
<td>Count of individual Charge request raised</td>
</tr>
<tr class="even">
<td>Line Amount Total</td>
<td>Total Amount to be Waived</td>
<td>Read only Field</td>
<td>=Credit Memo Amount/(1+ApplicableTaxRate)<br />
= INR 105/(1+0.05)=&gt; 100</td>
</tr>
<tr class="odd">
<td>Tax Amount Total</td>
<td>Total Tax to be Waived</td>
<td>Read only Field</td>
<td><p>= Credit Memo Amount – Line Amount</p>
<p>= INR 105-100</p></td>
</tr>
<tr class="even">
<td>Credit Memo Amount</td>
<td>Total Credit Memo(s) Amount</td>
<td>Input Field</td>
<td>Whole number, non-negative<br />
INR 105</td>
</tr>
<tr class="odd">
<td>Leftover amount in the Application</td>
<td>Application’s remaining Amount</td>
<td>Read only Field</td>
<td>Computed value of the Amount of the Application remaining after deducting the Credit Memo Amount.<br />
Since Most Memos will be applied at the time of settlement, the Operations team will likely raise the Memo to settle the Application and the Leftover Amount should ideally be 0.</td>
</tr>
</tbody>
</table>

3.2 Workflow:  
(a) Operation Maker -\> Operation Checker -\> Finance Manager  
  
(b) In case of Oracle Rejections/Errors, the Credit Memo comes back to Finance Checker for Resubmission.

3.3 History tab:  
The History tab should capture the edits between Operations and Finance Manager. This is to ensure that the field edited between the parties should be known to the next in line reviewer.  
  
3.4 Max Waiver Charge Count:  
There should be a limit of adding up to 10 Charges in a Credit Memo.  
  
3.5 Ability to add new Charges to Waiver only after first workflow is completed:  
(a) Unlike the Counterparty addition flow where we allowed the client to add new CP even when a request is already in queue of CA, here will we restrict the Operation Maker from adding a new Waiver to the Credit memo section till the previous request has been completed.  
  
(b) The Waivers that have been approved by the Finance Checker and has been accepted by Oracle should be non-editable and greyed out.  
  
  
  
  
  
  
  
**4. Email Notifications:**  
Credit Memo workflows will contain the following emails:

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operation Maker Submits Request for Credit Memo Review</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>All users with User-role of Operations Checker on LMS</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Review Request Received for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
A new Credit Memo Review Request has been made for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operation Checker Request for Credit Memo Resubmission</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Original Author of the Credit Memo</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Resubmission Request Received for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
Credit Memo Resubmission Request has been made for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operation Checker Rejected the Credit Memo</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Original Author of the Credit Memo</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Rejected for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
Credit Memo has been Rejected for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operation Checker Approved the Credit Memo and it goes to Finance Manager</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>All users with user-role as Finance manager</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Review Request Received for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
A new Credit Memo Review Request has been made for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Finance Manager Request for Credit Memo Resubmission</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Operation Checker who Approved the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Resubmission Request Received for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
Credit Memo Resubmission Request has been made for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Finance Manager Rejected the Credit Memo Request</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Operation Checker who Approved the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Rejected for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td>Dear Team,<br />
<br />
Credit Memo has been Rejected for Application ${Application_ID}.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operations team settled Application after Interest was already pushed to Oracle and now we need to reverse the additional interest via Credit Note</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Users with (Role Finance Manager + Operations Maker and Checker) approving the said Application</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Applied for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td><p>Dear Team,<br />
<br />
Financing Application ${Application_ID} was settled on ${Value Date from Txn used under settlement} after end of Month.</p>
<p>Additional Interest of ${Currency Type} ${Current Amount up to 4 decimal} between {Value date} and ${Last date of Month} has been reversed with Credit Note ${CreditNoteNumber}.<br />
<br />
No Further Action is required from your end.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 76%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>SCENARIO</strong></th>
<th>Operations team settled Application after Interest was already pushed to Oracle and after we reversed the additional interest via Credit Note, the Credit note failed</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong></td>
<td>Users with (Role Finance Manager + Operations Maker and Checker) approving the said Application</td>
</tr>
<tr class="even">
<td>CC (IF ANY)</td>
<td>NA</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong></td>
<td>Credit Memo Failed for Application ${Application_ID}</td>
</tr>
<tr class="even">
<td><strong>BODY</strong></td>
<td><p>Dear Team,<br />
<br />
Financing Application ${Application_ID} was settled on ${Value Date from Txn used under settlement} after end of Month.</p>
<p>Additional Interest of ${Currency Type} ${Current Amount up to 4 decimal} between {Value date} and ${Last date of Month} was sent for reversal but failed.<br />
Please resubmit the credit note to ensure the amount is reversed.<br />
<br />
You can review the request here &lt;link to ApplicationID&gt;<br />
<br />
Regards,</p></td>
</tr>
</tbody>
</table>

Change Request 1:  
Handling of Funds Returned Scenario using Credit Note Automation  
  
Background:  
When we disburse funds, there can be a scenario where the receiving bank may reject the proceeds and our bank would get the funds back after spending 5 days in purgatory. During these 5-7 days we would assume that the funds have been transferred and the Application would be in a Funds Transferred Stage. The Accounting and LMS software would have the Principal, Intrest and Charges as Outstanding and the Interest would keep on Accruing on the LMS and in some scenario even booked on Oracle.  
  
Current Funds Returned Workflow:  
**Step 1: Identification**  
An Operations team member notices a return of proceeds from the borrower\'s bank on our bank statement.

**Step 2: Transaction Categorization**  
The team member tags the Transaction Category as \"Funds Returned\" and updates the Application number(s) (in case it was a bulk proceed).

**Step 3: Application Status Update**  
Operations navigates to the Application and marks it as \"Funds Returned\" using the Funds Returned workflow (changing it from \"Funds Transferred\" status).

**Step 4: Receipt Details Update**  
They update the Receipt details to reflect that the initially disbursed proceeds have now been returned.

**Step 5: Operations Maker to Checker Review**  
The application is pushed to an Operations Checker, who verifies all the details and confirms the Funds Returned status.

**Step 6: Finance Manager Review**  
The application moves to the Finance Manager, who checks for any outstanding Interest or Charge Accounts Receivable.

**Step 7: Credit Note Processing (if applicable)**  
If receivables exist, the Finance Manager closes them with a Credit Note and enters the Credit Note number in the dedicated section on the Application\'s page.

**Step 8: Application Closure**  
Once all steps are completed, the application is marked as \"Closed.\"  
  
Proposed Flow with Credit Note Automation:  
Step 1 to 5 remains constant  
  
Step 6: Before the Application moves to the Finance Manger after the Operations manger's approval:  
  
Step 6.1 The LMS would check about all Open Accounts Receivable for said Application.  
  
Step 6.1.1 Further, we will see the overall interest that was accrued for the Application and create an Interest AR for the same. Failure to report the interest would lead to Interest Account mismatch at the end of the financial year.  
  
Step 6.1.2 Now that we have all original ARs + the new Interest ARs we will proceed to close them.  
  
Step 6.2.1 The LMS would then use the Receipt to close the Principal AR.  
  
Step 6.2.2 For Interest and Charges AR; since the entire Receipt would be consumed by the Principal AR, any other open AR has to be settled using a Credit note.  
  
Step 6.2.3 Since Credit note will be created using API, there can be chances of API failing and thus we would have to introduce a retry button on the UI for the Finance Manager.  
  
Step 6.3 In a Happy scenario where Principal AR is closed, Interest and Charges ARs are closed using Credit note, we will render the Credit Note Applied details under the Credit Note Section of the Application.  
  
Step 6.3.1 The Finance Manger would review the Credit notes applied against Interest and Charges on the LMS with the details present on Oracle and then would approve the Application and Close the workflow.  
  
Step 6.4 In not so happy scenario where the Interest and Charges ARs are not closed due the failed Credit Note. In such a scenario we will add a button on the UI to retry the API for the Finance Manager.  
  
Step 6.5 After getting the success from Credit Notes (Considered as Amount Status, the Finance manager would Approve the workflow and close the transaction.  
  
Change Request Requirement 1  
1. Removal of the Credit Note Additional Section for Manual Credit Note Number update.  
1.1 Since we are automating the creation of Credit Note against the Interest and Charges through an API, we do not need a section to update the Credit Note numbers manually. These details should be nested under the credit note section.  
  
  
Change Request Requirement 2  
2.1 Creation of Interest and Charges AR if not present in Oracle  
2.1.1 In order to maintain correct Accrued interest record in Oracle, we have to ensure that we Book the Interest and Charges that were pending for creation (as we usually do it at the end of the month).  
2.1.2 To Facilitate this, the ARs should be created after the Ops Maker and Checker have confirmed the Funds Returned state.  
  
Change Request Requirement 3  
3.1 Creation of Interest and Charges AR Credit Notes  
3.1.1 As soon as the Interest and Charges ARs are created on Oracle for the Funds Returned Applicaiton, we would proceed with Applying Credit note for the said ARs.  
3.1.2 Once the Credit Notes are applied, the details of the Credit Notes should be rendered under the Credit Note section of Lending Application.  
  
Change Request Requirement 4  
4.1 Credit Note Retry mechanism for Finance Manager  
4.1.1 There can always be a possibility of Credit Notes API failure and hence there should be a mechanism for the FM to retry the Credit Notes. This should be done through a button on the Credit notes section on the bottom left section of the Credit Note.  
4.1.2 Since Credit notes API can fail for One AR out of a group of multiple ARs, we should showcase the Credit Note that have failed and only apply the Credit Note API for the failed Credit Note's AR.  
4.1.3 Handling Async; since the Credit note service is not Realtime, we should disable the button (greyscale it) once the request is raised from the frontend to the backend and then frontend should long poll for 5 mins to get the status. Button txt should be "Processing".  
  
  
Change Request 2: (279460)  
Change Credit Memo to Credit Note on UI  
Background: Operations team gets confused with the word Credit Memo as it also refers to the Credit Memo prepared by the Credit team for the Board of Credit Committee. To resolve this, this must be changed to Credit Note.  
  
Solution:  
Rename Credit Memo to Credit Note across the following items:

1.  Emails related to Credit memos should use Credit Note wording instead.

2.  Status should render Credit Note instead of Credit Memo.

3.  Credit Memo Section under Application should refer to Credit Note.

4.  AFF Section under the Credit Facility Fee contains the Credit Memo section which should be renamed as Credit Notes.

5.  AFF Credit Memo Email should refer it as Credit Note

6.  AFF Credit Memo related Workflow should refer it as Credit Note across all states
