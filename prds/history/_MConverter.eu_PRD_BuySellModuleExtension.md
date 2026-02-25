TRADE FINANCE  
Buy Sell Module Extension Phase 1 PRD  
  
STAKEHOLDERS

| NAME       | ROLE      | DEPARTMENT               |
|------------|-----------|--------------------------|
| Abhishek B | Author    | Product                  |
| Neeraj G   | Reviewer  | Product                  |
| Poomesh M  | Reviewer  | Finance                  |
| Priyanka R | Reviewer  | Operations               |
| TBD        | Dev       | Development              |
| TBD        | Test      | Quality Assurance        |
| Pankaj W   | Developer | Oracle Fusion Middleware |

DOCUMENTATION

| DOCUMENT                    | OWNER       | LINK                                                                                                               |
|-----------------------------|-------------|--------------------------------------------------------------------------------------------------------------------|
| Wireframe                   | Abhishek B  | Refer Ticket for EPIC for Attachment                                                                               |
| EPIC                        | Abhinav S   | [Link ](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/239186)                                       |
| Phase-wise-implementation   | Abhishek B  | [Link](https://dpworld-my.sharepoint.com/:x:/p/abhishek_b/EasRPWmHI01FhalEw9y9wU8B4OOF3fRnjeznujHPo7LubQ?e=s40dBK) |
| Oracle Transaction Codes    | Abhishek B  | [Link](https://dpworld-my.sharepoint.com/:x:/p/abhishek_b/EVKniwi7oxFLi6QzDMB7QowB_boLW3_rN8eJY1JL1Ca0cA?e=hdatxE) |
| Change Request For Sale Txn | Abhishek B  | [265271](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/265271)                                      |

TIMELINES

| VERSION | UPDATE                   | DATE       | COMMENT                                                                      |
|---------|--------------------------|------------|------------------------------------------------------------------------------|
| 0.1     | Initial Draft            | 24-Apr-25  | Added all relevant module                                                    |
| 0.2     | Review Round 1           |            | Product                                                                      |
| 0.3     | Review Round 2           |            | Development                                                                  |
| 0.4     | Tech and Design Grooming |            | Quality Assurance                                                            |
| 0.5     | Credit Team's Induction  | 15-Sept-25 | Credit team will be added a Reviewer (CA, HOC) in multiple BuySell Workflows |

**BACKGROUND**  
Finalize the list of Operations, Finance, and Compliance user roles that require access to the Buy-Sell module.  
**Business Background**  
DPWFS operates across 5 geographies and 3 currencies. Each region has its own financial regulations, so we need to register with local regulators where it makes business sense based on client volume and deal flow.

For regions where full financial services registration isn\'t practical due to lower transaction volumes, we can use Buy-Sell structures instead. Rather than providing direct trade finance credit, we act as a trading entity - we buy goods from suppliers and sell them to buyers. This gives clients the same working capital benefits but through a different mechanism that fits better with local regulatory requirements.  
  
**Past development**  
Initial platform was developed in Jan 2024 with limited feature set as the Product was nascent and Business needed more time to craft the offering. Thus, the v1 of Buy Sell covered only the Purchase leg of the transaction where DPWT would Purchase goods on behalf of the Actual Buyers and then Invoice them later.  
Since typical time period between Purchase and Sale is 90 days, it was assumed that it would provide sufficient time for the development of the Settlement flow.  
  
**Core functionality developed till date**  
1. Ability to register a new Advance Payment Solution (This was the name decided for Buy-Sell in the past) with the following details:  
1.1 Buyer & Seller Banking Details  
1.2 Buyer & Seller basic details like name and CFCID (From Arranging after KYC)  
1.3 Ability to enter APS Setup/Facilitation Fee which is akin to a yearly fees taken from the Buyer  
1.4 Transaction Fees  
1.5 Markup defined either as Fixed Interest rate or as a Floating rate. (No connection was made between the benchmark rates and what is defined on BuySell Module)  
  
2. Ability to have a Maker and a Checker approve the APS on the platform.  
  
3. Ability for the Makers to create a new Application under an approved APS with Buyer and Seller selection and upload details of a Bonafide Purchase Invoice.  
  
**Why it was not pursued**  
Due to limited client's interest, the product was not developed further and thus the platform was limited to only a spreadsheet that contains the Purchase side of the transaction.  
  
**New** **Development**  
We have seen a revival in Client's interest in the Buy-Sell Arrangement and hence Business team has requested we take this forward and develop all important components under Buy-Sell that can support the upcoming transactions and also future developments.  
  
We will conduct a three phase rollout to the Buy-Sell Arrangement;  
(a) Phase one will contain all important modules needed to support the upcoming Transaction from Renew Power and ADM.  
(b) Phase two would contain all peripheral sub-modules that are important but not essential to the current transaction.  
(c) Phase three contains all good practises module like facility fee, Account categorisation etc, these modules are not important or essential but would provide ease in maintaining the Buy-Sell Service for the next transactions.  
You can reference the detailed list of items under various phases in the Phase-wise-implementation sheet.  
  
For reference, we have attached a sample Buy-Sell Arrangement (procured from Credit memorandum) between DPWT, ADM (Central Asian Buyer) and Chinese Car Company Cherry. This would help the team understand how a Buy-Sell Transaction works on the ground.  
![A screenshot of a computer screen
AI-generated content may be incorrect.](media/image1.png){width="7.268055555555556in" height="8.001388888888888in"}

**DEFINITIONS**  
**Buy-Sell Agreement** is a trade financing structure where a third-party trading entity (like DPWT) acts as an intermediary between a buyer and seller to extend credit terms beyond what would normally be available in a direct transaction.

**How it works:**

- **Standard trade:** Seller provides 60-90 days credit directly to buyer

- **Buy-Sell arrangement:** Trading entity purchases goods from seller with immediate payment, then resells to original buyer with extended credit terms and a markup

**Example:** ABC Manufacturing needs raw materials from XYZ Suppliers but requires 120 days to pay due to their production cycle. XYZ Suppliers can only offer 60 days credit and needs faster payment to maintain cash flow.

DPWT steps in as the trading intermediary:

1.  XYZ Suppliers invoices DPWT for \$100,000 worth of materials

2.  DPWT pays XYZ Suppliers within 30 days (faster than the original 60-day terms)

3.  DPWT invoices ABC Manufacturing for \$105,000 (original amount plus \$5,000 markup)

4.  ABC Manufacturing gets 120 days to pay DPWT the marked-up amount

**Markup explained:** The \$5,000 markup represents DPWT\'s financing cost - equivalent to the interest income it would have earned by providing a traditional loan for the same duration and amount. This compensates DPWT for extending credit and taking on the payment risk.

### **Key Benefit of such arrangement**: XYZ Suppliers receives faster payment, ABC Manufacturing gets extended credit (though at a cost), and DPWT earns financing income through the markup rather than traditional loan interest. All parties benefit from terms that wouldn\'t be possible in a direct buyer-seller relationship. You can find detailed explanation for Buy-Sell in the previous PRD; link added at the start of the document.  **Buyer** refers to the entity that is Buying goods from DPWT. With our First Trade, Renew Solar would be purchasing goods from DPWT instead of directly buying it from their Chinese Supplier.  **Seller** refers to the entity that is Selling goods to DPWT. With our First Trade, Chinese Solar Wafer manufacturer of Renew Solar would be our Seller.  **APS** stands for Advance Payment Solution, a name provided to the facility granted under a single buy-sell agreement. A buy-sell agreement can have only one APS. One APS may have multiple buyers and sellers. For example, ADB, a company based in Central Asia that is in the business of manufacturing cars, can have a single buyer, namely ADB Car Ltd, who can purchase goods from Cherry, a Chinese automotive company\'s EV arm and ICE arm. Thus, in a single APS we will have one buyer and two sellers. Each application, however, will only have one buyer and one seller.  **APS Structure Breakdown** This table illustrates how a single APS facility contains multiple applications, each with its own invoices and corresponding multi-part cash flows.\_\_ The Sale Invoice value includes the estimated (tentative) markup from day one. {#key-benefit-of-such-arrangement-xyz-suppliers-receives-faster-payment-abc-manufacturing-gets-extended-credit-though-at-a-cost-and-dpwt-earns-financing-income-through-the-markup-rather-than-traditional-loan-interest.-all-parties-benefit-from-terms-that-wouldnt-be-possible-in-a-direct-buyer-seller-relationship.-you-can-find-detailed-explanation-for-buy-sell-in-the-previous-prd-link-added-at-the-start-of-the-document.-buyer-refers-to-the-entity-that-is-buying-goods-from-dpwt.-with-our-first-trade-renew-solar-would-be-purchasing-goods-from-dpwt-instead-of-directly-buying-it-from-their-chinese-supplier.-seller-refers-to-the-entity-that-is-selling-goods-to-dpwt.-with-our-first-trade-chinese-solar-wafer-manufacturer-of-renew-solar-would-be-our-seller.-aps-stands-for-advance-payment-solution-a-name-provided-to-the-facility-granted-under-a-single-buy-sell-agreement.-a-buy-sell-agreement-can-have-only-one-aps.-one-aps-may-have-multiple-buyers-and-sellers.-for-example-adb-a-company-based-in-central-asia-that-is-in-the-business-of-manufacturing-cars-can-have-a-single-buyer-namely-adb-car-ltd-who-can-purchase-goods-from-cherry-a-chinese-automotive-companys-ev-arm-and-ice-arm.-thus-in-a-single-aps-we-will-have-one-buyer-and-two-sellers.-each-application-however-will-only-have-one-buyer-and-one-seller.-aps-structure-breakdown-this-table-illustrates-how-a-single-aps-facility-contains-multiple-applications-each-with-its-own-invoices-and-corresponding-multi-part-cash-flows.__-the-sale-invoice-value-includes-the-estimated-tentative-markup-from-day-one.}

| **Level 1: APS** | **Level 2: Application** | **Level 3: Invoices & Total Value**       | **Level 4: Cash Flows**     | **Amount**          |
|------------------|--------------------------|-------------------------------------------|-----------------------------|---------------------|
| **APS: 001**     | **Application \#001**    | **Purchase Invoice \#P-EV-101**           |                             |                     |
| *(ADB Car Ltd.)* | *(vs. Cherry EV)*        | **Value: \$500,000**                      | Payment to Seller (1/2)     | \$200,000           |
|                  |                          |                                           | Payment to Seller (2/2)     | \$300,000           |
|                  |                          | **Sale Invoice \#S-EV-101**               |                             |                     |
|                  |                          | **Value: \$500,000 + Tentative Markup**   | Settlement from Buyer (1/3) | \$150,000           |
|                  |                          |                                           | Settlement from Buyer (2/3) | \$150,000           |
|                  |                          |                                           | Settlement from Buyer (3/3) | *Remaining Balance* |
|                  | \-\--                    | \-\--                                     | \-\--                       | \-\--               |
| **APS: 001**     | **Application \#002**    | **Purchase Invoice \#P-ICE-205**          |                             |                     |
| *(ADB Car Ltd.)* | *(vs. Cherry ICE)*       | **Value: \$300,000**                      | Payment to Seller (1/1)     | \$300,000           |
|                  |                          | **Sale Invoice \#S-ICE-205**              |                             |                     |
|                  |                          | **Value: \$300,000 + Tentative Markup**   | Settlement from Buyer (1/2) | \$100,000           |
|                  |                          |                                           | Settlement from Buyer (2/2) | *Remaining Balance* |
|                  | \-\--                    | \-\--                                     | \-\--                       | \-\--               |
| **APS: 001**     | **Application \#003**    | *(\...and so on for future transactions)* |                             |                     |

Note: \"Remaining Balance\" refers to the final payment made by the Buyer to clear the total Sale Invoice value. This amount will be adjusted by a Credit/Debit Note at settlement if the Actual Markup differs from the Tentative Markup.

**APS-Application** stands for applications made under an APS. An application reflects an individual purchase and sale transaction within an APS. Each application contains only one purchase invoice and one sale invoice. This structure ensures that Operations can accurately track markups for each sale invoice. An APS can have multiple applications, and the APS\'s utilization rate is determined by the purchase invoice payments.

Example: Consider an APS with a total facility limit of \$100,000. Under this APS, there are three separate applications:  
Application 1: Purchase payout of \$30,000  
Application 2: Purchase payout of \$25,000  
Application 3: Purchase payout of \$20,000

The total utilization would be \$75,000 (\$30,000 + \$25,000 + \$20,000), leaving an available unutilized amount of \$25,000 (\$100,000 - \$75,000). This available limit changes dynamically based on settlements made against each application and any drawdowns for purchase invoice payouts.  
  
  
**APS-Application Purchase Invoice** refers to the invoice raised by the seller towards DPWT and contains all payment-related terms. This purchase invoice is updated first in the system, and the following key details are captured:

| Field                    | Type     | Description                                                                                                                                                             |
|--------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Invoice Reference Number | Input    | The reference number as mentioned by the seller in their billing system.                                                                                                |
| Invoice Date             | Input    | The date on which the invoice was originally issued by the seller. This date serves as the anchor point for computing the tentative markup referenced later in the PRD. |
| Invoice Amount           | Input    | The total amount payable to the seller. This amount can be paid to the seller in multiple tranches as agreed between the buyer and the seller.                          |
| Invoice Tax Amount       | Input    | The tax amount being charged by the seller to DPWT.                                                                                                                     |
| Invoice Currency Type    | Dropdown | Selection field for the currency in which the invoice is denominated.                                                                                                   |

Key Notes:

- The purchase invoice is processed before the sale invoice

- The invoice date is critical as it serves as the reference point for markup calculations

- Payment to the seller can be structured in multiple tranches based on agreed terms

- All monetary fields should align with the selected currency type

**APS-Application Payments** refers to all individual tranches of payments made by DPWT towards the seller. An APS application can have any number of payments depending on the invoice terms of service.  
Example: In a foreign trade transaction, the payment structure might be:  
30% advance payment made by DPWT to the seller upon order confirmation  
50% payment when the goods arrive at DPWT\'s warehouse  
Final 20% payment when goods are inspected and found to be in sound condition

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 16%" />
<col style="width: 60%" />
</colgroup>
<thead>
<tr class="header">
<th>Field</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Payment Request Number</td>
<td>Read only</td>
<td>System generated unique 8 digit code starting with PRN (Payment Request Number) followed by 5 digit incremental count</td>
</tr>
<tr class="even">
<td>Payment Request Amount</td>
<td>Input</td>
<td>Amount requested by Operations Maker and verified by Checker</td>
</tr>
<tr class="odd">
<td>Transaction Reference Number</td>
<td>Input</td>
<td>A unique reference number generated by HSBC (DPWT bank) when a new transaction (inward or outward) is generated.<br />
This would be visible once Payment is approved by Checker and then Operations can update the TRN.</td>
</tr>
<tr class="even">
<td>Actual Transaction Date</td>
<td>Date input</td>
<td>The Value Date as mentioned in the accounting module’s HSBC Bank’s statement.</td>
</tr>
</tbody>
</table>

**APS-Application Sale Invoice** refers to the invoice DPWT raises against the buyer after DPWT has received the purchase invoice. All terms related to the sale invoice are dependent on the purchase invoice date.

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 16%" />
<col style="width: 60%" />
</colgroup>
<thead>
<tr class="header">
<th>Field</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Invoice Reference Number</td>
<td>Input</td>
<td>A unique reference number used by the Operations Team. Once used in an approved application, this number cannot be repeated.</td>
</tr>
<tr class="even">
<td>Invoice Date</td>
<td>System Generated</td>
<td>The date on which the invoice was generated.</td>
</tr>
<tr class="odd">
<td>Invoice Due Date</td>
<td>Input</td>
<td>The date by which the invoice must be paid by the buyer. This date is crucial as it helps compute the tenor of the Buy-Sell Facility. Formula: Sale Invoice Due Date - Purchase Invoice Date = Tenor of the Application.</td>
</tr>
<tr class="even">
<td>Invoice Amount (Pre-tax)</td>
<td>Input</td>
<td>The invoice amount before tax is applied.</td>
</tr>
<tr class="odd">
<td>Invoice Tax Percent</td>
<td>Input</td>
<td>The tax percentage applicable to the invoice. Note: If multiple commodities with different tax rates are involved, separate invoices must be created as the system currently handles only one VAT percentage per invoice. UAE has 5% standard VAT, but export transactions may qualify for deemed export exemption.</td>
</tr>
<tr class="even">
<td>Invoice Tentative Markup</td>
<td>Read-only</td>
<td>Calculated field showing the tentative markup (detailed computation available in the markup section). This field assists the Operations team in invoice generation.</td>
</tr>
<tr class="odd">
<td>Invoice VAT Amount</td>
<td>Read-only</td>
<td>Automatically calculated based on the VAT percentage input field.</td>
</tr>
<tr class="even">
<td>Invoice Handling Fee</td>
<td>Input</td>
<td>Field where the Operations team can enter handling fees, using the tentative markup as reference.</td>
</tr>
<tr class="odd">
<td>Invoice Final Amount</td>
<td>Input</td>
<td>Final invoice amount that the operations maker enters based on all the above components and suggestions.</td>
</tr>
<tr class="even">
<td>Invoice Additional Fee</td>
<td>Read-only</td>
<td>Refers to the Additional fee that is to be charged from the Buyer at the time of settlement. One first Invoice generation this would be referenced as “On Actuals”.<br />
During settlement, it would be Actual Handling Fee – Tentative Handling fee</td>
</tr>
<tr class="odd">
<td>Actual Handling Fees</td>
<td>Read-only</td>
<td>Refers to the Actual Handling Fee computed on a daily basis based on the Payments and Settlements done. This section is useful only during settlement and should be computed when Purchase Payments = Purchase Invoice.</td>
</tr>
<tr class="even">
<td>Over-ride Markup</td>
<td>Toggle</td>
<td>Helps over-ride the Markup calculation. When APS is setup it is based on either Fixed or Floating. If the Operations team requires a custom Interest rate per annum then they can select the toggle as On. This will render a new input box called “ Custom Markup rate per annum”</td>
</tr>
<tr class="odd">
<td>Custom Markup rate per annum</td>
<td>Input field</td>
<td>Dependent on Markup type Toggle. Can take the percentage value of interest rate applied to the application. If entered then we will override the APS defined rate with this. This is useful for Interpolated rate calculations</td>
</tr>
<tr class="even">
<td>Invoice Currency</td>
<td>Read only</td>
<td>Dependent on the Purchase Invoice Currency type. Can not be different between purchase and sale invoice</td>
</tr>
<tr class="odd">
<td>Interest Rate Benchmark</td>
<td>Dropdown</td>
<td>Allows Operations to select a relevant benchmark type applicable only for the said Application</td>
</tr>
</tbody>
</table>

Key Notes:

- All sale invoice terms are dependent on the purchase invoice date

- The system currently supports only one VAT percentage per invoice

- UAE standard VAT is 5%, but deemed exports may be VAT-exempt

**APS-Application Settlements** refers to individual transactions made by the Buyer towards DPWT. These Transactions would be undertaken once a valid Sale Invoice has been issued by DPWT's operations team. The Settlements

<table>
<colgroup>
<col style="width: 23%" />
<col style="width: 16%" />
<col style="width: 60%" />
</colgroup>
<thead>
<tr class="header">
<th>Field</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Settlement Request Number</td>
<td>Read only</td>
<td>System generated unique 8 digit code starting with SRN (Settlement Request Number) followed by 5 digit incremental count</td>
</tr>
<tr class="even">
<td>Settlement Request Amount</td>
<td>Input</td>
<td>Amount entered by Operations Maker and verified by Checker</td>
</tr>
<tr class="odd">
<td>Transaction Reference Number</td>
<td>Input</td>
<td>A unique reference number generated by HSBC (DPWT bank) when a new transaction (inward or outward) is generated.<br />
This would be visible once Settlement is approved by Checker and then Operations can update the TRN.</td>
</tr>
<tr class="even">
<td>Actual Transaction Date</td>
<td>Date input</td>
<td>The Value Date as mentioned in the accounting module’s HSBC Bank’s statement.</td>
</tr>
</tbody>
</table>

**DPWFS**, stands for DP World Financial Services; the Financial services arm of DP World operating out of DIFC in Dubai. Our existing line of Credit products like Inventory/Payable/Receivable Financing are funded by them.  
  
**DPWT** stands for DP World Trading FZE; the trading arm setup exclusively to provide Buy-Sell or Buy-Sell Hold transactions. This is a separate entity and thus has little to no overlap between DPWFS. Both DPWFS and DPWT share common KYC services through our Arranging Platform.  
  
**Arranging Platform** refers to our Client facing platform used by the clients to apply for funding with DPWFS or other partner banks. This platform will be used for the Buy-Sell Transactions as well only for the sole purpose of registering the Buyer-Seller with DPWT.  
  
**Markup**  
is the variable income DPWT earns on a Buy-Sell transaction. It\'s essentially the interest charged to the **Buyer** in exchange for providing them with an extended credit period and paying their **Seller** upfront.

The calculation is dynamic and distinguishes between an initial estimate (**Tentative Markup**) and the final, precise charge (**Actual Markup**).

### **Markup core concepts:**

- **Tentative Markup:** An **upfront estimate** of the total markup. It\'s calculated once, at the beginning of the transaction, to generate the initial **Sale Invoice** for the Buyer. It assumes the entire purchase amount is outstanding for the full period.

- **Actual Markup:** A **dynamic, real-time calculation** that reflects the true cost of funds. It is calculated daily based on the actual cash flows---payments made to the Seller and settlements received from the Buyer. This is the final, accurate amount the Buyer owes.

- **Daily Outstanding Balance:** This is the core of the Actual Markup calculation. It represents the net amount of DPWT\'s cash that is deployed in the transaction on any given day.

  - **Formula:**  
    Daily Outstanding Balance = (Cumulative Payments to Seller) - (Cumulative Settlements from Buyer)

- **Interest Rate (Floating):** The annual interest rate used for the calculation.

  - **Formula:** Interest Rate = Benchmark Rate + Margin

  - **Benchmark Rate:** A standard floating rate that depends on the currency and tenor. The system must fetch the rate prevailing one day before the **Purchase Invoice Date**.

    - **USD:** SOFR (Secured Overnight Financing Rate)

    - **EUR:** EURIBOR (Euro Interbank Offered Rate)

    - **GBP:** SONIA (Sterling Overnight Index Average)

  - **Margin:** DPWT\'s predefined profit margin, set at the agreement level.

### **Markup Calculation Process**

#### **Step 1: Calculating the Tentative Markup (For Initial Invoicing)**

This is a one-time calculation to provide an estimated markup amount for the Sale Invoice.

1.  **Identify Inputs:**

    a.  Purchase Invoice Amount (e.g., \$100,000)

    b.  Purchase Invoice Date (e.g., 01-Jan-2025)

    c.  Sale Invoice Due Date (e.g., 31-Mar-2025)

2.  **Calculate Tenor:**

    a.  Tenor = Sale Invoice Due Date - Purchase Invoice Date (e.g., 90 days)

3.  **Determine Interest Rate:**

    a.  Fetch the appropriate Benchmark Rate (e.g., 3-Month SOFR) as of 31-Dec-2024.

    b.  Add the predefined Margin. (e.g., SOFR 5.5% + Margin 1.5% = Interest Rate 7.0%)

4.  **Calculate Tentative Markup:**

    a.  Use the simple interest formula, assuming the full amount is outstanding for the entire tenor.

    b.  Tentative Markup = (Purchase Invoice Amount × Interest Rate × Tenor) / 360

#### **Step 2: Calculating the Actual Markup (Dynamic, Daily)**

This calculation runs continuously in the background and updates daily to reflect the true financial position.

1.  For each day of the transaction, calculate the **Daily Outstanding Balance**.

2.  Calculate the interest for that day: Daily Interest = Daily Outstanding Balance × (Annual Interest Rate / 360)

3.  The **Actual Markup** displayed on any given day is the sum of all Daily Interest amounts calculated from the start of the transaction until that day.

    a.  Actual Markup (as of today) = Σ (Daily Interest from Day 1 to Today)

### **Detailed Example Walkthrough**  {#detailed-example-walkthrough}

**Initial Setup:**

- **Purchase Invoice Amount:** \$100,000

- **Purchase Invoice Date:** 01-Jan-2025

- **Sale Invoice Due Date:** 31-Mar-2025 (Tenor = 90 days)

- **Agreed Interest Rate:** 7% (Benchmark Rate + Margin)

**A. Tentative Markup Calculation:**

- Tentative Markup = (\$100,000 × 7% × 90) / 360

- Tentative Markup = \$1,750

- The Operations team uses this estimate to create the initial **Sale Invoice** for \$101,750, due on 31-Mar-2025.

**B. Actual Markup Calculation (Based on Real Events):**

Let\'s assume the following cash flows occur:

- **15-Jan-2025:** DPWT pays \$50,000 to the Seller.

- **31-Jan-2025:** DPWT pays the remaining \$50,000 to the Seller.

- **28-Feb-2025:** The Buyer makes an early partial settlement of \$40,000.

- **31-Mar-2025:** The Buyer settles the final outstanding balance.

| Period               | Daily Outstanding Balance | Days in Period | Interest for Period                    | Cumulative Actual Markup |
|----------------------|---------------------------|----------------|----------------------------------------|--------------------------|
| **01-Jan to 14-Jan** | \$0                       | 14             | \$0                                    | \$0                      |
| **15-Jan to 30-Jan** | \$50,000                  | 16             | \$50,000 \* 7% \* 16 / 360 = \$155.56  | \$155.56                 |
| **31-Jan to 27-Feb** | \$100,000                 | 28             | \$100,000 \* 7% \* 28 / 360 = \$544.44 | \$700.00                 |
| **28-Feb to 30-Mar** | \$60,000                  | 31             | \$60,000 \* 7% \* 31 / 360 = \$361.67  | \$1,061.67               |
| **31-Mar**           | \$0                       | \-             | \-                                     | **\$1,061.67**           |

**Final Result:**  
The **Actual Markup** is **\$1,061.67**, which is lower than the tentative estimate because DPWT\'s funds were not fully deployed for the entire 90-day period. The final payment due from the Buyer on 31-Mar is \$100,000 + \$1,061.67 - \$40,000 = \$61,061.67.  
  
**Markup Reconciliation and Settlement Process**

This section outlines how the system will handle the inevitable difference between the Tentative Markup charged on the initial Sale Invoice and the Actual Markup calculated at the end of the transaction\'s lifecycle.

**The Reconciliation Challenge**

The core challenge is that we issue a **Sale Invoice** upfront based on an **estimated** Tentative Markup (e.g., \$1,750). However, the final, true cost is the Actual Markup (e.g., \$1,061.67), which is only known after all cash flows have occurred.

Altering the original Sale Invoice is not feasible due to accounting and tax (GST/VAT) reporting obligations. The system must therefore reconcile the difference through a carefully managed settlement process.

**The \"Initialize Settlement\" Workflow**

This workflow is the process for closing out a transaction.

**Prerequisite for Settlement**

The \"Initialize Settlement\" button/action will be **disabled** until the Seller has been paid in full. This ensures our primary obligation is met before we begin the final reconciliation with the Buyer.

- System Rule: Enable \"Initialize Settlement\" only when:

Sum (Payments to Seller) \>= Purchase Invoice Amount

**Workflow Steps**

1.  **Trigger:** An Operations Maker, seeing the prerequisite is met, clicks the **\"Initialize Settlement\"** button.

2.  **Final Calculation:** The system performs a final, locked-down calculation of the Actual Markup based on all recorded payment and settlement dates and amounts.

3.  **Comparison & Workflow Routing:** The system compares the final Actual Markup to the Tentative Markup and routes the task accordingly.

    a.  **Scenario A:** Actual Markup \< Tentative Markup **(Credit Note Required)**

        i.  **Workflow Path:** Operations Maker -\> Operations Checker -\> Finance Manager

        ii. **Finance Manager\'s Role:**

            1.  The system calculates the Credit Amount = Tentative Markup - Actual Markup.

            2.  The task appears in the Finance Manager\'s queue with the proposed Credit Note amount clearly displayed for review.

            3.  The Finance Manager reviews the transaction details and clicks **\"Approve\"**.

            4.  **Upon approval, the system calls the Oracle AR API** to post the Credit Note.

            5.  If the API call fails, the task returns to the Finance Manager\'s queue with a \"Sync Failed - Resubmit\" status.

    b.  **Scenario B:** Actual Markup \> Tentative Markup **(Additional Charges Apply)**

        i.  **Workflow Path:** Operations Maker -\> Operations Checker (No Finance involvement needed).

        ii. **Handling Process:**

            1.  The initial Sale Invoice sent to the Buyer will include a line item titled **\"Additional Charges\"** with the amount specified as **\"To be calculated based on actuals\"**.

            2.  During settlement, the system calculates and pre-fills the Additional Charge Amount = Actual Markup - Tentative Markup.

            3.  The Operations team is prompted to notify the Buyer of this final amount. This notification will be sent via a system-generated email.

            4.  The email communication must be attached to the transaction as a supporting document to complete the workflow. No new invoice or debit note is created.

    c.  **Scenario C:** Actual Markup = Tentative Markup

        i.  **Workflow Path:** Operations Maker -\> Operations Checker

        ii. No financial adjustments are needed. The workflow proceeds to closure.

4.  **UI Display for Settlement:** The interface will clearly present the final math:

    a.  Original Principal: \$100,000.00

    b.  Actual Markup: + \$1,061.67

    c.  Subtotal: \$101,061.67

    d.  Settlements Received: - \$40,000.00

    e.  **Final Amount Due from Buyer:** \$61,061.67

    f.  *System Note: \"A Credit Note for \$688.33 has been approved and posted to reconcile the final invoice amount.\"*

**Edge Cases and Required Handling**

1.  **Credit Note API Failure:**

    a.  **Problem:** The Finance Manager approves the credit note, but the API call to Oracle AR fails.

    b.  **Handling:** The transaction settlement status is marked as **\"Awaiting Accounting Sync.\"** The task moves back to the Finance Manager\'s queue with an error flag, allowing them to investigate and trigger a resubmission of the API call. The settlement cannot be \"Complete\" until the sync is successful.

2.  **Dispute over Additional Charges:**

    a.  **Problem:** A Buyer disputes the \"Additional Charges\" amount communicated to them via email.

    b.  **Handling:** In the event of a dispute, the system will provide the Operations Maker the ability to override the system-calculated Additional Charge Amount. The Operations Maker can edit this field to a new, negotiated value (including zero). This change will require approval from the Operations Checker as part of the standard workflow. This provides a direct mechanism to resolve commercial disputes.

3.  **Early Settlement Request:**

    a.  **Problem:** The Buyer wishes to settle their account early, but the Seller has not yet been paid in full.

    b.  **Handling:** The \"Initialize Settlement\" workflow remains locked. The Buyer can still make advance payments, which will be recorded and will reduce their future Actual Markup. However, the final reconciliation (and any credit note) cannot be processed until the prerequisite of paying the Seller is met.

### **Special Scenarios & Edge Cases**  {#special-scenarios-edge-cases}

1.  **Late Settlement by Buyer:** If the Buyer fails to settle the full amount by the Sale Invoice Due Date, the **Actual Markup** calculation continues to increment daily on the remaining outstanding balance until the payment is complete. The system should apply the same interest rate unless a different \"penalty rate\" is defined.

2.  **Advance from Buyer (Before DPWT Pays Seller):** If the Buyer pays DPWT an advance *before* DPWT has paid the Seller, the Daily Outstanding Balance can become negative.

    a.  **Rule:** In this scenario, the Daily Outstanding Balance for interest calculation purposes is treated as **\$0**. We do not \"credit\" the Buyer for their advance. The interest calculation will only begin once DPWT\'s cash outflows exceed the Buyer\'s cash inflows.

3.  **Partial Payments/Settlements:** As shown in the detailed example, the system must handle any number of partial payments to the Seller and partial settlements from the Buyer, updating the Daily Outstanding Balance accordingly after each transaction.

### **System & UI Requirements for Operations** {#system-ui-requirements-for-operations}

The user interface for the Operations team must clearly display the following information for each transaction, updated in real-time:

- Tentative Markup: The initial estimated amount.

- Actual Markup: The live, up-to-date markup calculation.

- Paid till date: Total amount DPWT has paid to the Seller.

- Settled till date: Total amount DPWT has received from the Buyer.

- Pending Payment: Amount remaining to be paid to the Seller.

- Pending Settlement: Total outstanding amount the Buyer still owes (Principal + Actual Markup - Settled till date).  
    
  ![A screenshot of a computer
  AI-generated content may be incorrect.](media/image2.png){width="6.179959536307962in" height="6.696629483814523in"}![](media/image3.png){width="6.5777405949256345in" height="6.528090551181102in"}

**LIFECYLES & USER ROLES**  
  
An Advance payment solution would have the following Lifecycles across APS, Application, Payments, Receipts (to record incoming settlements) and Application Settlement (To close application)  
  
**1. New APS**  
Used when Operations maker is creating a new Advance payment solution for a new Buyer\<\>Seller pair.

| Status                                         | Active User        | Action Expected                                                                                                     |
|------------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| APS submission pending with Maker              | Operations Maker   | When APS is in the Draft stage and Maker has just saved the draft copy                                              |
| APS review pending with Checker                | Operations Checker | When APS is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back         |
| APS resubmission pending with Maker            | Operations Maker   | When APS is sent back by OM2 to OM1 with Remarks to correct something                                               |
| APS rejected by Operations Checker             | \-                 | When OM2 rejects the APS request                                                                                    |
| APS review pending with **Compliance Officer** | Compliance Officer | When APS is approved by OM2 and sits in Compliance Officer's queue to run Accuity offline and then approve the APS. |
| APS rejected by Compliance Officer             | \-                 | When APS approved by OM2 is rejected by the Compliance Officer due to failed FIRCO tests (Accuity)                  |
| Active                                         | \-                 | Once approved then APS is in Active stage                                                                           |

**2. Updating an Active APS**  
Used when Operations Maker may want to modify an existing APS for the following:  
1. Modify existing APS Buyer's or Seller's Bank details  
2. Modify APS to add new Buyer and Seller ( Cannot Modify or delete the ones whose active Application exists)

| Status                                                  | Active User        | Action Expected                                                                                                                |
|---------------------------------------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------|
| APS Edit Request review pending with Checker            | Operations Checker | When APS is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back                    |
| APS Edit Request resubmission pending with Maker        | Operations Maker   | When APS is sent back by OM2 to OM1 with Remarks to correct something                                                          |
| APS Edit Request Review pending with Compliance Officer | Compliance Officer | When OM2 approved the Edit request, we proceed to Compliance Officer to review and either approve or send back the application |
| APS Edit Request resubmission pending with Checker      | Operations Checker | When Compliance officers send back APS edit request back to the Checker                                                        |
| APS Edit Request Rejected by Operations Checker         | \-                 | When OM 2 rejects the Edit Requests                                                                                            |
| APS Edit Request Rejected by Compliance Officer         | \-                 | When CO rejects the Edit Requests                                                                                              |
| Active                                                  | \-                 | Once Compliance Officer approved then APS is in Active stage                                                                   |

**Note:**  
We will cover the workflow for settling an APS later in Phase 2/3 as it is one year down the line.  
  
[3. New APS's Application]{.mark}  
When a new Application for Purchase and Sale Invoice is to be added by OM1.  
An application cannot be saved without Purchase Invoice details. Sale Invoice can be updated later.

| Status                                      | Active User        | Action Expected                                                                                                     |
|---------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| Application submission pending with Maker   | Operations Maker   | When Application is in the Draft stage and Maker has just saved the draft copy                                      |
| Application review pending with Checker     | Operations Checker | When Application is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back |
| Application resubmission pending with Maker | Operations Maker   | When Application is sent back by OM2 to OM1 with Remarks to correct something                                       |
| Active                                      | \-                 | Once approved then Application is in Active stage                                                                   |

4\. Edit an existing Active Application  
When OM wants to update Sale Invoice then this flow is to be used.

| Status                                                              | Active User        | Action Expected                                                                                                     |
|---------------------------------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| Application Edit Request review pending with Checker                | Operations Checker | When Application is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back |
| Application Edit Request resubmission pending with Operations Maker | Operations Maker   | When Application is sent back by OM2 to OM1 with Remarks to correct something                                       |
| Application Edit Request Rejected by Operations Checker             | \-                 | OM2 rejects the application edit request                                                                            |
| Active                                                              | \-                 | Once approved then Application is in Active stage                                                                   |

5\. APS Application Payment  
A new Application Payment can be recorded only when an Application is in Active state and is not in any other queue.

| Status                                              | Active User        | Action Expected                                                                                                             |
|-----------------------------------------------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Payment Request submission pending with Maker       | Operations Maker   | When Payment is in the Draft stage and Maker has just saved the draft copy                                                  |
| Payment Request review pending with Checker         | Operations Checker | When Payments is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back            |
| Payment Request Review rejected by Checker          | \-                 | New Payment request rejected by OM2                                                                                         |
| Payment Request resubmission pending with Maker     | Operations Maker   | When Payments Request is sent back by OM2 to OM1 with Remarks to correct something                                          |
| Payment Transaction Update Pending with Maker       | Operation Maker    | When Payment Request is approved by OM2 and now OM1 has to make Payment and then Update the Transaction details from HSBC   |
| Payment Transaction review pending with Checker     | Operations Checker | When Payment Transaction is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back |
| Payment Transaction resubmission pending with Maker | Operations Maker   | When Payment Transaction is sent back by OM2 to OM1 with Remarks to correct something                                       |
| Payment Transferred                                 | \-                 | Once approved then Payment is in Active stage                                                                               |

6\. New APS Application Receipt  
OM can update an incoming receipt from the Buyers for any Active Application.

| Status                                                     | Active User        | Action Expected                                                                                                    |
|------------------------------------------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------|
| Receipt Settlement Request submission pending with Maker   | Operations Maker   | When Settlement is in the Draft stage and Maker has just saved the draft copy                                      |
| Receipt Settlement Request Rejected by Checker             | \-                 | OM2 Rejects the settlement requests                                                                                |
| Receipt Settlement Request review pending with Checker     | Operations Checker | When Settlement is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back |
| Receipt Settlement Request resubmission pending with Maker | Operations Maker   | When Settlement Request is sent back by OM2 to OM1 with Remarks to correct something                               |
| Receipt Settled                                            | \-                 | Once approved then Receipt is in Settled stage                                                                     |

7\. Settling an APS Application  
An APS Application can be closed only when the following conditions are met:  
1. Purchase Invoice value is equivalent to sum total of all Purchase payments approved by the OMs. This is to ensure that the applications where Purchase invoice that is not fully paid is settled accidently.  
2. Sale Invoice amount is \>=Purchase Invoice Amount. This is to ensure that the operations does not accidently close an Application where goods are stored in our Warehouse but DPWT has not billed the client yet.  
  
Notes:  
(a) An application once Settling cannot be revived.  
(b) Finance Manager would be involved only when the Application being closed has a scenario of Credit note applicability (Tentative Handling Fee is higher than actual)

<table>
<colgroup>
<col style="width: 25%" />
<col style="width: 23%" />
<col style="width: 51%" />
</colgroup>
<thead>
<tr class="header">
<th>Status</th>
<th>Active User</th>
<th>Action Expected</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Application Settlement Request submission pending with Maker</td>
<td>Operations Maker</td>
<td>When Application Settlement is in Draft Stage</td>
</tr>
<tr class="even">
<td>Application Settlement Requeqending with Checker</td>
<td>Operations Checker</td>
<td>When Settlement is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back</td>
</tr>
<tr class="odd">
<td>Application Settlement Request Rejected by Checker</td>
<td>-</td>
<td>When OM2 rejects the Application Settlement Request and end the flow</td>
</tr>
<tr class="even">
<td>Application Settlement Request resubmission pending with Maker</td>
<td>Operations Maker</td>
<td>When Settlement Request is sent back by OM2 to OM1 with Remarks to correct something</td>
</tr>
<tr class="odd">
<td>Application Settled</td>
<td>-</td>
<td>Once approved then Application is in Settled stage (only when Application has no Credit note requirement)</td>
</tr>
<tr class="even">
<td>Application Settlement Request pending with Finance Manager</td>
<td>Finance Manager</td>
<td>Once approved by Operations Maker and if Actual Markup is lesser than Tentative markup billed to client then Credit note is to be added, hence system will push this to FM’s queue</td>
</tr>
<tr class="odd">
<td>Application Settlement Request resubmission pending with Checker</td>
<td>Operations Checker</td>
<td>If FM finds some mistake then he can send it back to Operations Checker to fix.</td>
</tr>
<tr class="even">
<td>Application Settlement Request resubmission pending with Finance Manager</td>
<td>Finance Manager</td>
<td>This would happen if the Credit Note approved by the Finance Manager could not be applied by Oracle due to internal error or Oracle Credit Note API failure.<br />
In such scenario we route the Application back to FM to retry.</td>
</tr>
</tbody>
</table>

**User Roles:**  
Here\'s a comprehensive table showing user permissions for the Buy-Sell Module:

| **Function**                          | **Operations Maker (OM1)** | **Operations Checker (OM2)**  | **Compliance Officer (CO)** | **Finance Manager (FM)**       |
|---------------------------------------|----------------------------|-------------------------------|-----------------------------|--------------------------------|
| **APS Management**                    |                            |                               |                             |                                |
| Create new APS                        | ✅                         | ❌                            | ❌                          | ❌                             |
| Modify APS (in queue)                 | ✅                         | ❌                            | ❌                          | ❌                             |
| Cancel APS (draft stage)              | ✅                         | ❌                            | ❌                          | ❌                             |
| Reject APS (in queue)                 | ✅                         | ❌                            | ❌                          | ❌                             |
| Approve/Reject/Send back APS          | ❌                         | ✅ (if not initiated by them) | ❌                          | ❌                             |
| Final APS approval/rejection          | ❌                         | ❌                            | ✅ (after OM2 approval)     | ❌                             |
| **Application Management**            |                            |                               |                             |                                |
| Create new application                | ✅                         | ❌                            | ❌                          | ❌                             |
| Modify application (in queue)         | ✅                         | ❌                            | ❌                          | ❌                             |
| Approve/Reject/Send back application  | ❌                         | ✅                            | ❌                          | ❌                             |
| **Payment & Settlement Transactions** |                            |                               |                             |                                |
| Create new payment transaction        | ✅                         | ❌                            | ❌                          | ❌                             |
| Create new settlement transaction     | ✅                         | ❌                            | ❌                          | ❌                             |
| Modify payment/settlement (in queue)  | ✅                         | ❌                            | ❌                          | ❌                             |
| Approve/Reject/Send back payment      | ❌                         | ✅                            | ❌                          | ❌                             |
| Approve/Reject/Send back settlement   | ❌                         | ✅                            | ❌                          | ❌                             |
| **Settlement Workflow**               |                            |                               |                             |                                |
| Initiate settlement workflow          | ✅                         | ❌                            | ❌                          | ❌                             |
| Cancel settlement workflow (in queue) | ✅                         | ❌                            | ❌                          | ❌                             |
| Approve settlement workflow           | ❌                         | ✅                            | ❌                          | ❌                             |
| Send back settlement to OM2           | ❌                         | ❌                            | ❌                          | ✅                             |
| **Credit Notes**                      |                            |                               |                             |                                |
| Approve APS Application Credit Note   | ❌                         | ❌                            | ❌                          | ✅ (after settlement approval) |

**Key Notes:**

- ✅ = Can perform action

- ❌ = Cannot perform action

- Queue restrictions apply where specified (user can only act on items in their assigned queue)

- OM2 cannot approve items they initiated (identified by email address)

- Workflow follows: OM1 → OM2 → CO (for APS) / FM (for settlements)

> **ORACLE DEVELOPMENT**  
> Requirement 1.  
> Automate the creation of an Oracle Party for the buyer and seller upon APS approval by the Compliance Officer.  
> (1.1) Oracle Parties need to be created once the Advance Payment Solution is set up on the Buy-Sell Module.  
>   
> (1.2) When entering the Buyer and Seller details on the APS Setup, the Operations team will use the CFCID from the Arranging Platform. It has been agreed between Ops and Product that full KYC would be done for the onboarding Buyer and Seller and hence CFC ID would have all requisite details required to create a party in Oracle.  
>   
> (1.3) Since we create an Oracle Party ID for our Lending customers when their Credit Facility is setup and approved by the Legal team, here for Buy-Sell we will create Party ID once the APS has been approved by the Compliance Officer.  
>   
> Notes:  
> (a) We have a sub-product within Buy-Sell Module wherein the Buyer and Seller can be same entity. In such scenarios, we will have a single Oracle Party created and will ensure that ARs and APs get created against this Oracle Party.
>
> Requirement 2.  
> Seed the Oracle bank account for DP-World Trading FZE and provide API details; share the GL Code for receipt seeding.  
> Brief: Since DPWT trading entity and DPWFS are two separate ARMs, their Bank accounts are also separate and hence we would have to Seed the Accounts within our Accounting Module as well as our Accounting System.  
>   
> 2.1 Account details:  
> Please find the below bank account details for DP World Trading FZE
>
>  

<table>
<colgroup>
<col style="width: 3%" />
<col style="width: 4%" />
<col style="width: 4%" />
<col style="width: 12%" />
<col style="width: 0%" />
<col style="width: 4%" />
<col style="width: 4%" />
<col style="width: 3%" />
<col style="width: 0%" />
<col style="width: 5%" />
<col style="width: 27%" />
<col style="width: 28%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Bank</strong></th>
<th><strong>Currency</strong></th>
<th><strong>Account number</strong></th>
<th colspan="2"><strong>IBAN</strong></th>
<th><strong>Account title</strong></th>
<th><strong>Purpose</strong></th>
<th colspan="2"><strong>Account Analysis Code</strong></th>
<th><strong>Oracle Ledger Code</strong></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>HSBC Bank</td>
<td>AED</td>
<td>037-319373-001</td>
<td>AE850200000037319373001</td>
<td colspan="2">DP World Trading FZE</td>
<td>Trade settlement - AED</td>
<td>112002</td>
<td colspan="2">1338-0000-11210550-0000-000000-112002-00000000-0000</td>
<td><strong>SCENARIO</strong> </td>
<td>Finance Manager Rejected the Credit Memo Request </td>
</tr>
<tr class="even">
<td>HSBC Bank</td>
<td>USD</td>
<td>037-319373-100</td>
<td>AE310200000037319373100</td>
<td colspan="2">DP World Trading FZE</td>
<td>Trade settlement - USD</td>
<td>112001</td>
<td colspan="2">1338-0000-11210551-0000-000000-112001-00000000-0000</td>
<td><strong>RECIPIENT(S)</strong> </td>
<td>Operation Checker who Approved the request </td>
</tr>
<tr class="odd">
<td>HSBC Bank</td>
<td>EUR</td>
<td>037-319373-101</td>
<td>AE040200000037319373101</td>
<td colspan="2">DP World Trading FZE</td>
<td>Trade settlement - EUR</td>
<td>112003</td>
<td colspan="2">1338-0000-11210553-0000-000000-112003-00000000-0000</td>
<td>CC (IF ANY) </td>
<td>NA </td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td colspan="2"></td>
<td></td>
<td></td>
<td colspan="2"></td>
<td><strong>SUBJECT</strong> </td>
<td>Credit Memo Rejected for Application ${Application_ID} </td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td colspan="2"></td>
<td></td>
<td></td>
<td colspan="2"></td>
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
Credit Memo has been Rejected for Application ${Application_ID}.  <br />
 <br />
You can review the request here &lt;link to ApplicationID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

> 2.2 Seeding said accounts on the Accounting Module. Given Accounting Module does not directly fall under DPWFS Lending entity, we are okay to host these three accounts for DPWT FZE under the bank statements dropdown.  
>   
> 2.3 Introduce the following new ENUMS for handling Inward and Outward transactions for both Debit and Credit entries:

| Transaction Type    | Transaction Name        | Scenarios used                                                                                                            |
|---------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Credit entries only | Invoice Advance Receipt | When Buyer sends across an Advance sum of cash to us against an invoice raised by DPWT to Buyer                           |
| Debit entries only  | Invoice Advance Payment | When DPWT send monies to Seller against an Invoice raised by Seller in lieu of Advance before they can supply Goods to us |
| Credit entries only | Invoice Receipt         | Any money received from registered Buyers                                                                                 |
| Debit entries only  | Invoice Payments        | Any money paid by DPWT towards a Seller                                                                                   |

> 2.4 On Oracle Receipt marking, we have to seed the aforementioned three bank accounts. This has to be done on UAT and Production environment. A seeding request has been initiated by Abhishek with Oracle team and Incident ID is INC1616697. Please use it to check in with Pankaj Waghmare from the integration team to see if seeding is done or not.  
>   
> Requirement 3.  
> Create Transaction Codes for new Buy-Sell Module  
> Brief:  
> (a)Transaction Codes have to be created within Oracle to ensure we capture the Invoices (AR and APs and their credit notes correctly). Think of them as a way we tell Oracle on why we are raising an Invoice. To simplify our lives, we have restricted the transaction codes to the following:

| **Name**             | **Description**                           |
|----------------------|-------------------------------------------|
| Purchase             | Purchase made under BuySell Domestic      |
| Purchase Intl        | Purchase made under BuySell International |
| Sales                | Sale made under BuySell                   |
| Sales Intl           | Sale made under BuySell International     |
| General Fee          | Handling/Additional Fee Domestic          |
| General Fee Intl     | Handling/Additional Fee International     |
| Facility Fee         | APS Facility Fee Domestic                 |
| Facility Fee Intl    | APS Facility Fee International            |
| CM-Purchase          | Purchase made under BuySell Domestic      |
| CM-Purchase Intl     | Purchase made under BuySell International |
| CM-Sales             | Sale made under BuySell                   |
| CM-Sales Intl        | Sale made under BuySell International     |
| CM-General Fee       | Handling/Additional Fee Domestic          |
| CM-Gleneral Fee Intl | Handling/Additional Fee International     |
| CM-Facility Fee      | APS Facility Fee Domestic                 |
| CM-Facility Fee Intl | APS Facility Fee International            |

> \(b\) You can notice that there is a separate international transaction type for each head, this is used to ensure we can Add VAT as an when required.  
>   
> (c) There is a separate Incident request created with Indira INC1616761 to seed said Transaction Code.  
> (d) Please reach out to Vipul/Poomesh for the correct GL Code for the said Transaction Codes.
>
> 3.1. Simple Purchase Made by DPWT from Chinese Seller

- Scenario Details: DPWT purchases \$100,000 worth of solar wafers from a Chinese Supplier under the Buy-Sell arrangement. The Supplier invoices immediately, with terms for payment in 30 days. This is international, so we use \"Purchase Intl\" Transaction Code.

- Oracle AP Steps:

  - Create a Standard Invoice in AP module.

  - Transaction Code: Purchase Intl (for BuySell International purchase).

  - Invoice Amount: \$100,000.

  - Supplier: Chinese Solar Wafer Manufacturer.

  - Terms: 30 days net.

  - Validate and approve the invoice.

- Accounting Entries (upon validation):

  - Debit: Expense/Purchase Account \$100,000 (or Inventory if tracking stock).

  - Credit: AP Liability \$100,000 (to Chinese Supplier).

- Status: Invoice is \"Unpaid\" and open in AP Aging Report with a balance of \$100,000. This creates the payable obligation for DPWT.

> 3.2. Make Some Payments to Chinese Seller (Updated with Manual Quick Payment Process)

- Scenario Details: DPWT pays the Supplier in two partial installments for faster cash flow (e.g., \$50,000 immediately and \$50,000 after 15 days), settling the full \$100,000 within the 30-day terms. Per your process, these are recorded manually as Quick Payments in the Oracle dashboard, using HSBC Bank, which reduces the AP balance without altering the original invoice.

- Oracle AP Steps (Manual Process):

  - Navigate to the Oracle AP dashboard (e.g., Payables Manager responsibility).

  - Find the open \"Purchase Intl\" invoice (\$100,000 balance).

  - Select \"Quick Payment\" option for ad-hoc payment creation.

  - Enter payment details:

    - Payment Amount: \$50,000 (first instalment).

    - Payment Method: Bank Transfer or Wire, linked to HSBC Bank Account.

    - Apply to the specific invoice.

  - Submit and process the payment (this generates a payment document and reduces the balance).

  - Repeat after 15 days for the second \$50,000 Quick Payment, again via HSBC Bank.

  - Reconcile the HSBC Bank transactions in Cash Management if needed (e.g., match to bank statements).

- Accounting Entries (for each Quick Payment):

  - Debit: AP Liability \$50,000 (reducing the outstanding balance on the invoice).

  - Credit: HSBC Bank Account \$50,000 (your designated outgoing bank account).

- Status: After the first Quick Payment, the original invoice remains at \$100,000 total, but the open AP balance reduces to \$50,000 (visible in AP Aging or Invoice Workbench). After the second payment, the balance drops to \$0, and the invoice is \"Paid\" and closed. The AP liability for the Supplier is fully cleared, but audit trails show the original amount and payment applications.

> 3.3. Raise Invoice to Indian Buyer with Handling Fee Added

- Scenario Details: DPWT resells the goods to the Indian Buyer (e.g., Renew Solar) for \$100,000 plus a \$5,000 handling fee (for the financing markup and admin costs), totaling \$105,000 with 120-day terms. Since the Buyer is Indian (International to DPWT), we use \"Sales Intl\" for the main invoice and \"General Fee Intl\" for the handling fee (issued as a separate invoice for clarity in contests).

- Oracle AR Steps:

  - Create two invoices in AR module (main sales + fee).

  - Main Invoice:

    - Transaction Code: Sales (for BuySell Domestic sale).

    - Amount: \$100,000.

    - Customer: Indian Buyer (Renew Solar).

    - Terms: 120 days net.

  - Handling Fee Invoice:

    - Transaction Code: General Fee (Handling/Additional Fee Domestic).

    - Amount: \$5,000.

    - Linked to the main invoice (via reference or bill-to).

  - Complete and AutoInvoice both.

- Accounting Entries (upon completion):

  - For Sales Invoice: Debit AR Receivable \$100,000; Credit Revenue \$100,000.

  - For General Fee Invoice: Debit AR Receivable \$5,000; Credit Fee Income \$5,000.

- Status: Both invoices are \"Open\" in AR Aging Report, with a total receivable of \$105,000 due in 120 days.

> 3.4. Receive Some Money from Indian Buyer

- Scenario Details: The Buyer pays partially---e.g., \$50,000 initially (covering half the main invoice) and another \$50,000 after 60 days (covering the rest of the main invoice, leaving the \$5,000 handling fee unpaid for now).

- Oracle AR Steps:

  - Create receipts in AR module and apply them.

  - Transaction Code: Not applicable (receipts apply to the \"Sales\" and potentially \"General Fee\" invoices).

  - First Receipt: \$50,000 via bank transfer, applied fully to the Sales invoice.

  - Second Receipt: \$50,000 via bank transfer, applied fully to the remaining Sales invoice.

  - Reconcile in Cash Management (e.g., to HSBC Bank Account if it\'s used for inflows too).

- Accounting Entries (for each receipt):

  - Debit: HSBC Bank Account \$50,000 (your designated incoming bank account).

  - Credit: AR Receivable \$50,000 (reducing the outstanding).

- Status: Sales invoice is now \"Closed\" (fully paid). General Fee invoice remains \"Open\" with \$5,000 due. Total AR balance: \$5,000.

> 3.5. Scenario: Handling Fee is Contested and Reduced Using a Credit Note

- Scenario Details: The Indian Buyer contests the \$5,000 handling fee (e.g., claims it\'s too high due to a negotiation error) and DPWT agrees to reduce it by \$2,000, issuing a credit note for the adjustment. This leaves the Buyer owing \$3,000 on the fee.

- Oracle AR Steps:

  - Create a Credit ine in AR module.

  - Transaction Code: CM-General Fee (for Handling/Additional Fee Domestic credit).

  - Amount: -\$2,000 (negative to reduce the balance).

  - Reference: Apply to the open General Fee invoice.

  - Reason: \"Fee Adjustment - Contested Handling Charge.\"

  - Approve and apply the credit.

- Accounting Entries (upon application):

  - Debit: Fee Income \$2,000 (reversing part of the original income).

  - Credit: AR Receivable \$2,000 (reducing the outstanding).

- Status: The original General Fee invoice now shows a balance of \$3,000 (after credit application). It\'s \"Partially Paid/Adjusted\" until the remaining is settled. If the Buyer pays the \$3,000 later, you\'d process another receipt as in Step 3.4.

> Requirement 4  
> Credit Note Actual Implementation  
> 4.1 As you would have noticed, there can be difference between Tentative Handling Fees vs Actual Handling Fees collected from the Client. To address this, we will use Credit note API. Since we have integrated Credit Note APIs before, we simply have to call same API endpoint when Finance Manager approved the Application.  
>   
> 4.2 Any API failure has to be handled gracefully by simply moving the application from the Oracle's queue back to the Finance Manager's queue and sending an email notification to them that the said credit note for Application must be resubmitted.  
>   
> Note: We are not creating the AFF credit note reduction but in future Buy-Sell Annual Facility Fee would also be reduced based on Actual Usage from the Platform. This will be handled in upcoming phases, not this one.

**COMPLIANCE REQUIREMENTS**  
  
Requirement 1.  
Add the \'Compliance Officer One\' role to the Buy-Sell module\'s APS approval workflow  
Brief: Since APS is akin to Credit Facility, we need Compliance to run a basic FIRCO (Accuity) level check on both Buyer and Seller. This ensures that onboarding KYC requirement is completed. At present we only have given Buy_Sell Module's access to Operations team.  
1.1 Enable Buy Sell Module service access for Compliance Officer from Mawani.  
  
1.2 Modify the existing APS approval workflow where only Operations Manager 1 and Operations Manager 2 are required as Maker and Checker to approve an APS. Going forward, we have to ensure that after OM2 approval, we add Compliance Officer to the Mix and APS can be deemed completed only once CO has approved the request.  
  
1.3 Compliance Officer will be able to Approve/Reject or Send back APS applications whenever required.  
  
1.4 Compliance Officer will be involved whenever APS modification is required to add or Delete any Buy or Seller.  
  
Requirement 2.  
Arranging Changes for Buy-Sell Entity KYC  
  
This feature addresses the process of assigning Buyers and Sellers to the appropriate DP World Arranging Platform (DIFC or Cayman) during KYC, specifically for clients engaging in Buy-Sell activities.

**Current Platform Assignment Logic (for other products):**

Currently, the tenant (DIFC or Cayman) on the DP World Arranging Platform is determined by the client\'s Country of Registration:

- **Cayman Platform:** Selected if the client\'s Country of Registration is **outside UAE**.

- **DIFC Platform:** Used if the client\'s Country of Registration is **within UAE**.

**Exception for Credit Facilities:** If a Non-UAE based client (originally on Cayman) opts for a Credit Facility from DPWFS, their entity is subsequently cloned from the Cayman platform to the DIFC platform.

**2.1 New Logic for Buy-Sell Product:**

For clients interested in a **Buy-Sell** facility, the platform assignment logic will be modified as follows:

1.  **Product Choice at KYC:** During the KYC process for both Buyer and Seller, an input will be added to allow them to select \"Buy-Sell\" as their preferred product.

<!-- -->

1.  **Mandatory Cayman Assignment for Buy-Sell:**

    a.  **UAE-Registered Clients:** If a UAE-registered client selects \"Buy-Sell\" as their product choice, their entity will be **cloned to the Cayman platform**, even though their country of registration is UAE. This is a critical change to streamline compliance, as DIFC compliance for Buy-Sell activities would involve two compliance officers (Kamlesh and Suzanne Ali, with Suzanne being on DPWFS payroll), whereas Cayman offers a more direct path for this product.

    b.  **Non-UAE Registered Clients:** For non-UAE registered clients who are already on the Cayman platform, no additional action or cloning is required, as they are already on the appropriate platform for Buy-Sell.

**2.2 Handling Existing UAE-Registered Clients for Buy-Sell:**

For existing UAE-registered clients who wish to utilize a new Buy-Sell facility, a specific process will be implemented:

1.  The Operations team will be required to **edit the client\'s existing KYC** record.

2.  They will then **add a \"Buy-Sell Flag\"** to the KYC.

3.  Upon completion of the KYC workflow with this flag, the client\'s entity will be **automatically cloned to the Cayman platform in the background**.

**2.3 Ensure that the Edit KYC flow should be able to handle this is new Buy-Sell specific modification. Buy-Sell Product selection would result in UAE client's entity being cloned on Cayman and only Cayman's CFCID should be used.**  
  
**2.4 On the Buy-Sell Module when Operation uses CFCID at the time of APS Setup: Ensure we check the tenant and then invalidate a request if the CFC ID used by the team is of DIFC Tenant.**  
  
**REPORTING REQUIREMENT**  
  
**Requirement 1**  
Expose all Buy-Sell related schemas to the Data lake for reporting purposes  
1.1 Please expose all said Tables and request Data Engineering team to have them replicated on the Data lake  
  
Requirement 2

**Implement multi-currency disbursal tracking in the outstanding summary for the DPWT entity**  
This section outlines how multi-currency transactions will be managed within the Buy-Sell Platform and reflected in the Outstanding Summary Report for DP World Trading FZE.

1.  **APS (Application Processing System) Currency:** Each APS setup will be denominated in a *single currency* from a predefined set: EUR, GBP, USD, or CNH. This sets the base currency for the overall application.

2.  **Application-level Currency:** While the APS has a single base currency, individual Applications *within* that APS can operate in different currencies. For example, an APS might be set up in USD, but an Application within it could handle transactions in CNH or GBP.

3.  **Invoice-level Currency (Purchase & Sale):** Within a single Application, both the Purchase Invoice and the corresponding Sale Invoices will always be in the *same currency*. This ensures consistency for that specific transaction pair.

4.  **Outstanding Summary Report - Client Summary:** On the reporting end, the Client Summary will present every APS\'s outstanding amount denominated in **USD equivalent**. This aligns with our existing multi-currency reporting practices for DP World Financial Services (DPWFS) facilities, providing a consolidated view.

5.  **Outstanding Summary Report - Individual Transactions:** For individual transactions listed in the report, the currency conversion rate will be sourced directly from the platform\'s API at the time of disbursal. This ensures accuracy and consistency. Kasi (assuming this refers to a user or system consuming the report) will receive the converted amounts in the specified column format and will not need to perform any manual currency conversions. The applied conversion rate will be explicitly that from the time of disbursal.

**Requirement 3**  
**Buy Sell Outstanding Summary**  
The reports need to be added to ensure we have a substitute for the current outstanding summary report. We will have the following columns in the Client Summary tab:  
a1. CFC ID  
a2. Client Name  
a3. Client Country  
a4. Max Approved Amount (Max Exposure as per APS)  
a5. Supplier Invoiced Amount (Total of all Invoices raised by the Supllier to DPWT) Inclusive of Tax amount  
a6. Amount Received by the Buyer Total (This would be the Sale Invoiced to Buyer with DPWT as seller) + Any Advances received from the Buyer in DPWT account  
a7. Outstanding Amount paid to the Supplier (A5-A6)  
a8. Un-Utilised Amount  
a9. Un-Utilised Percentage to total Invoice  
a10. Supplier Invoices in Pipeline (Awaited to be funded where the status would be checker approved but payment not processed)  
a11. RM Sales Agent  
  
(b) Disbursal Summary tab would have the following columns:

b1. APS Facility ID

b2. Buyer Name

b3. Seller Name

b4. Buyer Country

b5. Seller Country

b6. Transaction Currency

b7. Transaction Application ID

b8. Facility Type (Buy & Sell or Buy-Hold-Sell)

b9. Seller Invoiced Amount (Face value of the invoice raised by Seller to DPWT inclusive of Tax)

b10. Seller Approved Amount (Based on Approval percentage)

b11. Invoice tenure (based on Seller invoiced Payment date + Buyer Invoiced Repayment date)

b12. Margin (based on Buyer Invoiced amount)

b13. Advance received from Buyer (on basis of proforma-invoice)

b14. Advance paid to Seller (on basis of proforma-invoice)

b15. Current Sell side invoice status

b16. current Buy side invoice status

b17. RM Sales Agent

**CORE FUNCTIONALITY**  
  
Requirement 1.  
APS and Application Tab on Main screen

1.1 The existing APS section does not allow the user to view an APS that has already been approved. The View button is disabled. This needs to be fixed and any user who has access to Buy-Sell Module should be able to see relevant APS.  
  
1.2 APS should now be classified into three major tabs:  
1.2.1 Requested APS  
Contains all APS where any workflow related to creating a new APS or Modifying an existing APS is due.  
  
1.2.2 Approved APS  
Contains all APS where there is no active APS workflow.  
  
1.2.3 Rejected APS  
Contains APS that have been rejected by any user role like Compliance or OM2.  
  
1.3 The Facility Fee and Account Categorisation can be ignored for Phase 1. We will take them up in Phase 2.

1.4 The Filter on the APS main screen should contain the following filters  
1.4.1 The APS Name  
1.4.2 APS Workflow status  
1.4.3 Active User  
  
1.5 Account category should be ignored for Phase 1  
  
1.6 Approved Limit would be based on the Actual Approved limit by OMs. The Unutilised limit would be calculated based on Applications where :  
1.6.1 Unutilised Limit would be Approved Limit - (Purchase Invoice Amount of Application where OM2 has approved)  
Note: Purchase Invoice has been added and approved by OM 2. (Any application not approved by Operations Checker should not be considered when computing the Unutilised Limit.  
  
1.7 Expiry date would be based on declared APS Expiry date. APS that get expired will move into the Approved APS.  
  
1.8 APS in the Approved APS can be either Completed, Active or Expired (where current date is higher than APS expiry date).  
  
1.9 In the Rejected APS, we will only host APS that have been Rejected by Either Compliance Officer or Operations Checker.  
  
1.10 The Application section of BuySell contains Applications across their lifecycles. Like APS, we have setup the following Tabs:  
1.10.1 Requested  
Contains all Applications that are under any active workflow for Application or Payments and Receipts within said Application.  
  
1.10.2 Active  
Contains all Applications that are either in Draft or Active stage.  
1.10.2.1 Draft Applications are simply put, Applications that are under Operations Maker (OM1) queue and yet to be submitted to  
  
1.10.3 Completed  
All Applications that have been settled/ cancelled or rejected. Completed is simliar to Active with only difference being that the Applications have reached a terminal stage and we cannot update or modify Completed Applications.  
  
  
Requirement 2.  
Implement interest rate (handling charge) calculation for sale invoices to determine the correct markup  
2.1 The correct method to calculate the Markup is mentioned under the definition section. We have to render the Tentative Markup at all time while Actual Markup should be calculated only when the Settlement workflow is triggered by the OM1.  
  
2.2 Both Tentative and Actual Markup would be read only fields.  
  
2.3 The Additional Charge input would be enabled only when the Settlement workflow is initialised and OM1 gets option to enter the Additional Charge in lieu of collecting more payment from the Buyer.  
  
2.4 The Credit Note amount should be read only.  
  
2.5 When read only values require computation then they should render "To be computed" as the value.  
  
2.6 The Application Markup would be dependent on the APS level declared Benchmark and Margin. If the user wants then they can select "Custom" checkbox allowing them to over-ride the APS level Interest rate and use their own custom interest rate. This custom rate would be isolated only to the Application and would not impact any other running application's calculation.  
2.7 Tenor is Days would be dependent on the following formula:  
Sale Invoice Due date - Purchase Invoice date.  
The Tenor would help calculate the Tentative Handling Fees for the said Application.  
  
2.8 Entire Application should have a Save Draft btn next to Approve so that user can save their progress related to Application and pickup where they left off.  
  
2.9 Application Transactions (Payments and Settlements have their own separate workflow and the Save Draft feature should be available to them as well).  
  
2.10 The Original Purchase Invoice Date and Amount are Read only fields used for reference for creating a Sale Invoice.  
  
2.11 Sale Invoice Total is based on the sum total of Invoice Amount + Tax Amount. The Tax amount is calculated based on the Tax percent being entered by the OM1.  
  
2.12 The Currency Prefix is based on the Currency dropdown used during creation of a Purchase Invoice.  
  
2.13 The Sale Invoice section will remain closed till the Buyer enters the Purchase Invoice details and saves it. Till then we will grey out the Sale Transaction Tab itself.  
  
2.14 Invoice Generation Date is only for record keeping purpose as currently the Tenor is computed based on the Invoice Due Date. In future we may the date on which Invoice is Generated but it is highly unlikely. We may even truncate it later as per Ops feedback.  
The Invoice Due date on the Sale Transaction cannot be earlier than the Invoice Generation date AND cannot be earlier than the Purchase Invoice date  
  
2.15 Funds received till date and Funds Outstanding are read only fields and would be available for anyone to read at all times and they are based on Simple formula of Receipts added till date. The Outstanding is Sale Invoice value -- Funds received till date.  
  
2.16 Invoice Number Generation and Validation

The system should generate an Invoice number and populate it as a placeholder in the new Invoice reference number input box. The Invoice number must follow this specific convention: DPWTF 2025 06 30 XXX, where:

DPWTF represents our department (DP World Trading FZE)

2025 indicates the year

06 indicates the month

30 indicates the date

XXX represents the incremental invoice number for that specific date

The Invoice Reference Number entered during the Sale Transaction must be unique. A validation process should run immediately after the Operations user inputs the number to verify its uniqueness. If a duplicate invoice number already exists in the system, the user should receive an alert notification. This validation ensures that duplicate invoices are never used for Sale transactions. In the future, we may implement automatic generation of unique invoice numbers.  
  
2.17 The Invoice File Upload Functionality should support multiple invoices as the Sale Transaction may have more than one invoice. The first invoice would be for the Invoice where the Tentative Handling fee was invoiced, the second invoice can be added for the actual amount of Additional Fee collected.  
  
2.18 For daily interest calculations, the computation should commence from the date of the first disbursement tranche within an application. Therefore, the application\'s purchase invoice date is not relevant for interest calculations. The critical date is the Transaction Date from the Payments section, which reflects the actual disbursement date and serves as the starting point for interest accrual.  
  
2.19 Under the Main Requested Tab of APS, we should host all APS that are due for Approval from any user. We should add the Invoice Number so that  
  
Requirement 3  
Implement a three-tier lifecycle management system: 1) Main Application, 2) Purchase/Sale Invoices, 3) Tranche Management  
As per Lifecycle stages section of PRD

Requirement 4  
Enable the addition of multiple payments per purchase/sale invoice, allowing Operations Maker/Checker to add unlimited payments

4.1 Presently we have an option to upload multiple invoices towards Purchase transaction. Since we want to limit One Application with a single Purchase Invoice, we have to disable the "Add invoice" button.

4.2 Remove the section called Payments from the tab of Application. Instead we will host the Payments and Receipts as a separate component to ensure that Operations team gets to see relevant transactions pertaining to Purchase and Sale Invoice within a single view.  
  
4.3 Add the Payment receipt component that should be rendered only when the user is on the Purchase Invoice Tab. Similarly, the Receipts component should be rendered only when the user is on the Sale Invoice Tab.  
  
4.4 Ensure each Payment and Receipt tab contains their Active user and Lifecycle event details alongside the Action  
  
Requirement 5  
Compute and compare actual vs. tentative handling fees; adjust any overcharged amounts via a credit note.  
Refer the Markup Definition and Lifecycle event  
  
Requirement 6  
Add an \'Additional Fees\' input on sale transactions for overdue/late fees, creating an AR entry at settlement that Operations can waive  
Refer to Oracle Requirement section for AR Aps and Credit note handling

Requirement 7  
Enable Buy-Sell module services for all approved user roles

Refer user Roles section and create the required definitions in Mawani for their proposed Actions of Edit/Update/Create

Changes: The date of Tenor should be based on the date (T-1) from the date of first Approved Purchase Payment.

EMAIL NOTIFICATION  
Email notifications will be delivered only to individuals associated with the specific workflow. Since Operations Manager users can function as both Maker and Checker roles simultaneously, we must ensure that the Operations Manager who initiated the workflow is identified by their email address. This would be applicable for all users with role of Operations Manager, Compliance Officer or Finance manager.

Initially, all users with the Operations Manager role will receive notifications at the workflow\'s start. However, once an Operations Manager acts as a Checker by performing any approval, rejection, or send-back action, they should be designated as an \"Operations Checker.\" After this designation, email notifications should no longer be sent to all users with the Operations Manager role to avoid unnecessary communications to the entire user base.

To be covered in Phase 2. I will add all events in PRD by 8^th^ August 25.  
  
1. APS Related Emails  
1.1 New APS

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS review pending with Checker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>All users with user role as Operations Manager </td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker who authored the new APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been submitted for Review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS resubmission pending with Maker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the new APS</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who reviewed the new APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been requested for resubmission.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS rejected by Operations Checker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the new APS</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who reviewed the new APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been rejected by Checker.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS sent to Compliance Officer</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Kamlesh Lohar. Not Suzane Ali as we only want Kamlesh to be CO for this event. Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker and Operations Checker who authored and Approved the request respectively</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Kamlesh,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been submitted for review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Rejected by the Compliance Officer</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker and Operations Checker who authored and Approved the request respectively</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Kamlesh Lohar. Not Suzane Ali as we only want Kamlesh to be CO for this event. Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Kamlesh,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been rejected by the Compliance Officer.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Active</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker and Operations Checker who authored and Approved the request respectively</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Kamlesh Lohar. Not Suzane Ali as we only want Kamlesh to be CO for this event. Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1} ‘s Advance Payment Solution Activated</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Kamlesh,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been approved by the Compliance Officer and is now Active.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

1.2 Modification to APS

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit Requested by Operations Maker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>All users with user role as Operations Maker barring the original OM1 author</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker who created the request</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been edited and submitted for Review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit Request Resubmission requested by Operations Checker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker who created the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who sent back the case</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit Resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been requested for resubmission.<br />
  <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS EDIT Request sent to Compliance Officer</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Kamlesh Lohar. Not Suzane Ali as we only want Kamlesh to be CO for this event. Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker and Operations Checker who authored and Approved the request respectively</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit Request submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Kamlesh,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been edited and submitted for Review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit Request Resubmission requested by Compliance Officer</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Checker who created the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit Resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been requested for resubmission.<br />
  <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit Rejected by the Compliance Officer</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker and Operations Checker who authored and Approved the request respectively</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Kamlesh Lohar. Not Suzane Ali as we only want Kamlesh to be CO for this event. Kamlesh.Lohar@dpworld.com</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit request rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1}’s Advance Payment Solution’s Edit request has been rejected by the Compliance Officer.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit Rejected by the Operations Checker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker who authored the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who rejected the Request</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit request rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1}’s Advance Payment Solution’s Edit request has been rejected by Checker.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Active after Update</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Maker who authored the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who rejected the Request</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1} ‘s Advance Payment Solution Edits Applied</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Kamlesh,  <br />
 <br />
${Name of APS given by OM1}’s Advance Payment Solution Edits have been applied.<br />
<br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

1.4 Settlement to APS  
To be covered in Phase 2/3  
  
**2. Application Related Events**  
2.1 New Application

| Status                                      | Active User        | Action Expected                                                                                                     |
|---------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| Application submission pending with Maker   | Operations Maker   | When Application is in the Draft stage and Maker has just saved the draft copy                                      |
| Application review pending with Checker     | Operations Checker | When Application is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back |
| Application resubmission pending with Maker | Operations Maker   | When Application is sent back by OM2 to OM1 with Remarks to correct something                                       |
| Active                                      | \-                 | Once approved then Application is in Active stage                                                                   |

CHANGE REQUIREMENTS  
Following our discussions with Credit and Compliance, we aligned that Credit Team should be added to the Workflows as Reviewers with possible options to skip them (vested with the Operations) team.  
  
Change Requirement 1  
Sale Transaction Related Changes (265271)

**Change Request: Fix Incorrect Indicative Invoice and AR Calculation Logic for APS Sale Transactions**

**Background**

During testing of the APS Sale Transaction process, the following issues were identified:

1.  **Indicative Invoice Amount** did **not include** the *Tentative Handling Charge*.

    a.  This caused mismatch between the displayed and computed invoice values.

2.  **AR (Accounts Receivable)** under the *Sales GL Code* incorrectly **included the Tentative Handling Charge**.

    a.  AR under **Sales GL Code** should **match the AP (Accounts Payable)** of Purchase.

    b.  **Handling Charges** and any other fees must go under their **own respective GL codes**, *not* under the Sales GL.

3.  The following fields should be **read-only** for the Operations Team and updated based on **system-calculated values only**:

**3.1 Indicative Invoice Amount**

a.  Computed as: **Actual Purchase Amount + Tentative Handling Fees**

b.  Editable **only** via the **"Override Markup"** option.

c.  Changing markup recalculates both **Handling Fee** and **Indicative Invoice Amount**.

**3.2 Tax Percentage and Tax Amount**

d.  Computed by **Oracle** at AR creation.

e.  Before Oracle response, display **"To be Calculated"**.

f.  Once AR data is received from Oracle, populate with actual tax percentage and amount.

**3.3 Invoice Amount**

g.  Before AR data: show **"To be Calculated"**.

h.  After AR data: compute as **Indicative Invoice Amount + Tax Amount**.

**3.4 Amount to be Collected from Buyer**

i.  Hidden until the Sale Invoice is **approved** by the Operations Checker.

j.  Once approved:  
    **Amount to be Collected = Invoice Amount - Amount Settled**

**Stage-Based Field Behavior**

| **Stage**                     | **Tax Percentage**         | **Tax Amount**                  | **Invoice Amount** | **Amount to be Collected**                |
|-------------------------------|----------------------------|---------------------------------|--------------------|-------------------------------------------|
| **Maker**                     | To be Calculated           | To be Calculated                | To be Calculated   | Hidden                                    |
| **Checker**                   | To be Calculated           | To be Calculated                | To be Calculated   | Hidden                                    |
| **Oracle (Post AR Creation)** | Actual Tax % (from Oracle) | Actual Tax Amount (from Oracle) | Indicative + Tax   | Visible = Invoice Amount - Amount Settled |

**Notes:**

- Maker and Checker stages rely only on Indicative data (Purchase + Tentative Handling Fee).

- Oracle stage populates final tax and invoice values after AR confirmation.

- Stage transitions follow transaction status flow: **Draft → Pending Approval → AR Created**.

**Field Permissions by Stage**

| **Field**                 | **Maker**                       | **Checker**                     | **Oracle (Post AR)**      | **Remarks**                                       |
|---------------------------|---------------------------------|---------------------------------|---------------------------|---------------------------------------------------|
| Actual Purchase Amount    | Editable                        | Read-only                       | Read-only                 | Maker can input or modify                         |
| Tentative Handling Fee    | Auto-calculated                 | Read-only                       | Read-only                 | Based on markup; changes only via Override Markup |
| Indicative Invoice Amount | Auto-calculated                 | Read-only                       | Read-only                 | Derived from Purchase + Handling Fee              |
| Override Markup           | Editable                        | Read-only                       | Read-only                 | Only Maker can trigger recalculation              |
| Tax Percentage            | To be Calculated (non-editable) | To be Calculated (non-editable) | Auto-filled (from Oracle) | Populated post AR creation                        |
| Tax Amount                | To be Calculated (non-editable) | To be Calculated (non-editable) | Auto-filled (from Oracle) | Populated post AR creation                        |
| Invoice Amount            | To be Calculated (non-editable) | To be Calculated (non-editable) | Auto-calculated           | Derived once AR data received                     |
| Amount to be Collected    | Hidden                          | Hidden                          | Auto-calculated           | Shown only after Checker approval                 |
| Settlement Fields         | Hidden                          | Editable (for approval)         | Auto-updated              | Updated based on invoice settlement progress      |

**Error Handling**

If AR creation (for Sale or Handling Fee) fails:

- Tax values remain unavailable.

- Settlement cannot proceed.

- Display error message:  
  **"AR Creation Failed --- Tax cannot be calculated."**

- System must block settlement actions until AR succeeds.

## Acceptance Criteria

| **Scenario**                                         | **Input / Condition**                                | **Expected Output / System Behavior**                                                                 |
|------------------------------------------------------|------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **1. Indicative Invoice Calculation**                | Actual Purchase = ₹1000Tentative Handling Fee = ₹50  | Indicative Invoice Amount = ₹1050                                                                     |
| **2. Override Markup Trigger**                       | User clicks "Override Markup" and changes markup %   | Handling Fee and Indicative Invoice Amount are recalculated                                           |
| **3. AR Creation Rule**                              | AP (Purchase) = ₹1000Handling Fee = ₹50              | AR under Sales GL = ₹1000 only(Handling Fee AR created separately)                                    |
| **4. Tax Fields Before AR Return (Maker / Checker)** | AR not yet received from Oracle                      | "Tax Percentage" and "Tax Amount" show **"To be Calculated"**                                         |
| **5. Tax Fields After AR Return (Oracle Stage)**     | Oracle returns AR with Tax = ₹126 (12%)              | Tax Percentage = 12%, Tax Amount = ₹126                                                               |
| **6. Invoice Amount After Tax (Oracle Stage)**       | Indicative Invoice = ₹1050Tax = ₹126                 | Invoice Amount = ₹1176                                                                                |
| **7. Amount to be Collected Visibility**             | Sale not approved by Operations Checker              | Field "Amount to be Collected" is **hidden**                                                          |
| **8. Amount to be Collected After Approval**         | Invoice ApprovedInvoice = ₹1176Amount Settled = ₹500 | Amount to be Collected = ₹676                                                                         |
| **9. AR Failure Handling**                           | AR creation for Sale or Handling Fee fails           | Display error: "AR Creation Failed --- Tax cannot be calculated."Settlement blocked until AR succeeds |
| **10. Stage Transition Logic**                       | Maker → Checker → Oracle                             | Values update automatically as per stage-based behavior                                               |
| **11. Field Permissions Validation**                 | Attempt to edit read-only fields                     | Non-editable; system should prevent modification with tooltip "Auto-calculated"                       |

## Example Calculation Walkthrough

| **Field**                     | **Formula**         | **Example Value** | **Result** |
|-------------------------------|---------------------|-------------------|------------|
| Actual Purchase               | \-                  | ₹1000             | ₹1000      |
| Tentative Handling Fee        | \-                  | ₹50               | ₹50        |
| **Indicative Invoice Amount** | Purchase + Handling | ₹1000 + ₹50       | **₹1050**  |
| Tax % (from Oracle)           | \-                  | 12%               | 12%        |
| **Tax Amount**                | 12% of ₹1050        | 0.12 × ₹1050      | **₹126**   |
| **Invoice Amount**            | Indicative + Tax    | ₹1050 + ₹126      | **₹1176**  |
| Amount Settled                | \-                  | ₹500              | ₹500       |
| **Amount to be Collected**    | Invoice - Settled   | ₹1176 - ₹500      | **₹676**   |

Change Requirement 2 on 12^th^ Nov 2025  
Add new user role for CA and HOC  
  
Note: We have developed the Settlement leg of Buy-Sell on the Platform and yet it has not been fully utilised. Let us pick this development only when we see the first Buy-Sell Transaction on the platform.  
  
Background:  
Presently, CA and HOC are not involved in the Buy Sell Platform. Most of their approvals happen offline though a recorded mail trail. We need to bring this interaction online.  
  
Current Workflows where CA and HOC would be involved:  
1. New APS setup  
New APS presently has Maker -\> Checker -\> Compliance Officer as workflow. In BuySell, the primary responsibility of an APS lies with the Operations team. This is a departure from our Credit Facility where Credit Analyst enters Facility related details.  
  
Since Credit Analyst and HOC will primarily act as a reviewer, we can place them after the Checker has completed her review of the APS entered by Maker.

New Change Request 1:  
Create access for CA and HOC users to the BuySell Platform:  
Presently, CA and HOC do not have access on the Arranging-BuySell Platform. We need to add Services access to the platform so that both Credit participants can look at the APS and Approve/Reject APS requests that are in their queue.  
  
New Change Request 2:  
APS Stages to be introduced on Workflow:

| Status                                         | Active User        | Action Expected                                                                                                     |
|------------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| APS submission pending with Maker              | Operations Maker   | When APS is in the Draft stage and Maker has just saved the draft copy                                              |
| APS review pending with Checker                | Operations Checker | When APS is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back         |
| APS resubmission pending with Maker            | Operations Maker   | When APS is sent back by OM2 to OM1 with Remarks to correct something                                               |
| APS rejected by Operations Checker             | \-                 | When OM2 rejects the APS request                                                                                    |
| APS review pending with Credit Analyst         | Credit Analyst     | When APS is to be reviewed by Credit Analyst after being approved by the Operation Checker                          |
| APS rejected by the CA                         | \-                 | When CA rejects the APS request                                                                                     |
| APS review pending with the HOC                | HOC                | When APS approved by the Credit Analyst is pending with the Head of Credit                                          |
| APS rejected by the HOC                        | \-                 | When HOC rejects the APS request                                                                                    |
| APS review pending with **Compliance Officer** | Compliance Officer | When APS is approved by OM2 and sits in Compliance Officer's queue to run Accuity offline and then approve the APS. |
| APS rejected by Compliance Officer             | \-                 | When APS approved by OM2 is rejected by the Compliance Officer due to failed FIRCO tests (Accuity)                  |
| Active                                         | \-                 | Once approved then APS is in Active stage                                                                           |

New Change Request 3:  
Allow CA, HOC to send back cases to the Operations Maker  
Both CA and Head of Credit should be allowed to send cases back to the Ops maker's queue in case they find any issues with the APS application.  
  
New Change Request 4:  
Email Notifications to be added for the new Workflow:  
  
(a) When APS approved by Ops Checker reaches to Credit Analyst's queue

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong></th>
<th>APS review pending with Credit Analyst</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>All users with user role as Credit Analyst </td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker and Checker who authored the new APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been submitted for Review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(b\) When CA or Even the HOC sends back the APS to Operations Maker (Not checker since Checker can't edit APS anyway)

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS resubmission pending with Maker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the new APS</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who reviewed the new APS and Credit Analyst who sent this for resubmission</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been requested for resubmission.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(c\) When CA rejects the APS and closes the workflow

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS rejected by Credit Analyst</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the new APS and Checker who approved it</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Credit Analyst who rejected the APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been rejected by the Credit Analyst.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(d\) APS Approved by the CA is now with HOC

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS review pending with HOC</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>User with role of HOC</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Credit Analyst who approved the APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear HOC,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been submitted for review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(e\) APS Rejected by the HOC

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Rejected by the Head of Credit</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Credit analyst who approved the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>OPS Maker, Checker who Authored and Approved the APS respectively</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution has been rejected by the Head of Credit.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

2\. Edit an APS for Buyer/Seller Details  
Presently, we allow the Operations team to Edit an Active APS to mostly update the Buyers and Sellers that can be added to an APS. Now CA and HOC would be involved in reviewing the new Buyers and Sellers added alongside any modifications.  
  
New Change Request 2.1  
CA and HOC user role to have access to Edit APS workflow  
  
New Change Request 2.2  
New Edit APS stage introduction

| Status                                                  | Active User        | Action Expected                                                                                                                |
|---------------------------------------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------|
| APS Edit Request review pending with Checker            | Operations Checker | When APS is submitted by OM1 and any OM whose email different from the creator can approve/reject/send back                    |
| APS Edit Request Rejected by Operations Checker         | \-                 | When OM 2 rejects the Edit Requests                                                                                            |
| APS Edit Request resubmission pending with Maker        | Operations Maker   | When APS is sent back by OM2 to OM1 with Remarks to correct something                                                          |
| APS Edit Request review pending with Credit Analyst     | Credit Analyst     | When APS edit request approved by the Operations Checker is pending review with CA                                             |
| APS Edit Request Rejected by CA                         | \-                 | When CA rejects the Edit Requests                                                                                              |
| APS Edit Request resubmission pending with Checker      | Operations Checker | When Compliance officers send back APS edit request back to the Checker                                                        |
| APS Edit Request review pending with the HOC            | Head of Credit     | When APS edit request approved by the CA is pending review with HOC                                                            |
| APS Edit Request Rejected by HOC                        | \-                 | When CA rejects the Edit Requests                                                                                              |
| APS Edit Request Review pending with Compliance Officer | Compliance Officer | When OM2 approved the Edit request, we proceed to Compliance Officer to review and either approve or send back the application |
| APS Edit Request Rejected by Compliance Officer         | \-                 | When CO rejects the Edit Requests                                                                                              |
| Active                                                  | \-                 | Once Compliance Officer approved then APS is in Active stage                                                                   |

New Change Request 2.3  
Allow Send backs from CA and HOC  
Both CA and Head of Credit should be allowed to send cases back to the Ops maker's queue in case they find any issues with the APS application.  
  
New Change Request 2.4  
Email Notifications  
  
(a) When APS Edit approved by Ops Checker reaches to Credit Analyst's queue

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong></th>
<th>APS Edit request review pending with Credit Analyst</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>All users with user role as Credit Analyst </td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker and Checker who authored the new APS</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution Edit Request has been submitted for Review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(b\) When CA or Even the HOC sends back the APS to Operations Maker (Not checker since Checker can't edit APS anyway)

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit resubmission pending with Maker</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the APS Edit request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who reviewed the APS Edit and Credit Analyst who sent this for resubmission</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Setup resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution Edit Request has been requested for resubmission.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(c\) When CA rejects the APS Edit request and closes the workflow

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit request rejected by Credit Analyst</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Operations Manager who authored the APS Edit and Checker who approved it</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Credit Analyst who rejected the APS Edit Request</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution Edit request has been rejected by the Credit Analyst.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(d\) APS Edit Request Approved by the CA is now with HOC

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit request review pending with HOC</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>User with role of HOC</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Credit Analyst who approved the APS Edit Request</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit submitted for Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear HOC,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution Edit request has been submitted for review.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

\(e\) APS Edit Request Rejected by the HOC

<table>
<colgroup>
<col style="width: 22%" />
<col style="width: 77%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>APS Edit request Rejected by the Head of Credit</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT</strong></td>
<td>Credit analyst who approved the request</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>OPS Maker, Checker who Authored and Approved the APS respectively</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${Name of APS given by OM1}’s Advance Payment Solution Edit Request Rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
 <br />
${Name of APS given by OM1} Advance Payment Solution’s Edit Request has been rejected by the Head of Credit.<br />
 <br />
You can review the request here &lt;link to APSID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>
