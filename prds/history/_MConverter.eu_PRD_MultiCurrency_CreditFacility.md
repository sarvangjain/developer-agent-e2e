TRADE FINANCE  
Multi Currency Credit Facility PRD  
  
STAKEHOLDERS:

| NAME       | ROLE     | DEPARTMENT        |
|------------|----------|-------------------|
| Abhishek B | Author   | Product           |
| Neeraj G   | Reviewer | Product           |
| Priyanka R | Reviewer | Operations        |
| TBD        | Dev      | Development       |
| Nimisha S  | Test     | Quality Assurance |

DOCUMENTATION:

| DOCUMENT    | OWNER       | LINK                                                                         |
|-------------|-------------|------------------------------------------------------------------------------|
| Wireframe   | Abhishek B  | Refer Ticket for Attachment                                                  |
| EPIC        | Abhinav S   | [Link ](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/216197) |
| QA Test Kit | Anshul M    | TBD                                                                          |

TIMELINES:

| VERSION | UPDATE                   | DATE      | COMMENT                   |
|---------|--------------------------|-----------|---------------------------|
| 0.1     | Initial Draft            | 30-May-25 | Added all relevant module |
| 0.2     | Review Round 1           |           | Product                   |
| 0.3     | Review Round 2           |           | Development               |
| 0.4     | Tech and Design Grooming |           | Quality Assurance         |

BACKGROUND:

1.  DPWFS has now started lending to large corporates under a single credit facility. These corporates are often spread across different geographies and their counterparties may accept different currencies.  
      
    For example: When we fund an Auto manufacturer like Chevy in Tajikistan, they may be importing engines from Germany and thus their counterparty would raise invoice to them in Euro even though the Credit limit to Chevy is in USD.

2.  To provide Invoice Financing solution to Chevy, we would have to finance Invoices in Euro on a Credit facility raised in USD. Each application must have disbursal in the native currency supported by the supplier.

3.  Each invoice would carry its own currency fluctuation as they are region bound and hence risk adjusted margins for each application would be different. Thus on every application drawdown we would have to define custom margins, or it can be referenced based on currency at the time of Credit facility seeding.

4.  Each application would have its own benchmark rate or would have a rate defined centrally on a Credit facility level against each currency.

5.  DPWFS may want to increase or decrease the rate of interest based on size of the supplier or buyer and may want to use the Fixed rate (like we did in MRPA phase one giving freedom to supersede the benchmark rate).

**PROBLEM STATEMENT:  
  
**1. Existing Credit Facility is mapped to a single currency (USD and Euro). Every application under the said CF references the disbursal in the same currency.

2\. Each Credit facility references a single benchmark rate (SOFR or EURIBOR). Every application picks up the 30/60/90/120 day benchmark rate accordingly. This limits the application's benchmark choice to a single reference rate.  
  
3. Each Credit Facility's disbursal and repayment can be made in the same currency as defined by the credit analyst at the time of CF setup.  
  
4. Risk Exposure control also looks at exposure of a Credit Facility in a single currency (Euro/GBP/USD) and does not allow Limit setting in multiple currency within the same Credit Facility.  
  
5. Counter Party Max Usable Limit defined by the Credit Analyst also is restricted to the Credit Facility's base limit.  
  
6. Active Available limit tracking also monitors only single currency exposure and thus does not provide currency wide available limits. For Example, I will not know how much Euro I can disburse at any time on a USD denominated Credit Facility.  
  
7. Credit Facility has a Fixed margin (defined by the CA at the time of setting up the Credit Facility). The flexibility of defining a currency specific margin or on each application is missing today.

ASSUMPTIONS:

1.  **Credit Facility Currency Structure**

> The overall credit facility will be granted in a single currency only. The multi-currency aspect will be implemented through individual application disbursals. On the arranging platform, users will have the option to view the available limit only in the base currency of their credit facility (after adjusting for any multi-currency applications).

2.  **Disbursement and Collection Currency Matching**

> Disbursement and collection will occur in the same currency. For example, a Euro application will be settled in Euros only.

3.  **Multi-Currency Rate Configuration**

> All multi-currency related disbursements will have the margin and benchmark rate defined at the credit facility level. The operations team will have access to override the pre-defined margin at the application level.

4.  **Fixed Rate Override**

> When a user selects \"Fixed rate\" on the application, it will override the benchmark rate selection for the designated currency, and the application will use the interpolated rate defined by the FI.

5.  **Outstanding Summary Report - CF Tab**

> Under the Outstanding Summary Report, the CF tab will showcase exposure and outstanding amounts consolidated by converting all non-USD currency exposures into USD using the spot rate of currency exchange on the date of disbursal.

6.  **Outstanding Summary Report - Individual Applications**

> Similarly, under the outstanding summary individual applications report, we will use the USD equivalent of the spot rate at the time of disbursal. The system will display:
>
> The conversion rate at the date of disbursal
>
> The current rate as two separate columns
>
> The disbursal amount in base currency and its dollar equivalent in two separate columns

7.  **Exposure Control Currency Conversion**

> Under exposure control, the system will showcase current exposure based on the USD equivalent value of the loan at the time of disbursal, not the current currency rate.

8.  **Partial and Full Settlement Logic**

> The partial settlement logic of under \$100 USD and full settlement logic of less than \$400 USD will be replicated for non-USD denominated applications. For example, if an application is short by €399, the system will allow the application to be closed. The system will not convert the €399 into USD before applying the logic.

9.  **Currency-Based Margins and Benchmark Selection**

> Currency-based margins and benchmark selection will be allowed, with override capabilities available on each application based on currency or region-adjusted risk. All interest rates remain the same regardless of the application.

10. **Multi-Currency Reporting Enhancement**

> Reports currently only cater to USD and Euro exposure and do not provide combined exposure reporting. If a facility has multiple currency applications, proper reporting mechanisms need to be implemented to handle them appropriately.

**  
INCREMENTAL STEPS FOR MULTI-CURRENCY CREDIT FACILITY:**

**Step 1: Define Multicurrency applicability** under each Credit Facility by clicking on "Allow Multi-currency applications". This would enable a new component on the Credit Facility called "Multi-currency".  
  
**Step 2:** **Edit Mult-currency support component** to define list of supported currency :  
(a) the applicable Benchmark rate (SOFR/EURIBOR) etc from dropdown  
(b) Margin against each currency  
  
**Step 3: Counterparty Usable Limit** will be defined by the CA in the same currency as that of the Credit Facility. For Example, if the CF is in USD then usable limits will be in USD.  
  
**Step 4:** Exposure Control will be defined by the CA for each approved counterparty in USD for the time being. We will explore multi-currency exposure control in Phase 2.

**REQUIREMENTS:**  
  
**1. New Multi-currency Component in Credit Facility**  
![A screenshot of a computer
AI-generated content may be incorrect.](media/image1.png){width="7.268055555555556in" height="3.276388888888889in"}  
1.1 Add the aforementioned section to the Credit Facility.  
  
1.2 Once the operations' maker has selected this, the Multi-currency component should render above the Approval section. Operations maker will start to add all supported currency within this section as a new row item  
  
1.3 Capture the currency supported. It would be a dropdown with all supported currency as a drop down. Use the same currency values that we use in the exposure control currency dropdown.  
  
1.4 Capture the Benchmark rate type. It should be a drop down with current supported Benchmarks (EURIBOR and SOFR). In future, we will add more Benchmarks when we expand to other regions hence, please do not hard code it on the UI and rather fetch this from supported Benchmark list from Backend.  
  
1.5 Capture the Margin against each currency row. Margin can be up to 4 decimal points and non-negative numbers.

1.6 For existing Credit Facility, we will update the Multi-currency support from the backend as introducing a new workflow for single digit CFs is redundant.  
1.7 For New facility Operations Maker/Checker define the Multi-currency details when CA and HOC have approved the Credit Facility and the CF has moved into the documentation queue.  
  
1.8 Within the Currency Component in each row, allow the checkbox : Allow Interest/Margin over-ride. If this option is not selected then do not allow the Operations Maker to edit the benchmark rate and margin in the applications.  
  
**2.** **Multi-currency modification on Application level**  
![A screenshot of a computer screen
AI-generated content may be incorrect.](media/image2.png){width="7.268055555555556in" height="3.8833333333333333in"}  
2.1 Client would be allowed to select the currency of their choice based on the approved currency list defined in the credit facility multi-currency section.  
  
2.2 The Usable Limit calculation would be based on the following logic: if the facility is raised in USD, then convert all current application disbursal based on the USD-Euro spot rate used at the time of disbursal. Then subtract the USD equivalent of all values which would give us the current used limit. Proceed to subtract all in-queue applications by converting their requested amount using the spot rate of the current date. This would then give you the Free Limit in USD terms. Then proceed to convert the current loan application from its base currency into usd based on the current date spot rate. If the USD equivalent request amount is lesser than the available free amount then do not show the "Limit Unavailable" sign to the Operations Maker.  
  
**Step-by-Step Calculation**

**Step 1: Convert Historical Disbursals to USD**

Existing disbursals made in the past:

Disbursal A: €8,500 EUR (made when rate was 1 USD = 0.85 EUR)

Disbursal B: €17,000 EUR (made when rate was 1 USD = 0.85 EUR)

Convert to USD using historical rates:

Disbursal A in USD: €8,500 ÷ 0.85 = \$10,000 USD

Disbursal B in USD: €17,000 ÷ 0.85 = \$20,000 USD

Total Historical Disbursals: \$30,000 USD

**Step 2: Calculate Current Used Limit**

Total Facility: \$100,000 USD

Used Amount: \$30,000 USD

Remaining after disbursals: \$100,000 - \$30,000 = \$70,000 USD

**Step 3: Convert In-Queue Applications to USD**

Applications currently in queue:

Queue Application X: €9,000 EUR

Queue Application Y: €18,000 EUR

Convert using current rate (1 USD = 0.90 EUR):

Application X in USD: €9,000 ÷ 0.90 = \$10,000 USD

Application Y in USD: €18,000 ÷ 0.90 = \$20,000 USD

Total Queue Applications: \$30,000 USD

**Step 4: Calculate Free Limit**

Available after disbursals: \$70,000 USD

Less queue applications: \$30,000 USD

Free Limit: \$70,000 - \$30,000 = \$40,000 USD

**Step 5: Convert Current Application to USD**

New application amount:

Current Application: €15,000 EUR

Convert using current rate: €15,000 ÷ 0.90 = \$16,667 USD

**Step 6: Decision Logic**

Comparison:

Current Application (USD equivalent): \$16,667

Available Free Limit: \$40,000

Result: \$16,667 \< \$40,000 ✓

Decision: DO NOT show \"Limit Unavailable\" sign to Operations Maker

## Summary Table  {#summary-table}

| **Item**               | **Original Currency** | **USD Equivalent** | **Rate Used**     |
|------------------------|-----------------------|--------------------|-------------------|
| Total Facility         | \$100,000             | \$100,000          | \-                |
| Historical Disbursal A | €8,500                | \$10,000           | 0.85 (historical) |
| Historical Disbursal B | €17,000               | \$20,000           | 0.85 (historical) |
| Queue Application X    | €9,000                | \$10,000           | 0.90 (current)    |
| Queue Application Y    | €18,000               | \$20,000           | 0.90 (current)    |
| Free Limit Available   | \-                    | \$40,000           | \-                |
| Current Application    | €15,000               | \$16,667           | 0.90 (current)    |

Final Decision: Application can proceed (no limit warning needed)  
  
2.3 Presently, the exposure control is not considered when computing the usable limit. This would required to be fixed and shown to operations maker at the time of processing the application. The Exposure control would have to monitor the Available Limit in the same logic as mentioned above.  
In the above scenario, even if we have \$40K available, but if the CA has set max usable Limit of \$10K for a specific Product then Ideally it should show the. "Limit Unavailable" Flag to the Operations Maker as the logic should be Minimum(Exposure_Control_Limit, Credit_Limit_Exceptions, Available_Free_Limit_Based_On_InQueue_And_Disbursed_Application)  
![A screenshot of a computer
AI-generated content may be incorrect.](media/image3.png){width="7.268055555555556in" height="1.9680555555555554in"}  
  
2.3 Benchmark Rate Selection: The Operations Maker can see which benchmark rate type gets picked based on the currency they choose for the application. If they need to use a different benchmark rate, they can edit it and select what works better. When they pick \"Custom,\" the system will unlock the \"Fixed Interpolated Rate\" field so they can enter their own rate.  
  
In MRPA Phase One, we had a bit of a mess - anyone could throw in an interpolated rate whenever they wanted, and if they did, it would just take over and ignore whatever benchmark was selected. This wasn\'t great because people got confused about which rate was being used.

Now we want to clean this up and make it way clearer. The system will only let you use interpolated rates when you specifically choose \"Custom\" as your benchmark type. This way, Operations Makers know exactly what\'s happening with their rates and there\'s no more guessing about which one the system is using.  
  
2.4 Render the Margin based on the currency selection made by the user as a prefilled value in the margin input box. Allow the Operations Maker to modify the Margin. Add validation to support only non-negative numbers and up to 4 decimal to be added in the margin.

2.5 Render the total interest rate applicable which would be sum of Applicable Rate + Margin= Interest Rate. This would allow the user to know if they have added the correct value in the benchmark rate and margin. This change should be universal.  
  
2.6 Ensure that the "Allow override" is set as true in the credit facility section for the Operation Maker to have the ability to over-ride the rates and margin. If not selected by the Maker on the credit facility then lock the benchmark rate type, Margin and Interpolated (Fixed) rate type.  
  
2.7 Once an application moves to Funds transferred stage then the application interest rate should not be allowed.  
  
**3. Currency-Based Transaction Filtering  
**![A screenshot of a computer
AI-generated content may be incorrect.](media/image4.png){width="7.268055555555556in" height="4.008333333333334in"}  
3.1 The system should filter Disbursal and Receipt transactions to match the currency specified in the Application. This prevents incorrect currency transactions from being used to settle applications.

**Example:** If an Application uses Euro currency and there\'s only one Euro account available (HSBC 108), the system should restrict transaction tagging to only that Euro account. This ensures USD or GBP transactions from other accounts cannot be mistakenly used to settle the Euro application.

Since each account is already tagged with its currency and mapped in the backend, implementing this filter should be straightforward. This validation will eliminate currency mismatches during transaction settlement.

**4. Reports related changes**  
Analytics reporting "Outstanding Summary" Report is used by the Sales and operations team on daily basis to track all active credit facility along with each application disbursal. Before we go live with the multi-disbursal facility, we will have to ensure the analytics team has requisite datapoints to render the following changes to the outstanding report:  
  
4.1 Credit Facility Tab: This houses all existing Credit facility granted. The utilization of the Credit facility should be based on the sum total of all outstanding applications defined in the Applications Tab.  
  
4.2 Applications Tab: This houses all individual applications that are processed under all approved Credit Facility. It helps operations team track the outstanding amount, days past due etc.  
  
4.2.1 With the introduction of multi-currency disbursal, we must report all applications in their USD equivalent amount (regardless of their base currency).  
  
4.2.2 The currency rate used would be the Spot rate defined by the "Rates API" at the time of disbursal. The Rates exchange should be stored and made accessible to the data lake team so that Kasi can create a column for "Currency rate" and mention the application's spot rate.  
  
4.2.3 The outstanding amount should always be USD equivalent rate based on date of disbursal.  
  
4.2.3 Analytics team can use the current spot rate of exchange to compute the current value of the exposure. This need not come from the LMS and can be fetched directly by calling the Rates API.  
  
4.2.4 The Analytics team has to add the following columns to the outstanding summary application tab table:

\(a\) The conversion rate at the date of disbursal

\(b\) The current rate as two separate columns

© The disbursal amount in base currency and its dollar equivalent in two separate columns  
  
**  
**
