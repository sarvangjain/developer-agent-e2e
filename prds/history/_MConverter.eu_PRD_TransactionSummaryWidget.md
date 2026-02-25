TRADE FINANCE  
TRANSACTION SUMMARY WIDGET PRD  
  
STAKEHOLDERS:

| NAME       | ROLE     | DEPARTMENT        |
|------------|----------|-------------------|
| Abhishek B | Author   | Product           |
| Neeraj G   | Reviewer | Product           |
| Priyanka R | Reviewer | Operations        |
| TBD        | Dev      | Development       |
| Anshul M   | Test     | Quality Assurance |

DOCUMENTATION:

| DOCUMENT    | OWNER       | LINK                                                                         |
|-------------|-------------|------------------------------------------------------------------------------|
| Wireframe   | Abhishek B  | Added to PRD                                                                 |
| EPIC        | Abhinav S   | [Link ](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/227628) |
| QA Test Kit | Anshul M    | TBD                                                                          |

TIMELINES:

| VERSION | UPDATE                                           | DATE       | COMMENT                                                                                                                                                                                                     |
|---------|--------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0.1     | Initial Draft                                    | 10-June-25 | Added all relevant module                                                                                                                                                                                   |
| 0.2     | Review Round 1                                   |            | Product                                                                                                                                                                                                     |
| 0.3     | Review Round 2                                   |            | Development                                                                                                                                                                                                 |
| 0.4     | Tech and Design Grooming                         |            | Quality Assurance                                                                                                                                                                                           |
| 0.5     | New Logic for computing Disbursal and Settlement | 11-Sep-25  | Radhika suggested a new computation where only Principal is to be considered. Details added at the end of PRD. Ticket available [here](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/251387) |

**DEFINITIONS**  
  
**Applicant Group** is a consolidated view of all credit facilities granted to a single KYC-verified applicant. This grouping enables the platform to present multiple facilities (such as one under DPWFS and others under MRPA Risk Obligor) as a unified exposure for risk management purposes. This differs from Group Entity support, which encompasses credit facilities across multiple different applicants.

**Example:** If VIP Industries has three active credit facilities - a \$50,000 working capital loan under DPWFS, a \$30,000 term loan under MRPA Risk Obligor, and a \$20,000 trade finance facility under another product - all three facilities would be grouped together as a single Applicant Group with total exposure of \$100,000 for John Smith. This unified view helps assess the overall risk concentration to this one borrower across all products.  
  
**Disbursals** refers to the total amount of approved loan applications that were actually transferred to borrowers on a specific date. For example, if Application A (\$100 approved amount) and Application B (\$200 approved amount) both reach the \"Funds Transferred\" stage on January 2nd, 2025, the total disbursals for January 2nd would be \$300, regardless of when the applications were originally created or approved.  
**Note:** The transaction date is determined by the Value Date from the bank statement in the accounting module for HSBC accounts. For non-HSBC accounts, the actual transaction date is used.  
  
**Settlements** refers to the total amount of Application transaction that was actually transferred by our clients back to us on a specific date. This includes all partial and complete settlements made on an application. The settlement date logic will follow same as Disbursals. Our agenda is to track Cashflow coming in from clients.  
  
**USD conversion** refers to the practice of converting every disbursal to its USD equivalent using the Rates API based on the USD-Base Currency rate of exchange on the date of Transaction (Disbursal or Settlement) occurring.

**Example:** On January 15th, 2025, the following transactions occur:

**Disbursals:**

- Transaction 1: €10,000 (EUR) - converted at EUR/USD rate of 1.05 = \$10,500 USD

- Transaction 2: £8,000 (GBP) - converted at GBP/USD rate of 1.25 = \$10,000 USD

- Transaction 3: \$15,000 (USD) - no conversion needed = \$15,000 USD

**Settlements:**

- Settlement 1: €5,000 (EUR) repayment - converted at EUR/USD rate of 1.05 = \$5,250 USD

- Settlement 2: £3,000 (GBP) repayment - converted at GBP/USD rate of 1.25 = \$3,750 USD

- Settlement 3: \$7,000 (USD) repayment - no conversion needed = \$7,000 USD

All transactions are converted to USD using the exchange rates applicable on January 15th, enabling consistent reporting across all currencies.

**BACKGROUND**  
  
1. The operations team reviews the cash in flow and outflow for every client through the outstanding summary report. They manually check the outward payments being made against each application to consolidate the total outward.  
  
2. For Group entitles, they have check disbursals and settlements made for credit facilities belonging to a specific Group ID. This takes on average, half an hour each day and should be replaced with a simple widget on the dashboard to track the Cash inflow/outflow for a specific date.

3\. Partial settlements are more difficult to track as one must extract the accounting module and sum up all transactions for a given date. To avoid all such manual tasks, we are implementing this new widget.  
  
**ASSUMPTIONS**  
  
1. Group transactions have to be merged across credit facilities (CF1, CF2 etc. for one client Ulker).

2\. Further all CF1 and CF2 can be of Euro and USD or GBP. Any non-USD CF transactions within a CF should be converted to USD equivalent based on the date of transaction (Exchange rate taken as per date of disbursal or settlement).

3\. If there are 3 CFs of the same client (2 from MRPA Risk Obligor and 1 with DPWFS as normal CF), then we consolidate all transactions from 3 facilities and then render it.  
  
4. The transaction summary will always render the current dates transaction.  
  
5. The user can select a period basis From and To date and then we have to provide sum total of all transactions across clients for Disbursements and Settlement.  
  
6. Settlement and Disbursal will be based on the value date from the accounting module.

7\. Disbursal will be defined as Application_Funds_transferred and settlement will be Application_closed or Partial settlement.

**REQUIREMENTS**  
  
**1. Transactions Summary Widget**  
![](/media/imagee.png){width="7.260416666666667in" height="4.291666666666667in"}  
1.1 Consolidate All Disbursal and Settlement made under an Applicant for the current date(s). Refer the definition of Disbursal and Settlement above.

1.2 Allow user to select period From and To dates and then Add all Transactions corresponding to given time period.  
  
1.3 Consolidate all Transactions based on the CFC ID to handle combined exposure for Risk obligor and normal applicant.  
  
**1.4** On the Backend, allow operations team to give a one time grouping for the transaction widget so that multiple CFCID\'s credit facility can be grouped. We already have a Group entity story in the current 1.41 release; we will use it to group a single group\'s credit facility.

**Example:** ABC Corp (CFCID: ABC001) has three separate credit facilities - Facility A (\$100K), Facility B (\$200K), and Facility C (\$150K). The operations team can use the Group entity functionality to create \"ABC Corp Group\" and consolidate all three facilities under this single group view in the transaction widget.

**1.5** When we group credit facility, we will not show the individual credit facility in the transaction widget as it would lead to double counting of the transactions.

**Example:** Once ABC Corp\'s facilities are grouped, the transaction widget will only display:

- **ABC Corp Group**: Total disbursals and settlements across all three facilities

- Individual entries for Facility A, Facility B, and Facility C will be hidden

This prevents double counting scenarios where a \$50K disbursal from Facility A would otherwise appear both as an individual facility transaction and as part of the group total, artificially inflating the reported transaction volumes.  
  
1.6 **Transaction Count** refers to the total number of distinct disbursal and settlement transactions, counted separately based on application status changes rather than bank transaction frequency.

**Counting Logic:** Each unique application that moves to one of these statuses counts as one transaction:

- **Application Funds Transferred** = 1 Disbursal transaction

- **Application Partially Settled** = 1 Settlement transaction

- **Application Closed** = 1 Settlement transaction

**Example:**

- Application A receives funding → Status: \"Funds Transferred\" = **1 Disbursal transaction**

- Application B makes partial repayment → Status: \"Partially Settled\" = **1 Settlement transaction**

- Application C completes full repayment → Status: \"Closed\" = **1 Settlement transaction**

**Important:** Even if a bank processes multiple application settlements in a single bulk transfer (e.g., one \$500K bank transaction settling 10 different applications), the system counts this as **10 separate settlement transactions** because 10 individual applications changed status, not as 1 transaction based on the bank\'s processing method.

Total transaction count = 1 Disbursal + 11 Settlements = **12 transactions**

1.7 Allow Export of the transactions rendered on the transaction Summary widget. The columns would be the same as rendered on the screen. The name of the exported file should be "Transaction_Summary\_\${DDMMMYY}To\${DDMMMYY}.  
  
1.8 Transaction Summary tab will be hosted on the Lending Application, and it will be visible to all internal admins.  
  
1.9 Add a vertical scroll so that the panel should be of the same size as other components, and it should nest all individual Group and Individual Facilities.  
  
1.10 Add a Total Row that adds the total of Disbursements and Settlements.

1.11 Add a Sort functionality on Applicants, Disbursement and Settlement so that user can sort it in ascending and descending.
