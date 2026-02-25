TRADE FINANCE  
PRESHIPMENT FINANCING PRD  
  
STAKEHOLDERS

| NAME       | ROLE      | DEPARTMENT        |
|------------|-----------|-------------------|
| Abhishek B | Author    | Product           |
| Neeraj G   | Reviewer  | Product           |
| Poomesh M  | Reviewer  | Finance           |
| Priyanka R | Reviewer  | Operations        |
| Pranjal D  | Reviewer  | Growth            |
| Anshul M   | Test      | Quality Assurance |
| Abhinav S  | Developer | Trade Finance Dev |

DOCUMENTATION

| DOCUMENT     | OWNER       | LINK                                                                                                                                                                                                                                                 |
|--------------|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Wireframe    | Abhishek B  | Refer Ticket for EPIC for Attachment                                                                                                                                                                                                                 |
| EPIC         | Abhinav S   | [Link ](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/250848)                                                                                                                                                                         |
| Process Flow | Abhishek B  | Part 1, [Part 2](https://dpworld-my.sharepoint.com/:i:/p/abhishek_b/IQBFDc7zVsa7QpVcW1BZu4s7ASWgcXcWDjS66SczYeMqizw?e=eZsaYR), [Part 3](https://dpworld-my.sharepoint.com/:i:/p/abhishek_b/IQCRkm5nYtghQYextefwzFH8AYR71f0jMn2JPOFo7AuO_LY?e=ocohaX) |

TIMELINES

| VERSION | UPDATE                   | DATE      | COMMENT                                                                                                                      |
|---------|--------------------------|-----------|------------------------------------------------------------------------------------------------------------------------------|
| 0.1     | Initial Draft            | 08-Sep-25 | Added all relevant module                                                                                                    |
| 0.2     | Review Round 1           |           | Product                                                                                                                      |
| 0.3     | Review Round 2           |           | Development                                                                                                                  |
| 0.4     | Tech and Design Grooming |           | Quality Assurance                                                                                                            |
| 0.5     | Change Request 1         | 19-Nov-25 | [Adds BCO Terms Acceptance incase terms updated by OM1](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/268968) |

**BACKGROUND**  
  
**The Challenge: A Gap in Working Capital Financing  
**DPWFS has successfully launched multiple financing solutions that help importers and exporters secure necessary funding while their goods are in transit. Typically, clients approach us when they are about to ship or receive their goods.

While our current financing provides a necessary respite for their cash flow at the logistics stage, a critical need for working capital begins much earlier---at the time a production request or **purchase order (PO)** is received.

**The Opportunity: PreShipment Financing  
**Currently, there is no financing source available for our customers when they first receive an order from an importer. This creates a significant financial gap. For this reason, we need to develop a new financing product that provides working capital to **produce the goods**, not just after an invoice is raised.

**Key Distinction between Pre-Shipment and Post-Shipment Financing**

| Criteria               | Pre-Shipment Financing                                                                                                                                              | Post-Shipment Financing                                                                                              |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Tenor                  | Shorter term, typically up to 45 days to cover production.                                                                                                          | Longer term can be up to 180 days to cover the shipping and payment cycle.                                           |
| Risk & Pricing         | Very high risk, as production may face delays or failure. This results in a higher interest rate (e.g., SOFR + 3.5%).                                               | Relatively lower risk, as goods are finished and shipped. This allows for a lower interest rate (e.g., SOFR + 2.5%). |
| Margins (Advance Rate) | Lower advance rate is offered against the purchase order value (e.g., up to 80%).                                                                                   | Higher advance rate is possible against the confirmed invoice value (e.g., up to 90%).                               |
| Applicable Products    | Purchase Order Financing is the primary product.                                                                                                                    | Products include Inventory Financing and Invoice Discounting/Factoring.                                              |
| Documents Required     | A bona fide Purchase Order (PO) from a reputable buyer is essential.                                                                                                | Shipping documents are required, such as a Bill of Lading and Commercial Invoices.                                   |
| Convertibility         | Must either be settled upon shipment or converted into a post-shipment financing facility.                                                                          | This is the final stage of financing, settled when the end buyer pays the invoice.                                   |
| Date Extension         | The Due Date (deemed as the date of Conversion from Pre to Post shipment) can be extended by the Operations Maker with CA being Checker.                            | The Due date can be extended by Maker (operations) and approved by CA.                                               |
| AECB Applicability     | New Drawdowns as a Credit Line + Overdue have to be reported to AECB if the Pre-Shipment product is not converted to Post shipment on or before the Conversion Date | Same for Post Shipment                                                                                               |

**PreShipment Financing Practical Business Scenario**  
Step 1: Order Received from Importer  
1.1 The Importer in China receives an order to supply Solar Wafers to an Exporter in India  
  
1.2 The Exporter issues a Purchase Order with Order Value, Currency, Delivery Date and Payment Terms.  
  
1.3 The importer receives the Purchase Order and Accepts it to commence Production.  
  
Step 2: Loan against Purchase Order  
2.1 The Exporter in China would approach DPWFS to obtain funds against the purchase order received from the Importer.  
  
2.2 DPWFS would assess the Purchase Order and then grant loan up to 80% of the Purchase Order Face value.  
  
2.3 A new Application would be raised in the LMS for this and DPWFS would provide the client a flexibility to withdraw up to 80% of the PO Face value in a single or multiple transactions.  
  
Step 3: Individual Purchase Order Application  
3.1 The Exporter in China would proceed to make Drawdown using an Application and withdraw 50% of the available funding amount.  
  
3.2 In the PO Application, he would specify the Conversion date. The conversion date refers to the date on which the PO will either be converted by Exporter into an Invoice or PO would be paid off by the Exporter. Each Application would carry their own Conversion Date.  
  
3.3 The Rate of interest would be dependent on the Tenor as per the date of disbursal requested and the Conversion date. For Purchase order financing, we would mostly use the Benchmark rate but in rare cases we can override this rate and reference the Interpolated rate or a Fixed rate of Interest.  
  
Step 4: PO Application conversion to Invoice Application  
4.1 The Purchase Order Individual Applications (for each drawdown) would mandatorily convert to Invoice Application. In such conversion, the Exporter would trigger a conversion by clicking on an existing PO Application (that is in Funds Transferred stage) and then proceed to convert it to Post Shipment.  
  
4.2 The Post Shipment conversion would offer three product types:  
  
4.2.1 Inventory Financing, in case the Exporter wants to keep the goods in their warehouse for longer before shipping it to the client.  
  
4.2.2 Invoice discounting or even Factoring, where the Exporter has issued an invoice to the Importer and the Exporter now wants to get an early payment against the Instrument.  
  
4.2.3 Trade Payable Financing, in case the PO financing was taken by the Importer for his suppliers (Exporters) and now he has received an invoice from the supplier that he'd like DPWFS to Pay.  
  
4.3 The Conversion of PO to Invoice would also mean transfer of the Carried Principal, Interest and Charges from the initial PO Application to the new Invoice Application. Details on how said transfer is done is mentioned in PRD.  
  
Step 5: Handling PO that are not Converted by Clients  
5.1 There can be scenarios where the client (Exporter/Importer) does not convert their Purchase Order Application(s) into Invoice Application. In such scenario, they have two options:  
  
5.1.1 Either Extend the Conversion date if they need more time to get the relevant documents.  
  
5.1.2 Pay off the entire outstanding amount for PO application(s) as per their Conversion due dates.  
  
5.2 In case the Pre-shipment Application is not converted on or before the Conversion date and there is no active workflow to Extend the Conversion date, then in such scenario we will have to report the Application as Delayed and we will Report it to AECB.  
  
![](media/image1.png){width="7.173077427821522in" height="9.277950568678914in"}  
  
**Loan Management System Process Flow**  
![A diagram of a flowchart
AI-generated content may be incorrect.](media/image2.png){width="5.576388888888889in" height="8.53846128608924in"}  
Reference the Process flow from the **[link](https://drive.google.com/file/d/1NHKB1ECohRMpgoWI2H9knWFjt3gotHoi/view?usp=sharing)**

**DEFINITIONS  
**  
**Purchase Order Financing** is loan provided to Exporters or Importers for the purpose of procuring material/ pay staff to build the end product. Purchase Order refers to a document issued by an Importer to an Exporter stating that they intend to make a purchase from the Exporter. PO loan can be extended either to the Exporter or to the Importer. Thus, we have two products variants within PO Financing:  
**(a) Disbursement to Client:** The Exporter of the goods is our Client.  
  
**(b) Disbursement to Counterparty:** The Importer provides credit to the Exporter to ship them the goods.

**Master Purchase Order (PO)** serves as the primary \"umbrella\" agreement for a financing request tied to a specific trade transaction. While the Master PO document, identified by a unique number from the buyer\'s system, outlines the entire transaction\'s scope, it\'s not a single loan application. Instead, it acts as a parent record that is broken down into one or more Individual Purchase Order Applications.

This structure allows a large order to be financed in multiple stages, or tranches, aligning the release of funds (disbursements) with the seller\'s actual cash flow needs, such as buying raw materials or paying for manufacturing.

Key attributes of a Master PO include:

- \Face Value: The total value of the entire order.

- Currency: The currency for payment (e.g., USD, EUR, INR).

- Issued Date: The date the buyer created the purchase order.

- Payment Terms: The schedule of payments from the buyer to the seller, which often dictates the disbursement schedule for financing.

**Example:** Master PO with Multiple Tranches

Let\'s continue with our company, Himalayan Exports, which has secured a large order from a US-based retailer, \"Global Retail Inc.\"

Master Purchase Order Details

- Master PO ID: MPO-GR-2025-112

- Face Value: ₹5,000,000

- Currency: Indian Rupee (₹)

- Issued Date: September 8, 2025

- Payment Terms:

  - 40% of the order value needed upfront for raw material procurement.

  - 60% of the order value needed 60 days later to fund labour and manufacturing.

Based on these terms, Himalayan Exports\' financing is split into two separate applications, each with a unique interest rate tied to its specific financing period (Tenor). The bank\'s lending margin is a fixed 4.00%.

\(1\) **Individual Purchase Order Application 1 (Tranche 1)**  
This first disbursement is to buy raw materials.

- Application Number: 1223434 (LMS Generated)

- Purpose: Raw Material Procurement

- Disbursement Amount: 40%×₹5,000,000=₹2,000,000

- Preshipment Tenor: 90 days (The estimated time until the raw materials are processed and ready for the next stage).

- Interest Rate Calculation:

  - Benchmark Rate: 90-day SOFR = 5.30%

  - Lender\'s Margin: 4.00%

  - Total Interest Rate: \$5.30% + 4.00% = 9.30% per annum

\(2\) **Individual Purchase Order Application 2 (Tranche 2)  
**This second disbursement is to pay for factory operations to turn the raw materials into finished goods.

- Application Number: 1223435 (LMS Generated)

- Purpose: Manufacturing & Labor Costs

- Disbursement Amount: 60%×₹5,000,000=₹3,000,000

- Preshipment Tenor: 30 days (A shorter period is needed to complete the final production run).

- Interest Rate Calculation:

  - Benchmark Rate: 30-day SOFR = 5.35%

  - Lender\'s Margin: 4.00%

  - Total Interest Rate: \$5.35% + 4.00% = 9.35% per annum

In this example, the single Master PO of ₹5,000,000 was funded through two distinct applications. Each application had its own loan amount and, critically, a different interest rate determined by its unique financing tenor.  
  
Master PO Exposure Control refers to the practise of managing the maximum exposure that we will take against any given Purchase Order. As discussed earlier, each PO will have its Face value. The Credit Analyst when setting up the Credit Facility would define the Maximum Funding Percentage of the  
**  
****Individual Purchase Order Carried Amount** refers to the amount being carried from an individual Purchase order Financing application when it is converted from a Preshipment to PostShipment Stage. During Conversion, we will consider the following elements that will be carried:  
(a) Net Principal  
(b) Net Interest Accrued**  
**(c) Net Fee & Charges **  
**We use the Net amounts and not the original values because there can be a possibility of the certain settlements with the PreShipment Financing Applications where the user may have cleared some amount of Principal, Interest and Charges before Converting the loan.  
**  
**Further, the Interest Accrued would be equivalent to the Interest Accrued till the time the Conversion is finalised and approved by the Operations Checkers. **  
  
Example Scenario  
**Let\'s imagine a company called \"Himalayan Exports\" receives a large purchase order for handmade textiles. To fulfil this order, they need to buy raw wool and dyes. They secure a Preshipment Purchase Order Financing loan from a bank to cover these initial costs.

**Initial Loan Details (Preshipment Stage)**

The bank provides the following financing to Himalayan Exports:

- Original Principal Loaned: ₹1,000,000

- Upfront Processing Fee: ₹10,000

- Interest Rate: 12% per annum (or approximately 0.03287% per day)

- Time until Conversion: The time from when the loan was taken to when the goods are shipped and the loan is converted to the Post-Shipment stage is 90 days.

Before conversion, the total interest accrued over 90 days is calculated:

- Total Interest Accrued: ₹1,000,000×(12%/365 days)×90 days=₹29,589

**Partial Repayments (Before Conversion)  
**A few weeks before shipping the goods, Himalayan Exports receives a small advance payment from their buyer. They decide to use this to pay down some of their preshipment loan obligations.

- Principal Repayment: They pay back ₹150,000 of the principal.

- Fee Repayment: They clear the full processing fee of ₹10,000.

- Interest Repayment: They decide not to pay any of the accrued interest yet.

**Calculating the Carried Amount for Post-Shipment  
**Now, it\'s time to convert the loan from the Preshipment to the Post-Shipment stage. We need to calculate the net amounts that will be carried forward.

**1. Calculate Net Principal  
**This is the original principal minus any principal that was repaid.

- Original Principal: ₹1,000,000

- Principal Repaid: −₹150,000

- Net Principal to be Carried: ₹850,000

**2. Calculate Net Interest Accrued  
**This is the total interest that has built up minus any interest that was repaid.

- Total Interest Accrued: ₹29,589

- Interest Repaid: −₹0

- Net Interest to be Carried: ₹29,589

**3. Calculate Net Fees & Charges  
**This is the original fee amount minus any fees that were repaid.

- Original Fees: ₹10,000

- Fees Repaid: −₹10,000

- Net Fees to be Carried: ₹0

**4. Calculate the Total Carried Amount  
**Finally, we add up all the net amounts to find the total amount carried forward into the Post-Shipment financing stage.  
Carried Amount=(Net Principal)+(Net Interest)+(Net Fees)  
Carried Amount=₹850,000+₹29,589+₹0

The Individual Purchase Order Carried Amount that is converted to the Post-Shipment stage is ₹879,589.

**Note:** The Borrower may give the request to convert the Preshipment product to PostShipment at any time but the Accrued interest would move from First Application to Second application only when the Operations Checker finally approves the said conversion. [Till then we continue to compute the Interest on the outstanding Net Principal amount.]{.underline} **  
  
Inventory Financing** is a form of PostShipment financing where the Exporter or Importer would take in the Finished goods and then place it in a warehouse. The Warehouse in turn returns a Warehouse Receipt. The warehouse receipt contains the inventory stored within the warehouse. DPWFS provides loans against this inventory based on a rough estimate of the Inventory market value.  
**  
Trade Payable Financing** is another form of PostShipment Financing aimed at Importers using funding to pay for the Invoice raised by their Exporters against them. TP Financing is already a standard product offered by DPWFS to majority of its customers and is the most common occurring product type across our Credit Facilities. **  
  
Invoice Discounting** is a third form of PostShipment financing aimed at Exporters who avail funding on Invoices issued by them to their Importers/Clients. Invoice discounting provides up to 80% of the invoice value to the Exporter. Collection responsibility remains with the exporter on the date of Repayment. Buyers would pay to the Seller who would inturn settle the funds with DPWFS. **  
  
****Tranche Based payments** Pre and post-shipment financing involves large sums of money. To give you context, a purchase order for CKD parts for 100 vehicles can run into multiple millions. With such high-risk transactions, exporters and importers agree on a payment schedule. This payment schedule ensures that funds are released to the parties based on a set timeline.

In our Master Purchase Order example shared above, we have demonstrated how a PO can be broken into multiple drawdown requests tagged to individual applications. Each tranche is requested through an application, and each application successfully processed results in a reduction in available balance from the Master PO or Master Invoice.

Think of Master PO and Master Invoice as a credit card limit. You can draw down all the balance in a single application or in multiple tranches..  
  
**Master Sale Invoice** refers to the instrument created by an exporter once they have converted the purchase order into finished goods and the goods are ready to be transported to the buyer\'s location. The Master Sale Invoice, along with the Bill of Lading, consignment details, etc., serves as valid document proof for DPWFS to convert any pre-shipment application to post-shipment.

The Master Sale Invoice contains key details such as:

- Currency in which payment is to be made

- Invoice generation date

- Due date by when the invoice should be cleared

- Total value of the invoice (also known as the face value) containing the goods + tax amount

A Master Sale Invoice contains a unique invoice reference number generated by the exporter/seller\'s ERP solution. This unique reference is used to tag related applications to the Master Sale Invoice.

Note: Only borrowers can initiate a request to convert a pre-shipment financing application to post-shipment. This constraint is added because the buyer is expected to upload multiple supporting documents before sending the application to the operations maker.

Credit Facility Adjustment: At the time of setting up the credit facility, the credit analyst may increase or decrease the maximum funding available against an invoice. In such cases, the Master Invoice Available Limit would be modified to reflect the increased amount and will be available for withdrawal.

**Example of Master Sale Invoice Calculation**

**Pre-Shipment Phase:**

- Master PO value: ₹1,00,000

- Maximum percentage given by DPWFS against PO: 80%

- Maximum loan available: ₹80,000

- Loan amount availed by exporter: ₹80,000 (full amount)

- Additional charges:

- Interest: \$100

- Transaction fee: \$100

- Total carried forward amount: ₹80,000 + \$200

**Post-Shipment Phase:**

- New Sale Invoice value: ₹1,18,000

- Maximum funding available: 90% of Sale Invoice

- Maximum available amount: 90% of ₹1,18,000 = ₹1,06,200

- Less: Carried forward amount from Purchase Order = ₹80,000 + \$200

- Net available balance: ₹1,06,200 - (₹80,000 + \$200) = ₹26,000 (approx., minus \$200)

This net available amount can be withdrawn by the borrower in either a single tranche or multiple tranches. Each tranche will result in the available balance being reduced accordingly.

**Example of Multiple Applications within Master Invoice  
**Scenario: The borrower decides to withdraw the ₹26,000 net available balance in two separate applications:

**Application 1:**

- Application amount requested: ₹15,000

- Purpose: Immediate working capital requirement

- Status: Approved and disbursed

- Remaining available balance: ₹26,000 - ₹15,000 = ₹11,000

**Application 2:**

- Application amount requested: ₹11,000

- Purpose: Final settlement and logistics costs

- Status: Approved and disbursed

- Remaining available balance: ₹11,000 - ₹11,000 = ₹0

**Final Status:**

- Total Master Invoice value: ₹1,18,000

- Total amount utilized: ₹80,000 (carried forward) + ₹15,000 (App 1) + ₹11,000 (App 2) = ₹1,06,000

- Available balance: ₹0

**Individual PO Application Extension** refers to the Workflow for requesting the Internal Admins to extend the conversion date on the LMS platform. An exporter may take extension to account for Documents not available at time of Shipping or Bill of Lading not issued by the Shipper and hence can not start the Pre to Post Conversion. In such cases they would request a new extension on the Application. The Process of Extension involves Operations Maker requesting Extension with Operations Checker who would then forward the request to Credit Analyst. The Credit analyst would then approve or reject the request.

Please refer the below process flow ![](media/image3.png){width="6.1in" height="6.582590769903762in"}

**AECB Reporting** refers to the act of reporting all active credit facility and individual drawdown applications with the credit bureau AECB. In case of Pre and Shipment financing, we will have the following Credit Events:  
1. When a new Credit Facility is granted to the Borrower; we create a new Credit exposure on AECB.  
  
2. When a new Application is requested and approved by DPWFS against the Borrower then we update the Outstanding value against the previously opened credit line.  
  
3. When there is a repayment we reduce the Credit outstanding amount from the existing Credit trade line on AECB.  
  
4. When the Individual application conversion date has gone past due but there is no active workflow to Extend the Conversion Date then we mark the Application as DPD and report the same to AECB.  
  
5. When the Application (Pre-or Post shipment) moves to watchlist and we mark the application as not watchlist then we will remove the DPD tag from the Credit line and update it accordingly.  
  
  
**REQUIREMENTS**  
**Requirement 1.**  
**Purchase Order Financing Product Seeding Request**  
So that the option is visible at the time of requesting a credit facility and for the credit team approving the facility**.**  
  
**Requirement 2.**  
**New Field Introduction for Application Section on Arranging and Lending**  
(Please refer the wireframe on positions)

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 39%" />
<col style="width: 19%" />
<col style="width: 22%" />
</colgroup>
<thead>
<tr class="header">
<th>Label</th>
<th>Meaning</th>
<th>Is to be Pre-Fetched</th>
<th>Validation</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Master Purchase Order Number</td>
<td>Unique identifier generated by the Seller's ERP and available on the issued PO.</td>
<td>After 3 characters, the search for the same number should start and available Instrument numbers should come as dropdown suggestions.</td>
<td>TBD with Operations as Different Clients may have different way of placing Invoice/Purchase Order Numbers hence adding constraint would not be apt.</td>
</tr>
<tr class="even">
<td>Financial Institution</td>
<td>Financial Institution that the Borrower wants to endulge</td>
<td>Yes, if Master PO Number selected</td>
<td>Dropdown of available FI</td>
</tr>
<tr class="odd">
<td>Counterparty</td>
<td>Counterparty for taking up the loan</td>
<td>Yes, if Master PO Number selected</td>
<td>Dropdown of approved Clients with an optiton to add a new Counterparty</td>
</tr>
<tr class="even">
<td>Master PO Currency</td>
<td>Currency mentioned on the PO</td>
<td>Yes, if Master PO Number selected</td>
<td>Dropdown of available currencies based on Credit Facility Approved Currencies</td>
</tr>
<tr class="odd">
<td>Disbursement Currency</td>
<td>Funding Currency requested by the customer</td>
<td>Yes, if Master PO Number selected</td>
<td>Dropdown of available currencies based on Credit Facility Approved Currencies</td>
</tr>
<tr class="even">
<td>Master PO Face Value</td>
<td>Facevalue of the PO issued inclusive of Taxes</td>
<td>Yes, if Master PO Number selected</td>
<td>Only Numerics. Positive values with up to 4 decimal places</td>
</tr>
<tr class="odd">
<td>Master PO Funding Percentage</td>
<td>Read only field as per Credit facility</td>
<td>Always present regardless of PO number</td>
<td>Numeric. Read Only Field.</td>
</tr>
<tr class="even">
<td>Master PO Funding Limit</td>
<td>Derived value based on Master PO Face Value and Master PO Funding Percentage</td>
<td>Computed Read only Field</td>
<td>Read only Field. Based on Master PO Face Value * Master PO Funding Percentage</td>
</tr>
<tr class="odd">
<td>Master PO Utilised Limit</td>
<td>Derived Read only field showcasing the Amount of funds utlised by the Borrower.</td>
<td>Yes, if Master PO Number selected</td>
<td>Read only Field based on the Following Formula:<br />
SUM (Individual PO Application Disbursed Amount)</td>
</tr>
<tr class="even">
<td>Master PO Available Limit</td>
<td>Derived Read Only field.</td>
<td>Yes, if Master PO Number selected</td>
<td>Read only Field based on the Following Formula:<br />
Master PO Funding Limit - SUM (Individual PO Application Disbursed Amount)</td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td>Individual Purchase Order Detail</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>PO Request Date</td>
<td>Day on which the Funding is requested by the Applicant. Can be a future date as well.</td>
<td>No</td>
<td>Valid date. Can not be earlier than the Credit Facility Set up date or Earlier than the Application on which Master PO was added to the Application. i.e the Request date can not be earlier than the previous Tranche's request date.</td>
</tr>
<tr class="even">
<td>PO Terms (days)</td>
<td>Expected Tenor of the drawdown application. Based on this the Application would be converted to Post Shipment Application or Get Paid/Extended.</td>
<td>No</td>
<td>Positive Number with upper cap based on the Max Tenor specified under the Credit Facility.</td>
</tr>
<tr class="odd">
<td>PO Conversion Due Date</td>
<td>An important date on which the borrower promises to Convert the PO into an Invoice or Extend or Settle the Application</td>
<td>Derived Read only field based on PO Requested Date and PO Terms (days)</td>
<td>Derived Read only field based on the following calculation:<br />
PO Request Date + PO terms (days)</td>
</tr>
<tr class="even">
<td>PO Request Amount</td>
<td>Refers to the amount of funds requested by the client.</td>
<td>No</td>
<td>Positive Number up to 4 decimals only.<br />
Can not be higher than the Master PO Available Limit.</td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>Label</td>
<td>Meaning</td>
<td>Is to be Pre-Fetched</td>
<td>Validation</td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>PO Application Number</td>
<td>Refers to the Purchase Order Application Number used by the Client to Convert it to PostShipment Financing</td>
<td>Read only based on the Converted PO Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="even">
<td>PO Conversion Date</td>
<td>Refers to the date on which the Purchase Order Application was Approved by Operations Checker to be converted; until then the Conversion date will be blank and a read only field.</td>
<td>Read only based on the Converted PO Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>PO Carried Principal 195,000</td>
<td>Refers to the Net Principal (Base Prinicpal - Credit Notes- Settled amounts) from the Original Purchase Order Individual Application</td>
<td>Read only based on the Converted PO Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="even">
<td>PO Carried Interest</td>
<td>Refers to the Net Accrued Interest (Overall Accrued Interest - Credit Notes - Actual settlements) from previous Purchase Order Application</td>
<td>Read only based on the Converted PO Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>PO Carried Fee(s)</td>
<td>Refers to all Carried Charges and Fees combined from the original Purchase Order Individual Application</td>
<td>Read only based on the Converted PO Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="even">
<td>Master Invoice Number</td>
<td>Refers to the unique identifier number as per the Seller's ERP system. This would be used to establish a common linkage between multiple Individual Invoices as said Master invoice number.</td>
<td>After 3 characters, the search for the same number should start and available Instrument numbers should come as dropdown suggestions.</td>
<td>TBD with Operations as Different Clients may have different way of placing Invoice/Purchase Order Numbers hence adding constraint would not be apt.</td>
</tr>
<tr class="odd">
<td>Financial Institution</td>
<td>Will be locked based on the Original Individual Purchase Order's FI</td>
<td>Autopopulated based on Converted PO Application details</td>
<td>NA. Read only Field</td>
</tr>
<tr class="even">
<td>Counterparty</td>
<td>Will be locked based on the Original Individual Purchase Order's Counterparty</td>
<td>Autopopulated based on Converted PO Application details</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>Master Invoice Currency</td>
<td>Will be locked based on the Original Individual Purchase Order's PO Currency</td>
<td>Autopopulated based on Converted PO Application details</td>
<td>NA. Read only Field</td>
</tr>
<tr class="even">
<td>Master Invoice Disbursement Currency</td>
<td>Will be locked based on the Original Individual Purchase Order's PO Disbursement Currency</td>
<td>Autopopulated based on Converted PO Application details</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>Master Invoice Face Value</td>
<td>Refers to the Amount inclusive of Taxes mentioned on the Master Invoice</td>
<td>Yes, if the Master Invoice Number is provided and exists in the DB</td>
<td></td>
</tr>
<tr class="even">
<td>Master Invoice Funding Percentage</td>
<td>Refers to the maximum amount of Percentage funding allowed on the Invoice's face value. Credit Analyst would cap it to 80-90%. This would mostly be higher than the PO Funding Percentage</td>
<td>Read Only Field, would be fetched directly from the Credit Facility's Invoice Max Funding Approved by the Credit Analyst</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>Master Invoice Funding Limit</td>
<td>Read only field, based on the Face value and the Funding Percentage</td>
<td>NA. Read only Field</td>
<td>Master Invoice Face Value * Master Invoice Funding Percentage</td>
</tr>
<tr class="even">
<td>Master Invoice Utilised Limit</td>
<td>Refers to the amount of funds already utilised in Previous Purchase Order Applications and Current Invoice Applications</td>
<td>Read only field refers to the sum of all Principal Outstanding of previously open Individual Purchase Order Application + Currently Open Individual Invoice Application</td>
<td>NA. Read only Field</td>
</tr>
<tr class="odd">
<td>Master Invoice Available Limit</td>
<td>Funding Limit - Utilised Limit</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>Individual Invoice Amount</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td>Invoice Request Amount</td>
<td>Amount in Whole numbers requested by the Client for Disbursal.</td>
<td>NA</td>
<td>Positive Number up to 4 decimals only.<br />
Can not be higher than the Master Invoice Available Limit.</td>
</tr>
<tr class="odd">
<td>Invoice Request Date</td>
<td>Date on which funding is requested</td>
<td>NA</td>
<td>Valid date. Can not be earlier than the Credit Facility Set up date or Earlier than the Application on which Master Invoice was added to the Application. i.e the Request date can not be earlier than the previous Tranche's request date.</td>
</tr>
<tr class="even">
<td>Invoice Terms (days)</td>
<td>Duration of Invoice tenor in Days</td>
<td>NA</td>
<td>Positive Number with upper cap based on the Max Tenor specified under the Credit Facility.</td>
</tr>
<tr class="odd">
<td>Invoice Due Date</td>
<td>Read only field based on Invoice Term +</td>
<td>NA</td>
<td>Derived Read only field based on the following calculation:<br />
Invoice Request Date + Invoice terms (days)</td>
</tr>
</tbody>
</table>

**Requirement 3.**  
**PreShipment to PostShipment Application Workflow**  
Background: We will introduce a new workflow that would allow the Clients to initiate a new workflow to convert any application that is under the Preshipment stage with current Application status as Funds Transferred to be Converted into PostShipment.  
  
Note:  
(a) This new workflow would add new status to the existing Application status. Alternatively we can create a sub status for the pre-to-post shipment workflow. We will discuss with the Devs about cons of doing the sub status and then take a call.

**Update on 1^st^ Dec 25:**  
Post discussion with the devs, it was agreed that:  
a1. The below mentioned statuses would be hosted under the NEW Application.  
a2. The original parent Application would host a single Status called "PostShipment Conversion in Process"  
a3. In case the NEW Application's conversion is rejected then the Original Application's status would revert to the original status. It could be Funds Transferred or Even Partially Settled in case some repayments were made on the original application.  
a4. The scenario between Funds Transferred and Partial Transferred would remain the same. We would move outstanding Principal, Interest and Charges from Original to the NEW.  
  
  
(b) This functionality would work only for the Purchase Order Financing Product.

© Only Clients and Operations Maker can initialise the conversion workflow.

| **Status**                                     | **Active User**    |
|------------------------------------------------|--------------------|
| Conversion Request Pending Client Submission   | Client             |
| Conversion Request Pending Maker Review        | Operations Maker   |
| Conversion Request Pending Checker Review      | Operations Checker |
| Conversion Request Pending Client Resubmission | Client             |
| Conversion Request Pending Maker Resubmission  | Operations Maker   |
| Conversion Request Rejected by Maker           | \-                 |
| Conversion Request Rejected by Checker         | \-                 |
| Converted to Post-Shipment                     | \-                 |

**Requirement.**  
**Master PO/Invoice: Parent-Child Relationships, Credit Notes and Exposure Control**

This example details the exposure control and limit management for a Master Purchase Order (MPO) and its transition to a Master Invoice (MI), tracking all associated applications, drawdowns, settlements, and credit notes.

**  
Step 1: MPO Initialization**

A client gets a Master Purchase Order approved.

- **Master Purchase Order (MPO) Number:** MPO-001

- **MPO Approved Limit:** ₹1,000,000

- **Initial MPO Available Limit:** ₹1,000,000

| **Item**    | **Approved Limit** | **Available Limit** | **Outstanding** |
|-------------|--------------------|---------------------|-----------------|
| **MPO-001** | **₹1,000,000**     | **₹1,000,000**      | **₹0**          |

**  
Step 2: First Drawdown (Application 1 - Pre-shipment)**

The client creates the first application linked to the MPO.

- **Action:** Create Application 1.

- **Requested Amount:** ₹500,000

- **New MPO Available Limit:** ₹1,000,000 - ₹500,000 = ₹500,000

| **Item**                 | **Approved Limit** | **Available Limit** | **Outstanding** |
|--------------------------|--------------------|---------------------|-----------------|
| **MPO-001**              | **₹1,000,000**     | **₹500,000**        | **₹500,000**    |
| Application 1 (Pre-ship) | ₹500,000           | ₹0                  | ₹500,000        |

**  
Step 3: Second Drawdown (Application 2 - Pre-shipment)**

The client requires more funds for another part of the order.

- **Action:** Create Application 2.

- **Requested Amount:** ₹250,000

- **New MPO Available Limit:** ₹500,000 - ₹250,000 = ₹250,000

| **Item**                 | **Approved Limit** | **Available Limit** | **Outstanding** |
|--------------------------|--------------------|---------------------|-----------------|
| **MPO-001**              | **₹1,000,000**     | **₹250,000**        | **₹750,000**    |
| Application 1 (Pre-ship) | ₹500,000           | ₹0                  | ₹500,000        |
| Application 2 (Pre-ship) | ₹250,000           | ₹0                  | ₹250,000        |

**  
Step 4: Credit Note on Application 1 (New Step)**

The client receives a credit note for ₹3,000 against Application 1 due to a minor adjustment. This acts as a principal reduction.

- **Action:** Apply a credit note to Application 1.

- **Credit Note Amount:** ₹3,000

- **Calculation:** The credit note increases the MPO available limit.

- **New MPO Available Limit:** ₹250,000 (Previous Limit) + ₹3,000 (Credit) = ₹253,000

- **Application 1 New Outstanding:** ₹500,000 - ₹3,000 = ₹497,000

| **Item**                 | **Approved Limit** | **Available Limit** | **Outstanding** |
|--------------------------|--------------------|---------------------|-----------------|
| **MPO-001**              | **₹1,000,000**     | **₹253,000**        | **₹747,000**    |
| Application 1 (Pre-ship) | ₹500,000           | ₹0                  | ₹497,000        |
| Application 2 (Pre-ship) | ₹250,000           | ₹0                  | ₹250,000        |

**  
Step 5: Partial Repayment on Application 2**

The client makes a partial payment towards Application 2.

- **Action:** Settle part of Application 2.

- **Settlement Amount:** ₹100,000 (Principal)

- **New MPO Available Limit:** ₹253,000 (Previous Limit) + ₹100,000 (Repayment) = ₹353,000

- **Application 2 New Outstanding:** ₹250,000 - ₹100,000 = ₹150,000

| **Item**                 | **Approved Limit** | **Available Limit** | **Outstanding** |
|--------------------------|--------------------|---------------------|-----------------|
| **MPO-001**              | **₹1,000,000**     | **₹353,000**        | **₹647,000**    |
| Application 1 (Pre-ship) | ₹500,000           | ₹0                  | ₹497,000        |
| Application 2 (Pre-ship) | ₹250,000           | ₹0                  | ₹150,000        |

**  
Step 6: Transition to Post-Shipment (App 1 -\> App 3)**

The goods from Application 1 have shipped. It\'s converted into a post-shipment facility under a Master Invoice (MI) with a higher limit.

- **Action:** Convert Application 1 to Post-Shipment.

- **New Master Invoice (MI) Number:** MI-001 (linked to MPO-001)

- **MI Approved Limit:** ₹1,200,000

- **Rollover from App 1:**

<!-- -->

- Principal: ₹497,000 (reflecting credit note)

<!-- -->

- Accrued Interest: ₹5,000

<!-- -->

- Charges: ₹1,000

<!-- -->

- **Total Rollover to App 3:** ₹503,000

<!-- -->

- **Calculation of MI Available Limit:**

<!-- -->

- MI Approved Limit - Total Outstanding Principal

<!-- -->

- ₹1,200,000 - (₹497,000 from App 1 + ₹150,000 from App 2)

<!-- -->

- **New MI Available Limit:** ₹553,000

| **Item**                  | **Approved Limit** | **Available Limit** | **Outstanding** |
|---------------------------|--------------------|---------------------|-----------------|
| **MI-001**                | **₹1,200,000**     | **₹553,000**        | **₹647,000**    |
| Application 2 (Pre-ship)  | ₹250,000           | ₹0                  | ₹150,000        |
| Application 3 (Post-ship) | \-                 | \-                  | ₹503,000        |

**  
Step 7: Additional Drawdown in Post-Shipment (Application 3)**

The client uses the increased limit to take additional capital.

- **Action:** Withdraw additional funds via Application 3.

- **Requested Amount:** ₹200,000

- **New MI Available Limit:** ₹553,000 - ₹200,000 = ₹353,000

- **Application 3 New Outstanding:** ₹503,000 (Rollover) + ₹200,000 (New) = ₹703,000

- **Total Outstanding Principal:** ₹497,000 (App 1 part) + ₹150,000 (App 2) + ₹200,000 (New) = ₹847,000

| **Item**                  | **Approved Limit** | **Available Limit** | **Outstanding** |
|---------------------------|--------------------|---------------------|-----------------|
| **MI-001**                | **₹1,200,000**     | **₹353,000**        | **₹847,000**    |
| Application 2 (Pre-ship)  | ₹250,000           | ₹0                  | ₹150,000        |
| Application 3 (Post-ship) | ₹697,000           | ₹0                  | ₹703,000        |

**  
Step 8: Full Settlement of Application 2**

The client settles the remaining balance of Application 2.

- **Action:** Fully settle Application 2.

- **Settlement Amount:** ₹150,000 (Principal) + ₹2,000 (Assumed Charges/Interest)

- **New MI Available Limit:** ₹353,000 (Previous Limit) + ₹150,000 (Repayment) = ₹503,000

| **Item**                  | **Approved Limit** | **Available Limit** | **Outstanding** |
|---------------------------|--------------------|---------------------|-----------------|
| **MI-001**                | **₹1,200,000**     | **₹503,000**        | **₹697,000**    |
| Application 3 (Post-ship) | ₹697,000           | ₹0                  | ₹703,000        |

**  
Step 9: New Independent Application Under Master Invoice**

Days later, the client creates a new application, referencing the Master Invoice.

- **Action:** Create Application 4 (e.g., Inventory Discounting).

- **Requested Amount:** ₹300,000

- **New MI Available Limit:** ₹503,000 - ₹300,000 = ₹203,000

| **Item**                  | **Approved Limit** | **Available Limit** | **Outstanding** |
|---------------------------|--------------------|---------------------|-----------------|
| **MI-001**                | **₹1,200,000**     | **₹203,000**        | **₹997,000**    |
| Application 3 (Post-ship) | ₹697,000           | ₹0                  | ₹703,000        |
| Application 4 (Post-ship) | ₹300,000           | ₹0                  | ₹300,000        |

**Requirement 5.**  
**Oracle Handling of Transfer of Preshipment application to Post shipment for Principal, Interest and Charges**

This example details the corresponding Accounts Payable (AP) and Accounts Receivable (AR) entries in an Oracle system for the trade finance scenario described in the \"Trade Finance MPO Walkthrough\".

**Initial Setup:**

- **Borrower:** Client Corp (Oracle Party ID: 8001)

- **Counterparty (Supplier):** Supplier Inc (Oracle Party ID: 9002)

- **Our Company:** DPWFS

**Step 1 & 2: Party ID Creation**

Before any transaction, the relevant parties are created in the system.

- **Action:** An Oracle Party ID is created for the Borrower, \"Client Corp\".

<!-- -->

- **Party Name:** Client Corp

<!-- -->

- **Oracle Party ID:** 8001

<!-- -->

- **Action:** As part of the first Pre-shipment application (App-1), the counterparty is identified and created.

<!-- -->

- **Party Name:** Supplier Inc

<!-- -->

- **Oracle Party ID:** 9002

**Step 3: AP Creation for Disbursal**

For Application 1 (₹500,000), the funds are disbursed directly to the Borrower\'s supplier (\"Supplier Inc\"). An Accounts Payable is created against the party receiving the funds.

- **Action:** Create AP for App-1 disbursal.

- **Payable To:** Supplier Inc (Party ID: 9002)

- **Amount:** ₹500,000

**AP Ledger:**

| **Party**    | **Party ID** | **Type** | **Amount** | **Status** | **Invoice Ref** |
|--------------|--------------|----------|------------|------------|-----------------|
| Supplier Inc | 9002         | AP       | ₹500,000   | Open       | APP-1           |

**Step 4: AP Settlement via Payment API**

The payment is processed and sent to Supplier Inc. The payment reference is used to settle the open AP.

- **Action:** Settle AP for App-1 using Payment API.

- **Payment Reference:** PAY-REF-111

**AP Ledger:**

| **Party**    | **Party ID** | **Type** | **Amount** | **Status** | **Payment Ref** |
|--------------|--------------|----------|------------|------------|-----------------|
| Supplier Inc | 9002         | AP       | ₹500,000   | Closed     | PAY-REF-111     |

**Step 5: AR Creation for Principal**

Simultaneously with the disbursal, an Accounts Receivable is created against the Borrower (\"Client Corp\") for the principal amount, making them liable for the debt.

- **Action:** Create Principal AR for App-1.

- **Receivable From:** Client Corp (Party ID: 8001)

- **Amount:** ₹500,000

**AR Ledger (Client Corp - 8001):**

| **Type** | **Amount** | **Description** | **Status** | **Invoice Ref** |
|----------|------------|-----------------|------------|-----------------|
| AR       | ₹500,000   | Principal       | Open       | APP-1           |

*(Note: The ₹3,000 credit note from the previous example would be applied here, reducing this AR\'s open balance to ₹497,000.)*

**Step 6: Settlement & Interest AR Creation**

The Borrower makes a partial settlement of ₹102,000 for Application 2 (Principal ₹100,000 + Interest ₹2,000). An AR for the interest portion is created and then both are settled by the incoming receipt.

- **Action:** Process partial settlement for App-2.

- **Receipt Reference:** REC-REF-222

- **New AR Creation:** An Interest AR for ₹2,000 is created.

- **Settlement:** REC-REF-222 is applied to close the new Interest AR and reduce the Principal AR for App-2.

**AR Ledger (Client Corp - 8001) - Before Settlement:**

| **Type** | **Amount** | **Description** | **Status** | **Invoice Ref** |
|----------|------------|-----------------|------------|-----------------|
| AR       | ₹250,000   | Principal       | Open       | APP-2           |
| AR       | **₹2,000** | **Interest**    | **Open**   | **APP-2**       |

**AR Ledger (Client Corp - 8001) - After Settlement:**

| **Type** | **Amount** | **Description** | **Status** | **Invoice Ref** |
|----------|------------|-----------------|------------|-----------------|
| AR       | ₹150,000   | Principal       | Open       | APP-2           |
| AR       | ₹2,000     | Interest        | Closed     | APP-2           |

**Step 7: Monthly Interest Accrual (AR Creation)**

At month-end, ₹5,000 of interest has accrued on Application 1, but no settlement has occurred. A new AR is created for this interest, increasing the total receivable from the client.

- **Action:** Create month-end Interest AR for App-1.

**AR Ledger (Client Corp - 8001):**

| **Type** | **Amount** | **Description** | **Status** | **Invoice Ref** |
|----------|------------|-----------------|------------|-----------------|
| AR       | ₹497,000   | Principal       | Open       | APP-1           |
| AR       | **₹5,000** | **Interest**    | **Open**   | **APP-1**       |

**Step 8: Application Rollover to Post-Shipment**

App-1 is rolled over to App-3. The existing open ARs are not changed, but any *new* charges or interest will now use APP-3 as the invoice reference. Let\'s assume a rollover fee of ₹1,000 is applied.

- **Action:** Rollover App-1 to App-3 and add a new charge.

**AR Ledger (Client Corp - 8001):**

| **Type** | **Amount** | **Description**  | **Status** | **Invoice Ref** |
|----------|------------|------------------|------------|-----------------|
| AR       | ₹497,000   | Principal        | Open       | APP-1           |
| AR       | ₹5,000     | Interest         | Open       | APP-1           |
| AR       | **₹1,000** | **Rollover Fee** | **Open**   | **APP-3**       |

**Step 9: Final Settlement of Post-Shipment Application**

The borrower fully settles the rolled-over application (App-3). The payment is applied sequentially, clearing the Pre-shipment (APP-1) ARs first, as per operational rules.

- **Action:** Settle all open ARs related to the rolled-over application.

- **Settlement Order:** 1. Principal (APP-1), 2. Interest (APP-1), 3. Charges (APP-3)

**AR Ledger (Client Corp - 8001) - Final State:**

| **Type** | **Amount** | **Description** | **Status** | **Invoice Ref** |
|----------|------------|-----------------|------------|-----------------|
| AR       | ₹497,000   | Principal       | Closed     | APP-1           |
| AR       | ₹5,000     | Interest        | Closed     | APP-1           |
| AR       | ₹1,000     | Rollover Fee    | Closed     | APP-3           |

You can reference the visual process below  
  
![](media/image4.png){width="6.396527777777778in" height="9.466666666666667in"}**  
  
  
  
  
  
  
  
Requirement 5.  
****Changes on Arranging -\> Applications Screen**

**5.1 Master Instrument Column Enhancement**

**Requirement**

Add a new column for client applications under **Preshipment Financing** to display master purchase or sale invoice numbers.

**Implementation Details**

- **Column Name**: Master Instrument Number

- **Data Source**: Master purchase order or sale invoice number

- **Info Icon Tooltip**: \"Master Instrument number can be either a purchase order or sale invoice number\"

- **Functionality**:

  - Filter capability based on instrument number

  - Sort capability based on instrument number

**  
5.2 Convert to Post Shipment Workflow**

**Requirement**

Create a new workflow that enables conversion from preshipment to post-shipment financing. Please reference the Pre to Post Shipment definition if you have any doubt on what happens to the cloned application for Carried Principal, Interest and Charges related activities.

**Implementation Details**

- **Process**: Copy application details from the original preshipment application to create a new post-shipment application

- **Data Transfer**: All relevant application details should be duplicated in the new application

- **Workflow Trigger**: \"Convert to Post Shipment\" action button

**  
5.3 Save as Draft Functionality**

**Requirement**

Enable draft saving capability for cloned applications with overdue charge handling.

**Implementation Details**

- **Draft Saving**: Clients can save and return to modify cloned application details

- **Overdue Charge Logic**:

  - **Condition**: Application is in draft status AND has passed conversion date AND is not in application operations or credit queue

  - **Action**: Automatically add overdue charges

- **User Experience**: Seamless draft management across application lifecycle

**5.4.1 Conversion Date Extension Workflow**

**Requirement**

Implement controlled conversion date extension process with proper approval hierarchy.

**Access Control**

- **Requestors**: Clients and Operations team members

- **Restriction**: Both parties can initiate extension requests

**Approval Workflow**

1.  **Client/Operations** → Request submission

2.  **Operations Maker** → Initial review and processing

3.  **Operations Checker** → Secondary validation

4.  **Credit Analyst** → Final approval

**Technical Implementation**

- **Reuse**: Leverage existing \"Application Due Date Extension\" workflow

- **Integration**: Adapt current workflow structure for conversion date extensions

- **Consistency**: Maintain same approval patterns and user interface

**Requirement 6.**  
**PO Application Extension/Conversion Reminder System**

Automated daily scheduler to remind stakeholders about Purchase Order applications nearing conversion deadlines so the Internal Admins can take necessary decisions.

**  
Functional Requirements**

**Scheduler Configuration**

- **Frequency**: Daily execution on business days (Monday-Friday)

- **Timing**: Morning hours

- **Scope**: Purchase Order applications requiring attention

**Application Selection Criteria**

The system must identify applications meeting ALL of the following conditions:

- **Product Category**: \"Purchase Order - Payment to Buyer\" OR \"Purchase Order - Payment to Seller\"

- **Timeline**: Conversion date within 5 calendar days

- **Workflow Status**: No active Extension or Conversion to Postship workflows initiated

- **Reminder Status**: No prior reminder sent (avoid duplicates)

**Processing Workflow**

1.  **Tagging**: Apply \"CandidateToRemindForExtension\" tag to qualifying applications

2.  **Notification**: Send reminder email using predefined template to:

    - Sales Manager (tagged to Credit Facility)

    - Credit Analyst (Credit Facility author)

    - Operations team (all members)

3.  **Status Update**: Mark application as \"reminder sent\" to prevent duplicate notifications

4.  **Email Body**:

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 82%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Reminder Email for the Upcoming Application</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Sales Manager (CF), CA (CF Author) and Operations Team (Group Email)</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td></td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Upcoming Expiry</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
<br />
${CF Client Name}’s Preshipment Application ${Application ID} is about to expire on ${Conversion Date in dd-mmm-yy}.<br />
<br />
Please request the client to settle/extend or convert the application.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

**Requirement 7.**  
**AECB Handling**

Our Credit Bureau (AECB) must be informed whenever there is a payment delay from the client. Payment is considered delayed when both conditions are met:

1.  Conversion date for the Preshipment Financing application has passed the current date

2.  No active workflow exists for either:

    - Preshipment Application Conversion Date Extension

    - Pre-to-Post Shipment Conversion

**Example:**  
If a Preshipment Financing application has a conversion date of January 15, 2025, and today is January 20, 2025, with no active extension or conversion workflows, this qualifies as a delayed payment requiring AECB reporting.

**  
DPD Reporting Triggers:**

Since AECB delay payment reporting must occur in real-time upon acceptance of default, DPD must be triggered through:

**  
(a) Daily Cron Job** Check for applications where:

- Conversion date has passed the current date, AND

- No active extension or conversion workflow is present

**  
(b) Workflow Terminal Points**

**B1. Facility Extension Rejections:**

- B1.1: When Operations Checker rejects the extension request (instead of approving or returning to Maker)

- B1.2: When Credit Analyst rejects the extension request (instead of approving or returning to Operations Checker)

**B2. Facility Conversion Rejections:**

- B2.1: When Operations Checker rejects the facility conversion from PreShipment to PostShipment

- B2.2: When Credit Analyst rejects the facility conversion from PreShipment to PostShipment

**  
Processing Logic:**  
For all terminal point scenarios (B1 and B2), the system must:

1.  Verify that the conversion date has passed the current date

2.  Confirm no active extension or conversion workflow exists

3.  If both conditions are met, proceed with reporting the application as DPD to AECB

**  
Example Scenario:**  
Application ABC123 has conversion date January 10, 2025. On January 15, 2025, Credit Analyst rejects an extension request. Since the conversion date (Jan 10) has passed and no active workflows remain, the system immediately reports this application as DPD to AECB.  
  
**Very Important Note:**  
The DPW reporting should not go if the Ops Checker rejects the application if there is some time before the conversion date. The DPD should not be reported if the Operations Checker has sent the case back to the Maker. 

**Generic Requirement:**  
**Email Notifications**  
  
1. When the conversion workflow was rejected by the Operations Checker and CA and Sales guys should be aware about the DPD marking  
2. When Extension is done successfully  
3. When Application is converted successfully  
4. When the Conversion request has been rejected by the Operations Maker/**Checker**/CA  
6.

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Pending Maker Review</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Operations User Group</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td></td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Pending Maker Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
<br />
${CF Client Name}’s Preshipment Application ${Application ID} has been submitted for review.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Pending Checker Review</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Operations User Group</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td></td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Pending Checker Review</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
<br />
${CF Client Name}’s Preshipment Application ${Application ID} has been submitted for review.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Pending Client Resubmission</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Client</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operation Maker and Checker (if available at Lifecycle stage)</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>DP World Finance | Application ID | Resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear ${Client First Name},  <br />
Your request to convert the application${Application ID} requires resubmission.<br />
<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Rejected</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Client</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operation Maker and Checker (if available at Lifecycle stage)</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>DP World Finance | ${Application ID} | Conversion Request Rejected</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear ${Client First Name},  <br />
<br />
Your request to convert the application${Application ID} has been rejected.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Pending Maker Resubmission</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Opeartions Maker who worked on this case</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Checker who rejected this case</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Resubmission Requested</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
<br />
${CF Client Name}’s Preshipment Application ${Application ID} requires rework before resubmission.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 18%" />
<col style="width: 81%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Conversion Request Approved</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Client</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Operations Maker and Checker</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>DP World Finance | ${Application ID} | Converted Successfully</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear ${Client First Name},  <br />
<br />
Your request to convert the application${Application ID} has been processed successfully.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

Change Request 1:  
[Type: Change Request \| Add BCO Terms Acceptance Step When Ops Maker Edits Application Tranche Details (Pre & Post Shipment)](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/268968)

Background:  
In Trade Financing products, if a Drawdown Application's disbursement amount or dates are modified by the Operations Maker, these are considered Material Changes. For other products, we already enforce client approval by introducing a workflow stage BCO_Terms_Accepted.  
However, this safeguard is missing for Pre-Shipment and Post-Shipment products, allowing Ops Makers to change terms without Client consent.

Problem Statement:  
Ops Makers can currently modify Application Tranche details in Pre and Post Shipment products without triggering mandatory Client approval.

Affected Modules:

- Application Workflow Engine

- Pre-Shipment & Post-Shipment Application Screens

- Ops Maker UI

Requirement:  
Introduce a mandatory Client approval step whenever Ops Maker edits key Application terms.

Change Request:

1.  Detect any modification by the Operations Maker to the Application Tranche details originally submitted by the Client.

2.  When a modification is detected:

    a.  Transition the workflow to a new stage: BCO Terms Acceptance Pending.

    b.  Switch the active user/assignee to Client for approval.

3.  After the Client approves, move the Application to the Checker queue for standard processing.

Acceptance Criteria

- System correctly identifies changes in disbursement amount or dates made by Ops Maker.

- Workflow automatically moves to BCO Terms Acceptance Pending on detection.

- Client receives the Application for approval.

- Post-approval, the Application routes to the Checker queue.

- No bypass of Client approval should be possible under modified terms.

Change Request,  
Send Notification to Client about upcoming expiry (TBD with Priyanka on 20th )

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 82%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Reminder Email for the Upcoming Application</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Sales Manager (CF), CA (CF Author) and Operations Team (Group Email)</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td></td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Upcoming Expiry</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear Team,  <br />
<br />
${CF Client Name}’s Preshipment Application ${Application ID} is about to expire on ${Conversion Date in dd-mmm-yy}.<br />
<br />
Please request the client to settle/extend or convert the application.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

**Change Request Based on Operations Feedback on 14^th^ Jan 2026:  
**  
Change Request: 284993  
For Both Pre and Post Shipment, the Noun wise checklist under Transaction Screening.  
(Check with Priyanka)  
  
Change Request: 285004  
Add notification to User before Preshipment application is Due

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 82%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Status</strong> </th>
<th>Reminder Email for the Upcoming Application</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>RECIPIENT(S)</strong> </td>
<td>Client (Registered User)</td>
</tr>
<tr class="even">
<td>CC (IF ANY) </td>
<td>Sales Manager (CF), CA (CF Author) and Operations Team (Group Email)</td>
</tr>
<tr class="odd">
<td><strong>SUBJECT</strong> </td>
<td>${CF Client Name}’s Preshipment Application ${Application ID} | Upcoming Expiry</td>
</tr>
<tr class="even">
<td><strong>BODY</strong> </td>
<td>Dear User,  <br />
<br />
Your Preshipment Application ${Application ID} is about to expire on ${Conversion Date in dd-mmm-yy}.<br />
<br />
Kindly settle/extend or convert the application to Post Shipment.<br />
<br />
You can review the request here &lt;link to APP-ID&gt; <br />
 <br />
Regards, </td>
</tr>
</tbody>
</table>

**Change Request:** 284985  
**Change Product name and add new Document support**  
  
User Story:

Operations Team mentioned that clients often provide Sales Contract, Performa Invoice and Purchase Order interchangeably. At Present, we have envisioned Preshipment Financing only for Purchase Order.  
  
While the core dynamics remain same, we should Rename the Product as Preshipment Financing and then when a user selects the Dropdown of documents then we should introduce:  
Three options: \"Purchase Order (PO)\", \"Performa Invoice (PI)\", and \"Sales Contract (SC)\".  
  
Secondly, we should rename PO Financing Product to Pre-shipment Financing.

**Change Request:** 284988  
**Calculation logic fix on Post Shipment application**  
User Story:

As a Client User, I want the funding calculations to accurately reflect the agreed credit terms and for due dates to be consistent across all tabs, so that I have a clear and accurate understanding of my available funding and repayment timeline.

Acceptance Criteria:

Funding Calculation Fix:

Given the Master PO Funding limit is set (e.g., 90% of PO value),

When the system calculates the \"Receivable Amount\" in Point \#4,

Then the system must NOT re-apply the 90% factor a second time.

Validation: Verify that (PO Value \* 90%) = Final Funding Amount (excluding fees), rather than (PO Value \* 90% \* 90%).

Date Synchronization:

Given a \"PO Conversion Due Date\" or \"Settlement Date\" is established,

When the user navigates to Tab 3 and Tab 4,

Then the \"Due Date\" field in these tabs must display the exact same date as the \"PO Conversion Due Date.\"

Validation: Check that no offsets or timezone errors are shifting the date by +/- 1 day.
