| Module         | Ability to Close Credit Facility |
|----------------|----------------------------------|
| Prepared By    | Abhishek S Bhilware              |
| Created on     | 03-Apr-2025                      |
| Reviewed By    | TBD                              |
| Wiki Page Link | TBD                              |

| **Document**    | **Owner**     | **Link**                                                                        |
|-----------------|---------------|---------------------------------------------------------------------------------|
| **EPIC 212120** | **Abhinav S** | [**Link**](https://dpwhotfsonline.visualstudio.com/DTLP/_workitems/edit/212120) |

Background:

Trade Finance credit team marks certain credit facility as exited from time to time. Such Exited clients do not engage with us in any shape or form; they do not raise any Credit applications or renew their credit facility. While these clients can still access the arranging platform and engage with other lenders, DPWFS seizes ties.  
  
Once a client decides to close his/her credit facility with us, we issue an Exit letter (format attached just for reference). This exit letter acts as an NOC (No-objection certificate) and FYI to the client stating that there is noting due.  
  
Problem:  
While DPWFS decides to seize business relation with the client, the platform continues to send them notification related to their Credit Facility like:

1.  Upcoming Facility renewal email. (Internal admins and External)

2.  Expired Facility notification (Internal admins and External)

Requirement:

1.  Going forward, we need to introduce a new status within Credit Facility called "Facility Closed".

2.  Facilities tagged as Closed will be considered Closed and mark the end of the Credit Facility lifecycle. Same Credit Facility can not be revived by either Credit or Operations.

3.  No Credit facility related activity (Enhancement/Modification) will be supported if a facility has expired.

4.  No new Application can be created (by client or Operations Maker on Arranging) if the Facility has expired.

5.  Status of the CF on the Arranging will be "Closed".

6.  The status "Facility Closed" should not be confused with "Facility Inactivated".

7.  Access point: CF closure can be initiated by visiting the "Request Facility section". We will create a new section called "  
    Pending Facility Closure". All request related to Facility closure gets nested here.

8.  Workflow:

8.1 Participant: Sales, Credit Analyst, HOC and OM1 and OM2.

8.2 Direction:  
8.2.0 User with Role of Sales will initiate the request to close the company by updating the Status of the company to "Facility Closed".

8.2.1 Credit Analyst will review the request and approve it.  
8.2.2 HOC will approve or reject the update request.

8.2.3 Once facility closure has been approved, we will show it in Operations Maker queue. Maker will generate the exit letter and then upload it in the comments section of the facility.

8.2.4 Checker will verify the closure letter details and will then approve it.

8.2.5 Once approved by Checker, the Facility will move to Facility Closed status. Since the workflow is completed, the CF application will start rendering on the Approved Facility section with the Status as Closed.

9\. Validations:

9.1 No active application: The CF should not have any active applications that are unpaid.

9.2 No existing workflow: The CF should not be either in Renewal/Update or CP modification (Sector/Limit/Pricing etc.)

9.3 If a facility closure workflow has been initiated, then do not allow any other workflow for the same facility to be initiated.

10\. Alerts;  
10.1 Notify the user that the facility has unpaid applications and can not be closed when he/she tries to update the status as closed.  
Error message: \"Facility has unsettled applications, please close them to initiate closure".  
  
10.2 Notify the credit analyst that the facility closure has been initiated and he/she can not start any other workflow. Error message: \"Facility closure underway, please close the Closure workflow to continue.\".  
  
10.3 Notify the credit analyst that the credit facility is in another Renewal/Modification workflow and can not be closed until other workflows are closed. Error message: "Facility is under update, please close other workflow to initiate closure"

11\. Email notifications using our internal email scaffold:  
11.1 Email to HOC when CA initiates closure of Credit Facility:  
Recipient : Head of Credit  
Subject: \${Company Legal Name }\'s Facility Closure request  
Body: Dear HOC,  
  
Please approve the Facility closure for \${Company Legal Name}.  
  
\${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.2 Email to CA when HOC approves closure of Credit Facility:  
Recipient : Credit Analyst who Authored the closure request  
Subject: \${Company Legal Name }\'s Facility Closure request approved by HOC  
Body: Dear Team,  
The Facility closure for \${Company Legal Name} has been approved by the Credit head.  
  
You can check the current status here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.3 Email to CA when HOC Rejected closure of Credit Facility:  
Recipient : Credit Analyst who Authored the closure request  
Subject: \${Company Legal Name }\'s Facility Closure request rejected by HOC  
Body: Dear Team,  
The Facility closure for \${Company Legal Name} has been rejected by the Credit head.  
  
You can check the current status here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.4 Email to OP Maker(s) when HOC Approved closure of Credit Facility:  
Recipient : Operations group email where user role is Maker  
Subject: \${Company Legal Name }\'s Facility Closure request  
Body: Dear Team,  
The Facility closure for \${Company Legal Name} has been received.  
  
Please generate the closure letter and submit it for review.  
  
You can access the request here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.5 Email to OP Checker when OP Maker submits closure of Credit Facility:  
Recipient : Operations group email where user role is checker  
Subject: \${Company Legal Name }\'s Facility Closure request  
Body: Dear Team,  
The Facility closure for \${Company Legal Name} has been received.  
  
Please review the closure letter, send it to the client and approve this request to close the facility.  
  
You can access the request here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.6 Email to CA (Author), OP Maker (Author) when OP Checker approves the closure request  
Recipient : CA (Author), OP Maker (Author)  
Subject: \${Company Legal Name }\'s Facility has been Closed  
Body: Dear Operations Team,  
The Facility closure for \${Company Legal Name} has been completed.  
  
You can access the request here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,  
  
11.7 Email to CA (Author), OP Maker (Author) when OP Checker rejects the closure request  
Recipient : CA (Author), OP Maker (Author)  
Subject: \${Company Legal Name }\'s Facility rejected by Operations  
Body: Dear Operations Team,  
The Facility closure for \${Company Legal Name} has been rejected by Operations.  
  
You can access the request here: \${Link to Credit Facility Request Facility section with view port on the requested closure section}.  
  
Regards,
