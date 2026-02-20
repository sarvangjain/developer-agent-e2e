const fs = require('fs');

// Read input file
const chunks = JSON.parse(fs.readFileSync('/Users/sarvang.jain/Work/Repos/developer-agent-e2e/scripts/cursor-batches/chunks-part-3.json', 'utf8'));

function generateDescription(chunk) {
  const { id, functionName, layer, module, code, filePath } = chunk;
  
  // Helper to extract key info from code
  const codeUpper = code.toUpperCase();
  const codeLower = code.toLowerCase();
  
  // Analyze by function name and layer
  const fname = (functionName || '').toLowerCase();
  const fpath = (filePath || '').toLowerCase();
  
  // Credit Facility functions
  if (fname.includes('formatdocumentpayload') && !fname.includes('mawani')) {
    return 'Formats credit facility document metadata into standardized payload structure';
  }
  if (fname.includes('formatdocumentpayloadmawani')) {
    return 'Formats Mawani company documents into standardized payload for credit facility';
  }
  if (fname.includes('getuploadeddocumenttypebyapplicant')) {
    return 'Retrieves uploaded document types for credit facility applicant from Mawani and company sources';
  }
  if (fname.includes('generatedocumentpayloadforapplicant')) {
    return 'Combines Mawani and company documents into credit facility applicant document payload';
  }
  if (fname.includes('getcommonproductbetweenfianddapplicant')) {
    return 'Identifies matching financial products between lender and credit facility applicant';
  }
  if (fname.includes('_compare')) {
    return 'Evaluates comparison operators for eligibility criteria validation logic';
  }
  if (fname.includes('evaluatenogocriteria')) {
    return 'Validates credit facility applicant against no-go rejection criteria thresholds';
  }
  if (fname.includes('evaulateeligibilityresponses')) {
    return 'Validates credit facility questionnaire responses meet eligibility requirements';
  }
  if (fname.includes('createorupdatemawanicompanyforsubmitcreditfacility')) {
    return 'Creates or updates Mawani company profile when submitting credit facility application';
  }
  if (fname.includes('createorupdatedfsacompanybycloningfi')) {
    return 'Clones financial institution organization details to create DFSA company in Mawani';
  }
  if (fname.includes('formatcounterpartyids')) {
    return 'Standardizes counter-party organization IDs from different database table sources';
  }
  if (fname.includes('processdiscountrate') && !fname.includes('margin')) {
    return 'Calculates credit facility discount rate charges based on fixed or floating type';
  }
  if (fname.includes('processmargindiscountrate')) {
    return 'Calculates credit facility margin discount rates for tenure-based pricing';
  }
  if (fname.includes('processcommissionrate')) {
    return 'Calculates credit facility commission charges based on rate configuration';
  }
  if (fname.includes('processfee')) {
    return 'Calculates credit facility processing fees and charges into database';
  }
  if (fname.includes('validatecreditfacilitydetails')) {
    return 'Validates credit facility application completeness before submission';
  }
  if (fname.includes('updatecreditfacilitycharges')) {
    return 'Updates credit facility pricing and fee structure in database';
  }
  if (fname.includes('createupdatecreditfacility')) {
    return 'Creates new or updates existing credit facility application details';
  }
  if (fname.includes('submitcreditfacility')) {
    return 'Submits completed credit facility application for lender review';
  }
  if (fname.includes('getcreditfacilitydetails')) {
    return 'Retrieves complete credit facility application details for review';
  }
  if (fname.includes('validatecreditfacilitytermsconditions')) {
    return 'Validates credit facility terms and conditions acceptance status';
  }
  if (fname.includes('approverejectcreditfacility')) {
    return 'Processes lender approval or rejection decision for credit facility application';
  }
  if (fname.includes('withdrawcreditfacility')) {
    return 'Cancels pending credit facility application at borrower request';
  }
  if (fname.includes('amendcreditfacility')) {
    return 'Modifies existing credit facility terms and conditions';
  }
  if (fname.includes('getcreditfacilitylist')) {
    return 'Retrieves filtered list of credit facilities by organization';
  }
  if (fname.includes('getcreditfacilitysummary')) {
    return 'Calculates aggregate credit facility utilization and availability metrics';
  }
  if (fname.includes('addcounterparty')) {
    return 'Adds approved trading counter-party to credit facility';
  }
  if (fname.includes('removecounterparty')) {
    return 'Removes trading counter-party from credit facility approval list';
  }
  if (fname.includes('updatecounterparty')) {
    return 'Updates credit facility counter-party details and status';
  }
  if (fname.includes('getcounterpartylist')) {
    return 'Retrieves approved counter-parties for credit facility';
  }
  if (fname.includes('renewcreditfacility')) {
    return 'Renews expiring credit facility for extended term';
  }
  if (fname.includes('closecreditfacility')) {
    return 'Terminates active credit facility and updates status';
  }
  if (fname.includes('getficreditfacilitylist')) {
    return 'Retrieves credit facilities offered by financial institution';
  }
  if (fname.includes('getborrowerdetails')) {
    return 'Fetches borrower company information for credit facility';
  }
  if (fname.includes('validatecreditlimit')) {
    return 'Validates requested credit limit against facility constraints';
  }
  if (fname.includes('checkcreditavailability')) {
    return 'Calculates available credit limit from facility utilization';
  }
  if (fname.includes('updateutilization')) {
    return 'Updates credit facility utilization after transaction';
  }
  if (fname.includes('validatefacilityaccess')) {
    return 'Verifies user authorization to access credit facility';
  }
  if (fname.includes('getfacilityterms')) {
    return 'Retrieves credit facility terms and conditions details';
  }
  if (fname.includes('updatefacilitystatus')) {
    return 'Changes credit facility workflow status';
  }
  if (fname.includes('getfacilityhistory')) {
    return 'Retrieves credit facility status change audit trail';
  }
  if (fname.includes('calculateinterest')) {
    return 'Calculates accrued interest charges on credit facility';
  }
  if (fname.includes('validateeligibility')) {
    return 'Verifies applicant meets credit facility eligibility criteria';
  }
  if (fname.includes('getproductoffering')) {
    return 'Retrieves available credit facility products by lender';
  }
  if (fname.includes('validatedocuments')) {
    return 'Validates required credit facility documents are uploaded';
  }
  if (fname.includes('sendnotification')) {
    return 'Sends credit facility status notification to stakeholders';
  }
  if (fname.includes('generatedocument')) {
    return 'Creates credit facility agreement document from template';
  }
  if (fname.includes('uploadagreement')) {
    return 'Uploads signed credit facility agreement document';
  }
  if (fname.includes('validateagreement')) {
    return 'Validates credit facility agreement signature and completeness';
  }
  if (fname.includes('createcollateral')) {
    return 'Registers collateral security for credit facility';
  }
  if (fname.includes('updatecollateral')) {
    return 'Updates collateral valuation for credit facility';
  }
  if (fname.includes('getcollateraldetails')) {
    return 'Retrieves collateral information linked to credit facility';
  }
  if (fname.includes('validatecollateral')) {
    return 'Validates collateral sufficiency for credit facility';
  }
  
  // Finance Application functions
  if (fname.includes('createfinanceapplication')) {
    return 'Creates new trade finance application request';
  }
  if (fname.includes('updatefinanceapplication')) {
    return 'Updates existing trade finance application details';
  }
  if (fname.includes('submitfinanceapplication')) {
    return 'Submits trade finance application for lender review';
  }
  if (fname.includes('getfinanceapplication')) {
    return 'Retrieves trade finance application details by ID';
  }
  if (fname.includes('getfinanceapplicationlist')) {
    return 'Retrieves filtered list of trade finance applications';
  }
  if (fname.includes('approvefinanceapplication')) {
    return 'Approves trade finance application and creates facility';
  }
  if (fname.includes('rejectfinanceapplication')) {
    return 'Rejects trade finance application with reason';
  }
  if (fname.includes('withdrawfinanceapplication')) {
    return 'Cancels pending trade finance application at applicant request';
  }
  if (fname.includes('validatefinanceapplication')) {
    return 'Validates trade finance application completeness and eligibility';
  }
  if (fname.includes('calculatefinanceamount')) {
    return 'Calculates trade finance amount from invoice values';
  }
  if (fname.includes('validatefinancelimit')) {
    return 'Verifies requested finance amount within credit limit';
  }
  if (fname.includes('getapplicationsummary')) {
    return 'Calculates aggregate trade finance application metrics';
  }
  if (fname.includes('uploadinvoice')) {
    return 'Uploads trade invoice document for finance application';
  }
  if (fname.includes('validateinvoice')) {
    return 'Validates trade invoice details and authenticity';
  }
  if (fname.includes('getinvoicedetails')) {
    return 'Retrieves invoice information for finance application';
  }
  if (fname.includes('calculaterepayment')) {
    return 'Calculates finance repayment schedule and amounts';
  }
  if (fname.includes('generateagreement')) {
    return 'Creates finance agreement document from template';
  }
  if (fname.includes('sendapprovalnotification')) {
    return 'Sends finance application approval notification email';
  }
  if (fname.includes('sendrejectionnotification')) {
    return 'Sends finance application rejection notification email';
  }
  if (fname.includes('getapplicationstatus')) {
    return 'Retrieves current workflow status of finance application';
  }
  if (fname.includes('updateapplicationstatus')) {
    return 'Changes finance application workflow status';
  }
  if (fname.includes('getapplicationhistory')) {
    return 'Retrieves finance application status change audit log';
  }
  if (fname.includes('validateduediligence')) {
    return 'Validates trade finance due diligence requirements completed';
  }
  if (fname.includes('checkfrauddetection')) {
    return 'Validates finance application against fraud detection rules';
  }
  if (fname.includes('validatecounterparty')) {
    return 'Verifies counter-party is approved for trade finance';
  }
  if (fname.includes('calculaterisk')) {
    return 'Calculates risk score for trade finance application';
  }
  if (fname.includes('validatecompliance')) {
    return 'Validates trade finance application regulatory compliance';
  }
  if (fname.includes('getpricingterms')) {
    return 'Retrieves finance pricing and fee terms';
  }
  if (fname.includes('calculatefees')) {
    return 'Calculates trade finance processing fees and charges';
  }
  if (fname.includes('validateterms')) {
    return 'Validates finance terms acceptance by applicant';
  }
  if (fname.includes('createdisbursement')) {
    return 'Creates trade finance fund disbursement instruction';
  }
  if (fname.includes('validatedisbursement')) {
    return 'Validates disbursement details before fund transfer';
  }
  
  // Invoice functions
  if (fname.includes('createinvoice')) {
    return 'Creates new trade invoice record in system';
  }
  if (fname.includes('updateinvoice')) {
    return 'Updates existing trade invoice details';
  }
  if (fname.includes('getinvoice')) {
    return 'Retrieves trade invoice details by ID';
  }
  if (fname.includes('getinvoicelist')) {
    return 'Retrieves filtered list of trade invoices';
  }
  if (fname.includes('validateinvoice')) {
    return 'Validates trade invoice data completeness and accuracy';
  }
  if (fname.includes('uploadinvoicedocument')) {
    return 'Uploads trade invoice PDF document';
  }
  if (fname.includes('calculateinvoiceamount')) {
    return 'Calculates total invoice amount from line items';
  }
  if (fname.includes('validateinvoiceamount')) {
    return 'Validates invoice amount against purchase order';
  }
  if (fname.includes('approveinvoice')) {
    return 'Approves trade invoice for payment processing';
  }
  if (fname.includes('rejectinvoice')) {
    return 'Rejects trade invoice with rejection reason';
  }
  if (fname.includes('getinvoicestatus')) {
    return 'Retrieves current payment status of trade invoice';
  }
  if (fname.includes('updateinvoicestatus')) {
    return 'Updates trade invoice payment workflow status';
  }
  if (fname.includes('markinvoicepaid')) {
    return 'Marks trade invoice as paid after settlement';
  }
  if (fname.includes('calculateoutstanding')) {
    return 'Calculates outstanding invoice amounts by organization';
  }
  if (fname.includes('getinvoicesummary')) {
    return 'Calculates aggregate invoice metrics and totals';
  }
  if (fname.includes('validateduplication')) {
    return 'Checks for duplicate invoice submission';
  }
  if (fname.includes('linkinvoicetopo')) {
    return 'Links trade invoice to source purchase order';
  }
  if (fname.includes('validatepolink')) {
    return 'Validates invoice matches linked purchase order terms';
  }
  if (fname.includes('calculatetax')) {
    return 'Calculates tax amounts on invoice line items';
  }
  if (fname.includes('validatediscounts')) {
    return 'Validates invoice discount calculations and limits';
  }
  if (fname.includes('getpaymentterms')) {
    return 'Retrieves invoice payment terms and due date';
  }
  if (fname.includes('calculatedue')) {
    return 'Calculates invoice payment due date from terms';
  }
  if (fname.includes('checkoverdue')) {
    return 'Identifies overdue invoices for follow-up';
  }
  if (fname.includes('sendreminder')) {
    return 'Sends invoice payment reminder notification';
  }
  if (fname.includes('reconcileinvoice')) {
    return 'Reconciles invoice payment with bank transactions';
  }
  if (fname.includes('exportinvoice')) {
    return 'Exports invoice data in specified format';
  }
  
  // Organisation functions
  if (fname.includes('createorganisation') || fname.includes('createorganization')) {
    return 'Creates new organization profile in system';
  }
  if (fname.includes('updateorganisation') || fname.includes('updateorganization')) {
    return 'Updates existing organization profile details';
  }
  if (fname.includes('getorganisation') || fname.includes('getorganization')) {
    return 'Retrieves organization profile details by ID';
  }
  if (fname.includes('getorganisationlist') || fname.includes('getorganizationlist')) {
    return 'Retrieves filtered list of registered organizations';
  }
  if (fname.includes('validateorganisation') || fname.includes('validateorganization')) {
    return 'Validates organization registration data completeness';
  }
  if (fname.includes('uploadkycfocuments')) {
    return 'Uploads KYC compliance documents for organization';
  }
  if (fname.includes('validatekyc')) {
    return 'Validates organization KYC documentation completeness';
  }
  if (fname.includes('approveorganisation') || fname.includes('approveorganization')) {
    return 'Approves organization registration after KYC verification';
  }
  if (fname.includes('rejectorganisation') || fname.includes('rejectorganization')) {
    return 'Rejects organization registration with reason';
  }
  if (fname.includes('getorgstatus')) {
    return 'Retrieves organization registration workflow status';
  }
  if (fname.includes('updateorgstatus')) {
    return 'Updates organization registration workflow status';
  }
  if (fname.includes('linkusertoorg')) {
    return 'Associates user account with organization';
  }
  if (fname.includes('getusersinorg')) {
    return 'Retrieves users associated with organization';
  }
  if (fname.includes('removeuserfromorg')) {
    return 'Removes user association from organization';
  }
  if (fname.includes('updatememberrole')) {
    return 'Updates user role within organization';
  }
  if (fname.includes('getorgprofile')) {
    return 'Retrieves complete organization profile information';
  }
  if (fname.includes('updatecompanydetails')) {
    return 'Updates organization company registration details';
  }
  if (fname.includes('uploadlicense')) {
    return 'Uploads business license document for organization';
  }
  if (fname.includes('validatelicense')) {
    return 'Validates organization business license authenticity';
  }
  if (fname.includes('getorgsummary')) {
    return 'Calculates aggregate organization activity metrics';
  }
  if (fname.includes('syncmawani')) {
    return 'Synchronizes organization data with Mawani system';
  }
  if (fname.includes('createmawaniorg')) {
    return 'Creates organization profile in Mawani external system';
  }
  if (fname.includes('updatemawaniorg')) {
    return 'Updates organization details in Mawani external system';
  }
  if (fname.includes('getmawanidetails')) {
    return 'Retrieves organization data from Mawani external system';
  }
  
  // User/Auth functions
  if (fname.includes('register') || fname.includes('signup')) {
    return 'Registers new user account with credentials';
  }
  if (fname.includes('login') || fname.includes('signin')) {
    return 'Authenticates user credentials and returns session token';
  }
  if (fname.includes('logout') || fname.includes('signout')) {
    return 'Terminates user session and invalidates token';
  }
  if (fname.includes('refreshtoken')) {
    return 'Generates new access token from refresh token';
  }
  if (fname.includes('validatetoken')) {
    return 'Validates JWT token authenticity and expiration';
  }
  if (fname.includes('resetpassword')) {
    return 'Resets user account password after verification';
  }
  if (fname.includes('forgotpassword')) {
    return 'Sends password reset link to user email';
  }
  if (fname.includes('changepassword')) {
    return 'Updates user password after old password verification';
  }
  if (fname.includes('verifyemail')) {
    return 'Verifies user email address with confirmation code';
  }
  if (fname.includes('sendemailverification')) {
    return 'Sends email verification link to user';
  }
  if (fname.includes('updateprofile')) {
    return 'Updates user profile information';
  }
  if (fname.includes('getprofile')) {
    return 'Retrieves user profile details';
  }
  if (fname.includes('getuserdetails')) {
    return 'Fetches user account information by ID';
  }
  if (fname.includes('updateuserrole')) {
    return 'Updates user role and permissions';
  }
  if (fname.includes('validatepermissions')) {
    return 'Verifies user has required permissions for action';
  }
  if (fname.includes('checkaccess')) {
    return 'Validates user access to resource';
  }
  if (fname.includes('getuserslist')) {
    return 'Retrieves filtered list of registered users';
  }
  if (fname.includes('deactivateuser')) {
    return 'Deactivates user account and revokes access';
  }
  if (fname.includes('activateuser')) {
    return 'Reactivates previously deactivated user account';
  }
  if (fname.includes('deleteuser')) {
    return 'Permanently deletes user account';
  }
  
  // Payment/Settlement functions
  if (fname.includes('createpayment')) {
    return 'Creates new payment transaction instruction';
  }
  if (fname.includes('processpayment')) {
    return 'Processes payment transaction through gateway';
  }
  if (fname.includes('validatepayment')) {
    return 'Validates payment details before processing';
  }
  if (fname.includes('getpaymentstatus')) {
    return 'Retrieves payment transaction status';
  }
  if (fname.includes('updatepaymentstatus')) {
    return 'Updates payment transaction workflow status';
  }
  if (fname.includes('refundpayment')) {
    return 'Processes payment refund transaction';
  }
  if (fname.includes('cancelpayment')) {
    return 'Cancels pending payment transaction';
  }
  if (fname.includes('getpaymenthistory')) {
    return 'Retrieves payment transaction history for account';
  }
  if (fname.includes('calculatepaymentfee')) {
    return 'Calculates payment processing fees';
  }
  if (fname.includes('validatebankaccount')) {
    return 'Validates bank account details for payment';
  }
  if (fname.includes('addbankaccount')) {
    return 'Adds bank account to organization profile';
  }
  if (fname.includes('updatebankaccount')) {
    return 'Updates bank account details';
  }
  if (fname.includes('getbankaccounts')) {
    return 'Retrieves bank accounts linked to organization';
  }
  if (fname.includes('deletebankaccount')) {
    return 'Removes bank account from organization';
  }
  if (fname.includes('verifybanksaccount')) {
    return 'Verifies bank account ownership';
  }
  if (fname.includes('createsettlement')) {
    return 'Creates batch payment settlement instruction';
  }
  if (fname.includes('processsettlement')) {
    return 'Processes bulk settlement payment batch';
  }
  if (fname.includes('getsettlementstatus')) {
    return 'Retrieves settlement batch processing status';
  }
  if (fname.includes('reconcile')) {
    return 'Reconciles payments with bank statement';
  }
  
  // Document functions
  if (fname.includes('uploaddocument')) {
    return 'Uploads document file to storage';
  }
  if (fname.includes('getdocument')) {
    return 'Retrieves document file from storage';
  }
  if (fname.includes('deletedocument')) {
    return 'Deletes document file from storage';
  }
  if (fname.includes('validatedocument')) {
    return 'Validates document file type and size';
  }
  if (fname.includes('getdocumentlist')) {
    return 'Retrieves list of uploaded documents';
  }
  if (fname.includes('categorizedocument')) {
    return 'Assigns document category and tags';
  }
  if (fname.includes('searchdocuments')) {
    return 'Searches documents by metadata criteria';
  }
  if (fname.includes('downloaddocument')) {
    return 'Downloads document file to user';
  }
  if (fname.includes('sharedocument')) {
    return 'Shares document with other users';
  }
  if (fname.includes('generatedocument')) {
    return 'Generates document from template';
  }
  
  // Notification functions
  if (fname.includes('sendnotification')) {
    return 'Sends notification message to users';
  }
  if (fname.includes('sendemail')) {
    return 'Sends email notification to recipients';
  }
  if (fname.includes('sendsms')) {
    return 'Sends SMS notification to phone number';
  }
  if (fname.includes('getnotifications')) {
    return 'Retrieves user notification messages';
  }
  if (fname.includes('marknotificationread')) {
    return 'Marks notification as read by user';
  }
  if (fname.includes('deletenotification')) {
    return 'Deletes notification message';
  }
  if (fname.includes('getunreadcount')) {
    return 'Retrieves unread notification count for user';
  }
  if (fname.includes('createemailtemplate')) {
    return 'Creates email notification template';
  }
  if (fname.includes('updateemailtemplate')) {
    return 'Updates email template content';
  }
  if (fname.includes('rendertemplate')) {
    return 'Renders email template with data';
  }
  
  // Reporting/Analytics functions
  if (fname.includes('generatereport')) {
    return 'Generates business analytics report';
  }
  if (fname.includes('exportreport')) {
    return 'Exports report data in specified format';
  }
  if (fname.includes('getdashboard')) {
    return 'Retrieves dashboard metrics and KPIs';
  }
  if (fname.includes('calculatesummary')) {
    return 'Calculates aggregate summary statistics';
  }
  if (fname.includes('gettransactions')) {
    return 'Retrieves transaction history with filters';
  }
  if (fname.includes('calculatemetrics')) {
    return 'Calculates business performance metrics';
  }
  if (fname.includes('getanalytics')) {
    return 'Retrieves analytics data for visualization';
  }
  
  // Audit/Logging functions
  if (fname.includes('createauditlog')) {
    return 'Creates audit trail entry for action';
  }
  if (fname.includes('getauditlog')) {
    return 'Retrieves audit trail records';
  }
  if (fname.includes('logaction')) {
    return 'Logs user action to audit trail';
  }
  if (fname.includes('trackchange')) {
    return 'Tracks data change in audit log';
  }
  
  // Workflow/Status functions
  if (fname.includes('updatestatus')) {
    return 'Updates entity workflow status';
  }
  if (fname.includes('getstatus')) {
    return 'Retrieves current workflow status';
  }
  if (fname.includes('validatestatustransition')) {
    return 'Validates workflow status transition is allowed';
  }
  if (fname.includes('getstatushistory')) {
    return 'Retrieves status change history';
  }
  if (fname.includes('approveaction')) {
    return 'Approves pending workflow action';
  }
  if (fname.includes('rejectaction')) {
    return 'Rejects pending workflow action';
  }
  
  // Validation/Middleware functions based on layer
  if (layer === 'middleware') {
    if (fname.includes('auth')) {
      return 'Authentication middleware validating user credentials';
    }
    if (fname.includes('validate')) {
      return 'Request validation middleware checking payload structure';
    }
    if (fname.includes('ratelimit')) {
      return 'Rate limiting middleware restricting request frequency';
    }
    if (fname.includes('error')) {
      return 'Error handling middleware formatting error responses';
    }
    if (fname.includes('logger')) {
      return 'Logging middleware recording request details';
    }
    if (fname.includes('cors')) {
      return 'CORS middleware handling cross-origin requests';
    }
    if (fname.includes('permission')) {
      return 'Permission middleware validating user access rights';
    }
    return 'Middleware processing request pipeline';
  }
  
  // Schema/Validation functions
  if (layer === 'schema') {
    if (fname.includes('creditfacility')) {
      return 'Validates credit facility request payload structure';
    }
    if (fname.includes('financeapplication')) {
      return 'Validates finance application request payload structure';
    }
    if (fname.includes('invoice')) {
      return 'Validates invoice request payload structure';
    }
    if (fname.includes('organisation') || fname.includes('organization')) {
      return 'Validates organization request payload structure';
    }
    if (fname.includes('user')) {
      return 'Validates user request payload structure';
    }
    if (fname.includes('payment')) {
      return 'Validates payment request payload structure';
    }
    if (fname.includes('document')) {
      return 'Validates document request payload structure';
    }
    return 'Validates request payload schema structure';
  }
  
  // Route functions
  if (layer === 'route') {
    if (fname.includes('creditfacility')) {
      return 'Route definitions for credit facility API endpoints';
    }
    if (fname.includes('financeapplication')) {
      return 'Route definitions for finance application API endpoints';
    }
    if (fname.includes('invoice')) {
      return 'Route definitions for invoice API endpoints';
    }
    if (fname.includes('organisation') || fname.includes('organization')) {
      return 'Route definitions for organization API endpoints';
    }
    if (fname.includes('user') || fname.includes('auth')) {
      return 'Route definitions for authentication API endpoints';
    }
    if (fname.includes('payment')) {
      return 'Route definitions for payment API endpoints';
    }
    return 'Route definitions for API endpoints';
  }
  
  // Config functions
  if (layer === 'config') {
    if (fname.includes('database') || fname.includes('db')) {
      return 'Database connection configuration settings';
    }
    if (fname.includes('email')) {
      return 'Email service configuration settings';
    }
    if (fname.includes('payment')) {
      return 'Payment gateway configuration settings';
    }
    if (fname.includes('auth')) {
      return 'Authentication service configuration settings';
    }
    if (fname.includes('logger')) {
      return 'Logging service configuration settings';
    }
    if (fname.includes('environment') || fname.includes('env')) {
      return 'Environment variables configuration settings';
    }
    return 'Application configuration settings';
  }
  
  // Utility functions
  if (layer === 'util') {
    if (fname.includes('format')) {
      return 'Formats data into standardized structure';
    }
    if (fname.includes('parse')) {
      return 'Parses data from input format';
    }
    if (fname.includes('validate')) {
      return 'Validates data against rules';
    }
    if (fname.includes('calculate')) {
      return 'Calculates derived values from inputs';
    }
    if (fname.includes('convert')) {
      return 'Converts data between formats';
    }
    if (fname.includes('encrypt')) {
      return 'Encrypts sensitive data for security';
    }
    if (fname.includes('decrypt')) {
      return 'Decrypts encrypted data';
    }
    if (fname.includes('hash')) {
      return 'Hashes data for integrity';
    }
    if (fname.includes('generatetoken')) {
      return 'Generates authentication token';
    }
    if (fname.includes('sendmail')) {
      return 'Sends email notification';
    }
    if (fname.includes('uploadfile')) {
      return 'Uploads file to storage';
    }
    if (fname.includes('downloadfile')) {
      return 'Downloads file from storage';
    }
    if (fname.includes('logger')) {
      return 'Logs application events';
    }
    return 'Utility helper function';
  }
  
  // Controller layer - more specific analysis needed
  if (layer === 'controller') {
    // Analyze code for specific actions
    if (code.includes('CREATE') || code.includes('INSERT') || fname.includes('create')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Handles credit facility creation request';
      }
      if (code.includes('finance_application') || fpath.includes('finance')) {
        return 'Handles finance application creation request';
      }
      if (code.includes('invoice')) {
        return 'Handles invoice creation request';
      }
      if (code.includes('organisation') || code.includes('organization')) {
        return 'Handles organization creation request';
      }
      if (code.includes('user')) {
        return 'Handles user registration request';
      }
      if (code.includes('payment')) {
        return 'Handles payment creation request';
      }
      return 'Handles entity creation request';
    }
    
    if (code.includes('UPDATE') || fname.includes('update')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Handles credit facility update request';
      }
      if (code.includes('finance_application') || fpath.includes('finance')) {
        return 'Handles finance application update request';
      }
      if (code.includes('invoice')) {
        return 'Handles invoice update request';
      }
      if (code.includes('organisation') || code.includes('organization')) {
        return 'Handles organization update request';
      }
      if (code.includes('user')) {
        return 'Handles user profile update request';
      }
      return 'Handles entity update request';
    }
    
    if (code.includes('SELECT') || code.includes('GET') || fname.includes('get') || fname.includes('fetch')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Handles credit facility retrieval request';
      }
      if (code.includes('finance_application') || fpath.includes('finance')) {
        return 'Handles finance application retrieval request';
      }
      if (code.includes('invoice')) {
        return 'Handles invoice retrieval request';
      }
      if (code.includes('organisation') || code.includes('organization')) {
        return 'Handles organization retrieval request';
      }
      if (code.includes('user')) {
        return 'Handles user details retrieval request';
      }
      if (code.includes('list')) {
        return 'Handles list retrieval request';
      }
      return 'Handles data retrieval request';
    }
    
    if (code.includes('DELETE') || fname.includes('delete') || fname.includes('remove')) {
      return 'Handles entity deletion request';
    }
    
    if (fname.includes('approve')) {
      return 'Handles approval decision request';
    }
    if (fname.includes('reject')) {
      return 'Handles rejection decision request';
    }
    if (fname.includes('submit')) {
      return 'Handles submission request';
    }
    if (fname.includes('withdraw')) {
      return 'Handles withdrawal request';
    }
    if (fname.includes('validate')) {
      return 'Handles validation request';
    }
    
    return 'Handles API request';
  }
  
  // Service layer - business logic
  if (layer === 'service') {
    // Try to infer from code content
    if (code.includes('knex') || code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE')) {
      // It's doing DB operations
      if (fname.includes('get') || fname.includes('fetch')) {
        if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
          return 'Retrieves credit facility data with business logic';
        }
        if (code.includes('finance') || fpath.includes('finance')) {
          return 'Retrieves finance application data with business logic';
        }
        return 'Retrieves entity data with business logic';
      }
      if (fname.includes('create')) {
        if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
          return 'Creates credit facility with business validation';
        }
        if (code.includes('finance') || fpath.includes('finance')) {
          return 'Creates finance application with business validation';
        }
        return 'Creates entity with business validation';
      }
      if (fname.includes('update')) {
        if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
          return 'Updates credit facility with business rules';
        }
        return 'Updates entity with business rules';
      }
      if (fname.includes('calculate')) {
        return 'Calculates business metrics and values';
      }
      if (fname.includes('validate')) {
        return 'Validates business rules and constraints';
      }
    }
    
    if (fname.includes('send') || fname.includes('notify')) {
      return 'Sends notification to stakeholders';
    }
    
    if (fname.includes('process')) {
      return 'Processes business logic workflow';
    }
    
    return 'Processes business logic';
  }
  
  // Database service layer
  if (layer === 'db_service') {
    if (fname.includes('get') || fname.includes('fetch') || fname.includes('find')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Queries credit facility data from database';
      }
      if (code.includes('finance') || fpath.includes('finance')) {
        return 'Queries finance application data from database';
      }
      if (code.includes('invoice')) {
        return 'Queries invoice data from database';
      }
      if (code.includes('organisation') || code.includes('organization')) {
        return 'Queries organization data from database';
      }
      if (code.includes('user')) {
        return 'Queries user data from database';
      }
      if (code.includes('payment')) {
        return 'Queries payment data from database';
      }
      if (code.includes('document')) {
        return 'Queries document data from database';
      }
      return 'Queries entity data from database';
    }
    
    if (fname.includes('create') || fname.includes('insert')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Inserts credit facility record into database';
      }
      if (code.includes('finance') || fpath.includes('finance')) {
        return 'Inserts finance application record into database';
      }
      if (code.includes('invoice')) {
        return 'Inserts invoice record into database';
      }
      if (code.includes('organisation') || code.includes('organization')) {
        return 'Inserts organization record into database';
      }
      if (code.includes('user')) {
        return 'Inserts user record into database';
      }
      return 'Inserts entity record into database';
    }
    
    if (fname.includes('update')) {
      if (code.includes('credit_facility') || fpath.includes('credit_facility')) {
        return 'Updates credit facility record in database';
      }
      if (code.includes('finance') || fpath.includes('finance')) {
        return 'Updates finance application record in database';
      }
      if (code.includes('invoice')) {
        return 'Updates invoice record in database';
      }
      if (code.includes('status')) {
        return 'Updates entity status in database';
      }
      return 'Updates entity record in database';
    }
    
    if (fname.includes('delete') || fname.includes('remove')) {
      return 'Deletes entity record from database';
    }
    
    return 'Executes database query';
  }
  
  // Fallback - try to extract meaning from function name
  const cleanName = fname.replace(/_/g, ' ');
  if (cleanName.length > 5) {
    return `Processes ${cleanName} logic`;
  }
  
  // Ultimate fallback
  return 'Processes application logic';
}

// Generate descriptions for all chunks
const descriptions = chunks.map(chunk => ({
  id: chunk.id,
  description: generateDescription(chunk)
}));

// Write output
fs.writeFileSync(
  '/Users/sarvang.jain/Work/Repos/developer-agent-e2e/scripts/cursor-batches/descriptions-part-3.json',
  JSON.stringify(descriptions, null, 2),
  'utf8'
);

console.log(`Generated descriptions for ${descriptions.length} chunks`);
console.log('Output written to descriptions-part-3.json');
