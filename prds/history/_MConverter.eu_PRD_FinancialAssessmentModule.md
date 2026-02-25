| Module         | Financial Assessment Module within Lending Platform |
|----------------|-----------------------------------------------------|
| Prepared By    | Abhishek S Bhilware                                 |
| Created on     | 15-Mar-2025                                         |
| Reviewed By    | Neeraj Gupta                                        |
| Wiki Page Link | TBD                                                 |

| **Document**                 | **Owner**         | **Link**                                                                        |
|------------------------------|-------------------|---------------------------------------------------------------------------------|
| **Wireframe**                | **Abhishek B**    | [**Link**](https://balsamiq.cloud/spz8uad/pjy7id1/r97D0)                        |
| **Figma**                    | **Krishnamorthy** | **TBD**                                                                         |
| **highlight Feature 208393** | **Abhinav S**     | [**Link**](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/208393) |
| **Original Excel**           | **Abhishek B**    | **Attached to Feature**                                                         |

| **Department**    | **Member**     |
|-------------------|----------------|
| **Backend SPOC**  | **TBD**        |
| **Frontend SPOC** | **TBD**        |
| **QA SPOC**       | **TBD**        |
| **Product SPOC**  | **Abhishek B** |

**Overview:**

1.  In a recent DFSA Regulatory review, DPWFS was instructed to migrate the Credit Assessment of Individual borrowing companies from Excel to our lending platform.

2.  A financial spreadsheet is used by the Credit team to assess certain key ratios (Like Debt to Equity ratio etc). This spreadsheet is an Excel format and captures the Balance Sheet and Income Statement. Financial Assessment is dependent on Key ratios that should be derived based on the values input by the credit analyst during a new financial assessment.

3.  Each spreadsheet is mapped to a new or existing onboarding company. One applicant can have multiple Financial assessments done for it during initial credit facility generation or during enhancement/renewals.

4.  A balance sheet is a financial representation of the Assets and Liabilities (Short Term and Long term) held by the company.

5.  An Income statement showcases the current income from operating(Core like Selling Ice Cream) and Non-Operating (NonCore like Selling Patent to make Ice Cream cones) activities. This helps find the Gross Profit -\> Earnings Before Interest Tax and Dividend.

6.  Each year, a company submits their Balance sheet and Income statement to an auditor that audits on its accuracy and then certifies it.

7.  When our Credit team assess a company, they look at past three years (on average, can go up to 10) of financial audited reports containing the Balance Sheet and Income statement.

8.  There may be time when a borrower may submit a half year statement, hence reporting period may change from 1Y to 3M or even less.

9.  Financial Assessment is done in the Base currency, and then it has to be converted to USD. The USD converted numbers will be present in the tab adjacent to the Base currency.

10. Financial assessment can be done for a single company of borrower or for multiple companies held by the main borrowing entities.

**Simplified Journey:**  
Step 1: Credit Analyst (CA) creates a new Financial Assessment (FA)  
Step 2: CA tags said FA to existing company or leaves bank.  
Step 3: CA then fills the FA and then submits the FA to Credit Checker (CC)  
Step 4: CC then evaluates the FA and either sends back to rework or approve it  
Step 5: If FA is approved then all its fields are locked else CA resubmits the FA after rework  
Step 6: Both CA and CC have option to export the FA in XLS or PDF format once it is submitted for assessment  
Step 7: The exported XLS and PDF will have Current status of FA as either \"Submitted or Approved\"

**Key Users:**  
1. Credit Analyst-Maker:  
(User with the role of Credit-Analyst whose email address will be marked to the Financial Assessment requestID as an Author)  
1.1 Starts a new Financial Assessment  
1.2 Tags said assessment to any existing applicant.  
1.3 Submits the Assessment to Credit Checker.  
1.4 Resubmits it incase of Rework  
  
2. Credit Analyst -Checker:  
(Any user with the role of Credit analyst who\'s user email is not the same as that of the author)  
1.1 Gets notified about a new assessment for verification  
1.2 Approves the requests or sends it back for rework.

**Detailed features are to be incorporated:**  
  
1. Nesting within Lending Platform.  
As financial assessment is part of the Credit workflow. We will introduce a new section for it under the lending platform.  
Entry Point: Lending-\>Vertical menu-\>Below Credit Policy Section.  
Logo: Same Icon as Credit Policy  
  
2. Visible to user-role of Credit Analyst and HOC only.  
This module will be visible to only users who have the user-role of :  
2.1 HOC (Head of Credit),  
2.2 Credit-Analyst  
  
3. Maker-Checker workflow to ensure corrections.  
3.1 A financial assessment has to be verified by the credit maker-checker to ensure that the original credit maker has fed the correct numbers related to the document.

3.2 We will not introduce new user-roles in the system. We will continue to use only the existing Credit Analyst role.  
3.2.1 We will capture the email address of the Financial Assessment creator and call him as Maker and Any user whose email is different from Maker and has User-role as Credit Analyst will become the Checker.

3.2.2 In such way, a credit analyst role holder can be a checker for all FAs that are not created by him/her.  
  
  
3.3 The FA workflow will have the following life-stages:  
3.3.1 Financial Assessment ~~submission pending~~ draft  
3.3.2 Financial Assessment requested  
3.3.3 Financial Assessment approved  
3.3.4 Financial Assessment rejected  
3.3.5 Financial Assessment sent for Rework  
  
4. Audit History to track edits.  
4.1 As part of DFSA requirement, whenever a workflow is initialized, we have to capture the timestamp and the user-email who initiated the action

4.2 The Audit log should be made available within an Audit section under an FA Application.  
  
5. Lock in of the FA request once approved by Checker.  
5.1 The FA request, once approved by the checker, i.e when the FA application status changes to \"Approved by Credit Checker\" then said FA request can not be edited by the Financial Analyst.  
5.2 All fields related to adding a new row or column will be locked, and the CA can not Reject the said application.  
5.3 Only option available to CA or CC would be to "Export as PDF\" or \"Export as XLS\".  
  
6. Ability to export output as XLS or PDF.  
6.1 Key Financial Ratios (Derived values) generated from Balance Sheet and Income statement will be added to the top right section of the FA report.  
6.2 Any user-role (HOC, CA or CC) who have access to FA Module can download the Key ratio\'s file at any given point in time (regardless of the FA life-stage).  
6.3 When exporting the financial ratios as a PDF or XLS, the file name should be FinancialAssessment_CompanyID_CurrentDate

6.4 The button to export the ratios will be rendered only when the ratios are generated. (i.e only when the balance sheet and income statement is saved as draft by the Credit analyst).

6.5 Given that a Credit analyst or Credit Analyst Checker can modify or update the balance sheet and income statement at any time, we need to ensure that the export is done is real time and contains the latest values (no caching for previously generated files)  
  
7. Ability to add new assessment period.  
7.1 When a new FA request is crated, a credit analyst will have the option to select the assessment period.  
7.2 A CA can add up to 10 assessment period to a single FA request.  
7.3 An assessment period will have the following items:  
7.3.1 Start date (Date picker)  
7.3.2 End date (Date picker)  
7.3.3 Base currency (String upto 3 character)  
7.3.4 Currency conversion rate (Numeric up to 5 decimal places)  
7.3.5 Auditor name (String up to 100 character)  
7.4 A CA can add or remove assessment period at any time till the FA is not locked (After approval from the maker)  
  
8. Ability to add new row item under any balance sheet/ income statement.  
8.1 Every Balance Sheet and Income statement contains a set boilerplate that is mentioned in Point 13.  
8.2 A CA can add a new row to the existing boilerplate to ensure that custom line item can be added.  
8.3 A CA can remove the existing boilerplate row item or a new row item.  
8.4 The total for Individual sections and Final Sections should reflect addition/deletion modifications. (i.e if Current Assets is 100 and I remove Stocks worth 10 (a field within Current Assets) then Current Assets and Total assets will be reduced by 10.  
  
9. Tab to showcase the Balance Sheet and Income Statement in Base Currency and USD.  
9.1 Credit Analyst will punch in figures in the base currency for each financial year. Example: For assessment year 2024-25 the base currency was in INR but in 2025-26 the base currency is in GBP. Since the user will enter values without converting them to USD, we have to harmonize these currencies by converting them to USD.  
9.2 We will have two tabs, Base Currency and USD Equivalent. The USD equivalent tab will be a read only tab and will be used by the system to compute all ratios.  
  
10. Ability to Filter application from the main FA section.  
10.1 FA requested date (Start and End date)  
10.2 FA applicant name (name of the tagged approved KYC client)  
10.3 Active user (HOC, Credit Analyst and Credit Checker)  
  
  
11. Ability to capture the auditor name for each assessment period.  
Covered in point 7.  
  
12. Ability to capture the related percentage against the total amount.  
12.1 Each assessment column will contain a derived value to represent Percentage.  
12.2 The percentage value will be computed as (Row Amount value Divided by Total Amount)  
12.3 The percentage value will be restricted to two decimal point.  
12.4 The percentage value can not be edited by the users.  
12.5 The percentage value must update based on the change in row elements or change in another row elements.  
  
**13. Ability to have a boilerplate BalanceSheet and IncomeStatement with necessary fields added by default.**  
13.1 When a new FA is created, we will add the following rows automatically under Assets, Liabilities section:  
13.1.1 Assets:  
  
13.1.1.1 Long term Assets:  
Fixed Assets  
Investments and Other Financial Assets  
Intangible  
Trade Receivables  
Balance with Government Authorities  
Other non-current assets  
Total of Long term assets (Derived field: Sum total of all long term asset sub-items)  
  
13.1.1.2 Assets:  
Cash in Hand and Bank Balance  
Trade Debtors  
Inventory  
Advances Paid  
Loan to Associates  
Bank balances as Margin against BG  
Balance with Government Authorities  
Security Deposits  
Other Financial Assets Current  
Other Current Assets  
Total of Current Assets ( Derived field: Sum total of all current assets sub-items)  
  
13.1.1.3: Total Tangible Assets: (Derived field: Sum total of Long term and Current Assets)  
  
13.1.2 Liabilities:  
  
13.1.2.1 Equity (Row item)  
Share Capital (Row item)  
Reserves (Row item)  
Shareholder current account (Row item)  
Retained earnings (Accumulated losses) (Row item)  
Shareholders loan account (Row item)  
Tangible Net worth (Row item)  
  
Long term liabilities  
Unsecured Loan from Directors  
Long term portion of long term Debt  
D.T.L  
Total Long term liabilities (Derived field with total of all Long term liabilities)  
  
13.1.2.5 Current Liabilities (Section)  
Short term portion of Long term debt  
Short term/ revolving loans  
Trade Creditors  
Advance from Customers  
Unsecured loan from Directors  
Contract Liabilities  
Other payable/lease liability  
  
Total of Current Liabilities (Derived field with total of all current liabilities)  
  
Total Liabilities & Equity (Derived field with total of all current liabilities + Long Term Liability)  
  
\# INCOME STATEMENT items  
NetSales  
Related Party Sales  
External Sales  
  
Cost of Sales  
Related Party Purchases  
External Purchases/Cost of Goods Sold (COGS)  
  
Gross Profit  
Other Operating Income  
General Admin and Selling Expense  
Salaries  
Rent  
  
EBITDA  
Depriciation/Ammortization  
Interest Expenses  
Bad Debts/ Written Off  
Income Tax  
Other Non operating Income  
  
Net Profit  
  
**14. Ability to auto-match the total of assets with liabilities and Flag.**  
14.1 A Balance sheet contains Assets and Liabilities and sum of Assets should be equal to sum of Liabilities.  
14.2 In case the liabilities and assets total do not match then we need to highlight the difference as \"Mismatch\"  
14.3 the Mismatch text and the Difference between Assets and Liabilites has be highlighted as Red.  
14.4 When a CA tries to submit the FA with Mismatch then a notification has be rendered to the CA that \" Mismatch of \${Mismatch_amount} observed between Assets and Liabilities. Would you still like to continue? Button: Yes and No.  
14.5. In case the user clicks on Yes then the application will be sent to Credit Checker.  
14.6 In case the user clicks on No then the application will continue to be in the current stage.  
  
15. Compute correct ratio based on conditional formulas with duration as variable.  
Refer to all formulas present in the excel sheet.  
  
16. Ability to send email notification to the maker and Checker when workflow changes.

<table>
<colgroup>
<col style="width: 16%" />
<col style="width: 12%" />
<col style="width: 24%" />
<col style="width: 47%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Life Cycle Event</strong></th>
<th><strong>Recipient</strong></th>
<th><strong>Subject</strong></th>
<th><strong>Body</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Financial assessment submitted</td>
<td>FA Author</td>
<td>${Company_Legal_Name}’s Financial assessment request ${FA_Req_ID} submitted for review</td>
<td><p>Hi,<br />
${Company_Legal_Name}’s Financial assessment request ${FA_Req_ID} has been submitted for review.<br />
<br />
Please review. Button to hyperlink to FA section.<br />
<br />
Regards,</p>
<p>DP World Trade Finance Support</p>
<p>DPW Financial Services Limited/ Regulated by the DFSA</p></td>
</tr>
<tr class="even">
<td>Financial Assessment request approved</td>
<td>FA Author</td>
<td>${Company_Legal_Name}’s Financial assessment request ${FA_Req_ID} approved</td>
<td><p>Hi,<br />
${Company_Legal_Name}’s Financial assessment request ${FA_Req_ID} has been approved.<br />
<br />
Please review. Button to hyperlink to FA section.<br />
<br />
Regards,</p>
<p>DP World Trade Finance Support</p>
<p>DPW Financial Services Limited/ Regulated by the DFSA</p></td>
</tr>
<tr class="odd">
<td>FA Sent for Rework</td>
<td>All Users whose role is Credit Analyst Except the Author of the FA</td>
<td>${Company_Legal_Name}’s Financial assessment request ${FA_Req_ID} submitted for Rework</td>
<td><p>Hi,<br />
${Company_Legal_Name}’s Financial assessment request $(FA_Req_ID} has been submitted for Rework.<br />
<br />
Please review. Button to hyperlink to FA section.<br />
<br />
Regards,</p>
<p>DP World Trade Finance Support</p>
<p>DPW Financial Services Limited/ Regulated by the DFSA</p></td>
</tr>
</tbody>
</table>

17\. Ability to notify the Maker before submitting the Assessment if Key Ratios are beyond threshold.  
17.1 Credit Analyst have listed the higher and lower threshold for every important ratio and mentioned on the excel sheet.  
17.2 Whenever a ratio (auto computed) is beyond or below the defined values mentioned then we have to highlight the ratio in red.  
17.3 When a CA submits the FA request, then a notification message has to be rendered \"Key ratios are out of proportion. Would you like to submit for approval?\". Button \"Yes\" or \"No\".  
17.4 In case the user clicks on Yes then the application will be sent to Credit Checker.  
17.5 In case the user clicks on No then the application will continue to be in the current stage.  
  
18. Ability to capture the assessment company name (not the same as the borrower full legal name)  
18.1 When submitting a new FA Request, a Credit Analyst will have option to tag the Financial Assessment to an existing approved Client.  
18.2 If the Credit Analyst does not select the Client mapping then the FA will continue to exist and will not  
  
19. Ability to add remarks by Maker and Checker before submission or send back for rework.  
19.1 Add our standard Remark section to the FA Assessment request.  
  
  
20. Ability to save an ongoing financial assessment as Draft.  
20.1 Credit Analyst will have the option to save the application in Draft format before submitting the Financial assessment for future.  
20.2 FA submitted as Drafts should be available for quick editing on the main FA page.  
20.3 Both CA and CC can reject an FA.  
20.4 Whenever a reject request is placed, we will mark the status and continue to show those rejected applications on the main FA page.  
  
21. Ability to upload Financial statements provided by the Client to Credit Analyst.  
21.1 Each Financial Assessment request will support document upload as a key step as Credit Analyst rely on the Financial documents submitted by the borrower (Client),  
21.2 These documents will be tagged to Financial assessment ID.  
21.3 Max File size supported would be 25MB. If we don\'t have a max file size limit constraint, then we this condition will be a moot point.  
21.4 When checker reviews the financial assessment request, he/she can reference the attached document.
