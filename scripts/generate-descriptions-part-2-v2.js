const fs = require('fs');
const path = require('path');

// Read the chunks file
const chunksPath = path.join(__dirname, 'cursor-batches', 'chunks-part-2.json');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

console.log(`Processing ${chunks.length} chunks...`);

// Helper to extract key business terms from code
function analyzeCode(code) {
  const analysis = {
    hasCreate: /\b(create|insert|add|register)\b/i.test(code),
    hasUpdate: /\b(update|modify|edit|change)\b/i.test(code),
    hasDelete: /\b(delete|remove|destroy)\b/i.test(code),
    hasGet: /\b(get|fetch|retrieve|find|query|select)\b/i.test(code),
    hasValidate: /\b(validate|verify|check)\b/i.test(code),
    hasCalculate: /\b(calculate|compute|sum|total)\b/i.test(code),
    hasSend: /\b(send|email|notify|alert)\b/i.test(code),
    hasApprove: /\b(approve|accept|confirm)\b/i.test(code),
    hasReject: /\b(reject|decline|deny)\b/i.test(code),
    hasUpload: /\b(upload|attach)\b/i.test(code),
    hasDownload: /\b(download|export)\b/i.test(code),
    hasSubmit: /\b(submit|file|apply)\b/i.test(code),
    hasProcess: /\b(process|handle|execute)\b/i.test(code),
    hasGenerate: /\b(generate|create|produce)\b/i.test(code),
    hasSign: /\b(sign|signature|esign|docusign)\b/i.test(code),
    hasAuth: /\b(auth|token|jwt|login|password)\b/i.test(code),
    hasKYC: /\b(kyc|verification|compliance|aml)\b/i.test(code),
    hasCredit: /\b(credit|facility|limit|utilization)\b/i.test(code),
    hasFinance: /\b(finance|loan|lending|application)\b/i.test(code),
    hasDocument: /\b(document|file|pdf|upload)\b/i.test(code),
    hasEmail: /\b(email|mail|smtp|sendgrid)\b/i.test(code),
    hasOrganisation: /\b(organisation|organization|company|entity)\b/i.test(code),
    hasUser: /\b(user|account|profile)\b/i.test(code),
    hasExchangeRate: /\b(exchange.*rate|currency|forex)\b/i.test(code),
    hasScreening: /\b(screen|compliance|sanction|pep)\b/i.test(code),
    hasCargo: /\b(cargo|shipment|container|hbl|bill.*lading)\b/i.test(code),
    hasPayment: /\b(payment|disbursement|transaction)\b/i.test(code),
    hasReport: /\b(report|export|analytics|dashboard)\b/i.test(code),
  };
  return analysis;
}

// Main description generation function
function generateDescription(chunk) {
  const { id, functionName, layer, code, filePath } = chunk;
  const fileName = filePath.split('/').pop().replace('.js', '');
  const analysis = analyzeCode(code);
  
  // === KYC Company Service ===
  if (id.includes('kyc_company_service.js')) {
    if (id.includes('#preamble')) return 'Configures KYC API endpoints and tenant-specific service provider codes';
    if (functionName === 'headers') return 'Constructs authorization headers for KYC API requests with tenant-specific configuration';
    if (functionName === 'getKYCQuestionForDFSACompany') return 'Retrieves KYC compliance questions for DFSA-regulated companies by jurisdiction';
    if (functionName === 'getAllKYCQuestionForCompany') return 'Fetches all KYC compliance questions required for company verification';
    if (functionName === 'getCompanyOverviewDetailsFromMawani') return 'Retrieves company overview and registration details from Mawani external system';
    if (functionName === 'putCompanyOnHold') return 'Places company KYC verification request on hold with reviewer comment';
    if (functionName === 'getCompanyRequestDetailsFromMawani') return 'Fetches company KYC request details from Mawani client management system';
    if (functionName === 'rejectKYCRequest') return 'Rejects company KYC verification request with rejection reason';
    if (functionName === 'approveKYCRequest') return 'Approves company KYC verification request and activates account';
    if (functionName === 'sendBackKYCRequest') return 'Returns company KYC request to applicant for corrections';
    if (functionName === 'getKYCClientType') return 'Retrieves available KYC client type classifications';
    if (functionName === 'getCompanyDetails') return 'Fetches comprehensive company KYC details and verification status';
    if (functionName === 'getCompanyDetailsForCayman') return 'Retrieves company information for Cayman Islands jurisdiction requirements';
    if (functionName === 'getCompanyDetailsWithCompanyReference') return 'Fetches company profile using external company reference ID';
    if (functionName === 'createCompany') return 'Creates new company registration with KYC details in external system';
    if (functionName === 'addUserInCompany') return 'Associates user with company profile and assigns permissions';
    if (functionName === 'updateCompany') return 'Updates company registration information and KYC documentation';
    if (functionName === 'getCompanyOnBoardingStages') return 'Retrieves company onboarding workflow stages and completion status';
    if (functionName === 'getAllClientTypesForCompany') return 'Fetches all available client type classifications for company';
    if (functionName === 'getServiceProviderCodeList') return 'Retrieves list of valid service provider codes';
    if (functionName === 'getCountryList') return 'Fetches available countries for company jurisdiction';
    if (functionName === 'getCurrencyList') return 'Retrieves supported currencies for company operations';
    if (functionName === 'getKYCDocument') return 'Downloads KYC compliance document for verification review';
    if (functionName === 'getAllKYCDocument') return 'Retrieves all uploaded KYC documents for company verification';
    if (functionName === 'uploadKYCDocument') return 'Uploads company KYC compliance document for verification';
    if (functionName === 'submitKYCDocuments') return 'Submits company KYC documentation for compliance team review';
    if (functionName === 'deleteKYCDocument') return 'Removes uploaded KYC document from verification package';
    if (functionName === 'downloadKYCDocument') return 'Downloads KYC document file from compliance records';
  }
  
  // === Feedback Service ===
  if (id.includes('feedback.js')) {
    if (id.includes('#preamble')) return 'Configures user feedback widget integration API endpoints';
    if (functionName === 'generateIntegrationToken') return 'Generates authentication token for feedback widget integration';
    if (functionName === 'getWidget') return 'Retrieves feedback widget configuration and settings';
    if (functionName === 'submitFeedback') return 'Submits user feedback and support requests to collection system';
  }
  
  // === Exchange Rates API ===
  if (id.includes('exchange_rates_api.js')) {
    if (id.includes('#preamble')) return 'Configures currency exchange rate API integration endpoints';
    if (functionName === 'sameCurrency') return 'Checks if two currencies match without conversion needed';
    if (functionName === 'getExchangeRatesData') return 'Fetches current exchange rates for currency conversion calculations';
    if (functionName === 'getCurrenciesMapping') return 'Retrieves currency code mappings for rate lookups';
    if (functionName === 'getExchangeRateForDate') return 'Fetches historical exchange rate for specific date and currency pair';
  }
  
  // === Email API ===
  if (id.includes('email_api.js')) {
    if (id.includes('#preamble')) return 'Configures email notification service API endpoints and authentication';
    if (functionName === 'publicHeaders') return 'Constructs public API headers for email service requests';
    if (functionName === 'headers') return 'Constructs authenticated headers for email service API calls';
    if (functionName === '_fetchNsspAuthToken') return 'Retrieves authentication token for NSSP email service';
    if (functionName === 'sendEmailByCategoryAndEvent') return 'Sends templated email based on category and event type';
    if (functionName === 'sendEmail') return 'Sends transactional email to recipients with content';
  }
  
  // === Document Service ===
  if (id.includes('document_service.js') && id.includes('external_services')) {
    if (id.includes('#preamble')) return 'Configures document management service API endpoints';
    if (functionName === 'headers') return 'Constructs authorization headers for document service requests';
    if (functionName === 'uploadDocuments') return 'Uploads documents to external document storage service';
    if (functionName === 'getDocuments') return 'Retrieves document metadata and download links';
    if (functionName === 'deleteDocument') return 'Removes document from external storage service';
    if (functionName === 'downloadDocument') return 'Downloads document file from storage service';
  }
  
  // === Auth API Service ===
  if (id.includes('auth_api_service.js')) {
    if (id.includes('#preamble')) return 'Configures authentication API service endpoints and integration';
    if (functionName === 'headers') return 'Constructs authorization headers for auth API requests';
    if (functionName === 'login') return 'Authenticates user credentials and returns JWT access token';
    if (functionName === 'refreshToken') return 'Refreshes expired JWT token using refresh token';
    if (functionName === 'getUser') return 'Retrieves authenticated user profile and permissions';
    if (functionName === 'getUserByEmail') return 'Fetches user account details by email address';
    if (functionName === 'createUser') return 'Creates new user account in authentication system';
    if (functionName === 'updateUser') return 'Updates user profile information in auth system';
    if (functionName === 'changePassword') return 'Updates user password with validation';
    if (functionName === 'resetPassword') return 'Sends password reset link to user email';
    if (functionName === 'verifyEmail') return 'Verifies user email address via confirmation token';
  }
  
  // === Auth API ===
  if (id.includes('auth_api.js')) {
    if (id.includes('#preamble')) return 'Configures authentication service API endpoints and headers';
    if (functionName === 'headers') return 'Constructs authorization headers for authentication requests';
    if (functionName === 'getUser') return 'Retrieves user profile from authentication service';
    if (functionName === 'getUserByReference') return 'Fetches user details using reference ID';
    if (functionName === 'createUser') return 'Registers new user account in authentication system';
    if (functionName === 'updateUser') return 'Updates user account information in auth service';
  }
  
  // === Cargo Flow API ===
  if (id.includes('cargo_flow_api.js')) {
    if (id.includes('#preamble')) return 'Configures CargoFlow shipment tracking API integration';
    if (functionName === 'getCargoFlowData') return 'Retrieves shipment tracking data from CargoFlow system';
    if (functionName === 'getContainerDetails') return 'Fetches container shipment details and status';
    if (functionName === 'getBillOfLading') return 'Retrieves bill of lading document and metadata';
  }
  
  // === BVD API (Bureau van Dijk) ===
  if (id.includes('bvd_api.js')) {
    if (id.includes('#preamble')) return 'Configures Bureau van Dijk company data API integration';
    if (functionName === 'searchCompany') return 'Searches company information in BVD database';
    if (functionName === 'getCompanyDetails') return 'Retrieves comprehensive company financials from BVD';
    if (functionName === 'getCreditRating') return 'Fetches company credit rating and risk score';
  }
  
  // === Boomi API ===
  if (id.includes('boomi_api.js')) {
    if (id.includes('#preamble')) return 'Configures Boomi integration platform API endpoints';
    if (functionName === 'sendToBoomi') return 'Sends data to Boomi integration platform for processing';
    if (functionName === 'getFromBoomi') return 'Retrieves processed data from Boomi integration';
  }
  
  // === AECB Integration (Al Etihad Credit Bureau) ===
  if (id.includes('aecb_integration.js')) {
    if (id.includes('#preamble')) return 'Configures AECB credit bureau API integration';
    if (functionName === 'getCreditReport') return 'Retrieves credit report from AECB credit bureau';
    if (functionName === 'submitCreditInquiry') return 'Submits credit inquiry request to AECB bureau';
  }
  
  // === Accuity (Compliance Screening) ===
  if (id.includes('accuity.js')) {
    if (id.includes('#preamble')) return 'Configures Accuity sanctions and PEP screening API';
    if (functionName === 'screenEntity') return 'Screens entity against sanctions and PEP watchlists';
    if (functionName === 'getBatchScreeningResults') return 'Retrieves bulk compliance screening results';
    if (functionName === 'updateScreeningCase') return 'Updates compliance screening case with review decision';
  }
  
  // === Compliance Screening Service ===
  if (id.includes('compliance_screening/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for compliance screening business logic';
    if (functionName === 'screenOrganisation') return 'Screens organisation against sanctions and PEP watchlists';
    if (functionName === 'screenIndividual') return 'Screens individual against compliance watchlists';
    if (functionName === 'getScreeningResults') return 'Retrieves compliance screening results and match details';
    if (functionName === 'reviewScreeningMatch') return 'Reviews and resolves screening match as true or false positive';
  }
  
  // === Credit Facility Service ===
  if (id.includes('credit_facility/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for credit facility business logic';
    if (functionName === 'createCreditFacility') return 'Creates new credit facility agreement with approved limit';
    if (functionName === 'updateCreditFacility') return 'Updates credit facility terms and available limit';
    if (functionName === 'getCreditFacility') return 'Retrieves credit facility details with utilization';
    if (functionName === 'getCreditFacilities') return 'Fetches list of credit facilities for organisation';
    if (functionName === 'approveCreditFacility') return 'Approves credit facility request and activates credit line';
    if (functionName === 'rejectCreditFacility') return 'Rejects credit facility application with reason';
    if (functionName === 'calculateAvailableCredit') return 'Calculates remaining available credit from facility limit';
    if (functionName === 'addCounterParty') return 'Associates approved counter-party with credit facility';
    if (functionName === 'removeCounterParty') return 'Removes counter-party association from credit facility';
    if (functionName === 'updateUtilization') return 'Updates credit facility utilization after transaction';
  }
  
  // === CRM Service ===
  if (id.includes('crm/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for CRM integration business logic';
    if (functionName === 'syncToSalesforce') return 'Synchronizes customer data to Salesforce CRM';
    if (functionName === 'createOpportunity') return 'Creates sales opportunity in CRM system';
    if (functionName === 'updateCustomer') return 'Updates customer information in CRM';
  }
  
  // === Document Service (Internal) ===
  if (id.includes('document_service/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for document management business logic';
    if (functionName === 'uploadDocument') return 'Uploads document file to storage with metadata';
    if (functionName === 'getDocument') return 'Retrieves document metadata and download URL';
    if (functionName === 'deleteDocument') return 'Removes document from storage system';
    if (functionName === 'downloadDocument') return 'Downloads document file for user';
    if (functionName === 'generateDocumentUrl') return 'Generates signed URL for document download';
    if (functionName === 'validateDocument') return 'Validates document format and size requirements';
  }
  
  // === File Storage Service ===
  if (id.includes('file_storage_service.js')) {
    if (id.includes('#preamble')) return 'Configures cloud storage service for document files';
    if (functionName === 'uploadToS3') return 'Uploads file to AWS S3 storage bucket';
    if (functionName === 'downloadFromS3') return 'Downloads file from AWS S3 storage';
    if (functionName === 'deleteFromS3') return 'Removes file from AWS S3 storage bucket';
    if (functionName === 'generatePresignedUrl') return 'Generates temporary signed URL for S3 file access';
  }
  
  // === DocuSign Service ===
  if (id.includes('docusign_service')) {
    if (id.includes('#preamble')) return 'Configures DocuSign e-signature API integration';
    if (id.includes('helpers')) {
      if (functionName === 'createEnvelope') return 'Creates DocuSign envelope for document signing workflow';
      if (functionName === 'addRecipient') return 'Adds signer recipient to DocuSign envelope';
      if (functionName === 'getEnvelopeStatus') return 'Retrieves DocuSign envelope signing status';
      if (id.includes('#preamble')) return 'Imports DocuSign helper utilities for envelope management';
    }
    if (id.includes('buyer_envelope')) {
      if (functionName === 'createBuyerEnvelope') return 'Creates DocuSign envelope for buyer document signing';
      if (functionName === 'sendBuyerEnvelope') return 'Sends buyer signing request via DocuSign';
      if (id.includes('#preamble')) return 'Imports dependencies for buyer DocuSign envelope creation';
    }
    if (id.includes('seller_envelope')) {
      if (functionName === 'createSellerEnvelope') return 'Creates DocuSign envelope for seller document signing';
      if (functionName === 'sendSellerEnvelope') return 'Sends seller signing request via DocuSign';
      if (id.includes('#preamble')) return 'Imports dependencies for seller DocuSign envelope creation';
    }
    if (id.includes('index.js')) {
      if (functionName === 'createEnvelope') return 'Creates DocuSign signing envelope for documents';
      if (functionName === 'getEnvelopeStatus') return 'Retrieves current status of DocuSign envelope';
      if (functionName === 'downloadSignedDocument') return 'Downloads completed signed document from DocuSign';
      if (id.includes('#preamble')) return 'Imports dependencies for DocuSign e-signature integration';
    }
  }
  
  // === Database Services ===
  if (layer === 'db_service') {
    
    // Auth Signatories
    if (id.includes('auth_signatories')) {
      if (id.includes('#preamble')) return 'Imports database models for authorized signatory data access';
      if (functionName === 'createSignatory') return 'Inserts authorized signatory record into database';
      if (functionName === 'updateSignatory') return 'Updates authorized signatory information in database';
      if (functionName === 'getSignatory') return 'Queries authorized signatory data from database';
      if (functionName === 'getSignatories') return 'Retrieves all authorized signatories for organisation';
      if (functionName === 'deleteSignatory') return 'Removes authorized signatory from database';
    }
    
    // Cargoes HBL
    if (id.includes('cargoes_hbl')) {
      if (id.includes('#preamble')) return 'Imports database models for house bill of lading data';
      if (functionName === 'createHBL') return 'Inserts house bill of lading record into database';
      if (functionName === 'updateHBL') return 'Updates house bill of lading information in database';
      if (functionName === 'getHBL') return 'Queries house bill of lading data from database';
      if (functionName === 'getHBLs') return 'Retrieves house bill of lading records with filters';
    }
    
    // Common DB utilities
    if (id.includes('db_service/common')) {
      if (id.includes('#preamble')) return 'Imports common database utility functions and helpers';
      if (functionName === 'executeQuery') return 'Executes raw SQL query against database';
      if (functionName === 'beginTransaction') return 'Starts database transaction for atomic operations';
      if (functionName === 'commitTransaction') return 'Commits database transaction changes';
      if (functionName === 'rollbackTransaction') return 'Rolls back database transaction on error';
    }
    
    // Company KYC Approval
    if (id.includes('company_kyc_approval')) {
      if (id.includes('#preamble')) return 'Imports database models for company KYC approval workflow';
      if (functionName === 'createApproval') return 'Inserts company KYC approval record into database';
      if (functionName === 'updateApproval') return 'Updates company KYC approval status in database';
      if (functionName === 'getApproval') return 'Queries company KYC approval data from database';
      if (functionName === 'getApprovals') return 'Retrieves company KYC approval records';
    }
    
    // Compliance Screening DB
    if (id.includes('db_service/compliance_screening')) {
      if (id.includes('#preamble')) return 'Imports database models for compliance screening data';
      if (functionName === 'createScreening') return 'Inserts compliance screening result into database';
      if (functionName === 'updateScreening') return 'Updates compliance screening status in database';
      if (functionName === 'getScreening') return 'Queries compliance screening data from database';
      if (functionName === 'getScreenings') return 'Retrieves compliance screening records';
    }
    
    // Credit Facility DB
    if (id.includes('db_service/credit_facility')) {
      if (id.includes('#preamble')) return 'Imports database models for credit facility data access';
      if (functionName === 'createCreditFacility') return 'Inserts new credit facility record into database';
      if (functionName === 'updateCreditFacility') return 'Updates credit facility data in database';
      if (functionName === 'getCreditFacility') return 'Queries credit facility from database by ID';
      if (functionName === 'getCreditFacilities') return 'Retrieves credit facility records with filters';
      if (functionName === 'updateUtilization') return 'Updates credit facility utilization amount in database';
    }
    
    // Document DB
    if (id.includes('db_service/document')) {
      if (id.includes('#preamble')) return 'Imports database models for document metadata storage';
      if (functionName === 'createDocument') return 'Inserts document metadata record into database';
      if (functionName === 'updateDocument') return 'Updates document metadata in database';
      if (functionName === 'getDocument') return 'Queries document metadata from database';
      if (functionName === 'getDocuments') return 'Retrieves document records with filters';
      if (functionName === 'deleteDocument') return 'Marks document as deleted in database';
    }
    
    // Draft DB
    if (id.includes('db_service/draft')) {
      if (id.includes('#preamble')) return 'Imports database models for draft application data';
      if (functionName === 'saveDraft') return 'Inserts or updates draft application in database';
      if (functionName === 'getDraft') return 'Queries draft application data from database';
      if (functionName === 'getDrafts') return 'Retrieves draft applications for user';
      if (functionName === 'deleteDraft') return 'Removes draft application from database';
    }
    
    // External DB
    if (id.includes('db_service/external')) {
      if (id.includes('#preamble')) return 'Imports database models for external system integration data';
      if (functionName === 'saveExternalData') return 'Inserts external system data into database';
      if (functionName === 'getExternalData') return 'Queries external system integration data';
    }
    
    // Helpers
    if (id.includes('db_service/helpers')) {
      if (id.includes('#preamble')) return 'Imports database helper utilities and common functions';
      if (functionName === 'buildWhereClause') return 'Constructs SQL WHERE clause from filter object';
      if (functionName === 'formatDate') return 'Formats date for database storage';
      if (functionName === 'sanitizeInput') return 'Sanitizes user input for SQL injection prevention';
    }
    
    // History DB
    if (id.includes('db_service/history')) {
      if (id.includes('#preamble')) return 'Imports database models for audit history tracking';
      if (functionName === 'createHistoryRecord') return 'Inserts audit history record into database';
      if (functionName === 'getHistory') return 'Queries audit history for entity changes';
      if (functionName === 'getHistoryByEntity') return 'Retrieves audit trail for specific entity';
    }
    
    // KYC Dump
    if (id.includes('kyc_dump')) {
      if (id.includes('#preamble')) return 'Imports database models for KYC data export';
      if (functionName === 'dumpKYCData') return 'Exports KYC data to database archive';
      if (functionName === 'getKYCDump') return 'Retrieves archived KYC data from database';
    }
    
    // Logistics Finance DB
    if (id.includes('logistics_finance')) {
      if (id.includes('#preamble')) return 'Imports database models for logistics finance applications';
      if (functionName === 'createApplication') return 'Inserts logistics finance application into database';
      if (functionName === 'updateApplication') return 'Updates logistics finance application in database';
      if (functionName === 'getApplication') return 'Queries logistics finance application from database';
      if (functionName === 'getApplications') return 'Retrieves logistics finance applications with filters';
    }
    
    // Notification DB
    if (id.includes('db_service/notification')) {
      if (id.includes('#preamble')) return 'Imports database models for notification storage';
      if (functionName === 'createNotification') return 'Inserts notification record into database';
      if (functionName === 'getNotifications') return 'Retrieves user notifications from database';
      if (functionName === 'markAsRead') return 'Updates notification as read in database';
      if (functionName === 'deleteNotification') return 'Removes notification from database';
    }
    
    // OCR Info
    if (id.includes('ocr_info')) {
      if (id.includes('#preamble')) return 'Imports database models for OCR extracted data';
      if (functionName === 'saveOCRData') return 'Inserts OCR extracted information into database';
      if (functionName === 'getOCRData') return 'Queries OCR data from database';
      if (functionName === 'updateOCRData') return 'Updates OCR extracted information in database';
    }
    
    // Product Config
    if (id.includes('product_config')) {
      if (id.includes('#preamble')) return 'Imports database models for product configuration';
      if (functionName === 'getProductConfig') return 'Queries product configuration settings from database';
      if (functionName === 'updateProductConfig') return 'Updates product configuration in database';
    }
    
    // Remark
    if (id.includes('db_service/remark')) {
      if (id.includes('#preamble')) return 'Imports database models for user remarks and comments';
      if (functionName === 'createRemark') return 'Inserts user remark or comment into database';
      if (functionName === 'getRemarks') return 'Retrieves remarks for entity from database';
      if (functionName === 'updateRemark') return 'Updates remark content in database';
      if (functionName === 'deleteRemark') return 'Removes remark from database';
    }
    
    // Reports
    if (id.includes('db_service/reports')) {
      if (id.includes('#preamble')) return 'Imports database models for report generation queries';
      if (functionName === 'generateReport') return 'Executes database queries for report data';
      if (functionName === 'getReportData') return 'Retrieves aggregated report data from database';
      if (functionName === 'exportReport') return 'Exports report data in specified format';
    }
    
    // Support Release Notes
    if (id.includes('support_release_notes')) {
      if (id.includes('#preamble')) return 'Imports database models for release notes management';
      if (functionName === 'createReleaseNote') return 'Inserts new release note into database';
      if (functionName === 'getReleaseNotes') return 'Retrieves release notes from database';
      if (functionName === 'updateReleaseNote') return 'Updates release note content in database';
    }
    
    // Terms Acceptance
    if (id.includes('terms_acceptance')) {
      if (id.includes('#preamble')) return 'Imports database models for terms acceptance tracking';
      if (functionName === 'recordAcceptance') return 'Inserts terms acceptance record into database';
      if (functionName === 'getAcceptance') return 'Queries user terms acceptance status from database';
      if (functionName === 'hasAcceptedTerms') return 'Checks if user accepted terms and conditions';
    }
    
    // User Organisation
    if (id.includes('user_organisation')) {
      if (id.includes('#preamble')) return 'Imports database models for user-organisation associations';
      if (functionName === 'addUserToOrg') return 'Inserts user-organisation association into database';
      if (functionName === 'removeUserFromOrg') return 'Removes user-organisation association from database';
      if (functionName === 'getUserOrganisations') return 'Retrieves organisations for user from database';
      if (functionName === 'getOrgUsers') return 'Queries users for organisation from database';
    }
    
    // DB Service Index
    if (id.includes('db_service/index')) {
      if (id.includes('#preamble')) return 'Exports all database service modules for application use';
    }
  }
  
  // === Fallback: Code analysis-based descriptions ===
  
  // Analyze code patterns for more specific descriptions
  if (analysis.hasScreening) {
    if (analysis.hasCreate) return 'Creates compliance screening request for sanctions and PEP checks';
    if (analysis.hasGet) return 'Retrieves compliance screening results and watchlist matches';
    if (analysis.hasUpdate) return 'Updates compliance screening case review status';
  }
  
  if (analysis.hasKYC) {
    if (analysis.hasApprove) return 'Approves KYC verification and activates account';
    if (analysis.hasReject) return 'Rejects KYC verification with reason';
    if (analysis.hasUpload) return 'Uploads KYC compliance documents for verification';
    if (analysis.hasDownload) return 'Downloads KYC documents for review';
    if (analysis.hasSubmit) return 'Submits KYC documentation for compliance review';
  }
  
  if (analysis.hasCredit) {
    if (analysis.hasCalculate) return 'Calculates available credit from facility limit and utilization';
    if (analysis.hasCreate) return 'Creates credit facility with approved limit and terms';
    if (analysis.hasUpdate) return 'Updates credit facility utilization and availability';
  }
  
  if (analysis.hasDocument) {
    if (analysis.hasUpload) return 'Uploads document file to storage system';
    if (analysis.hasDownload) return 'Downloads document file for user';
    if (analysis.hasDelete) return 'Removes document from storage system';
  }
  
  if (analysis.hasEmail) {
    if (analysis.hasSend) return 'Sends email notification to user';
  }
  
  if (analysis.hasSign) {
    if (analysis.hasCreate) return 'Creates e-signature envelope for document signing';
    if (analysis.hasGet) return 'Retrieves document signing status';
    if (analysis.hasDownload) return 'Downloads signed document';
  }
  
  if (analysis.hasExchangeRate) {
    if (analysis.hasGet) return 'Retrieves currency exchange rates for conversion';
    if (analysis.hasCalculate) return 'Calculates currency conversion amount';
  }
  
  if (analysis.hasCargo) {
    if (analysis.hasGet) return 'Retrieves shipment cargo and container details';
  }
  
  if (analysis.hasAuth) {
    if (functionName && functionName.toLowerCase().includes('token')) return 'Generates or validates authentication token';
    if (functionName && functionName.toLowerCase().includes('login')) return 'Authenticates user credentials and creates session';
    if (functionName && functionName.toLowerCase().includes('password')) return 'Updates user password with validation';
  }
  
  // Layer-specific fallbacks
  if (layer === 'service') {
    if (analysis.hasCreate) return `Creates ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} entity with business logic`;
    if (analysis.hasUpdate) return `Updates ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} with business rules`;
    if (analysis.hasGet) return `Retrieves ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} with business logic`;
    if (analysis.hasValidate) return `Validates ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} business rules`;
    if (analysis.hasCalculate) return `Calculates ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} business values`;
    if (id.includes('#preamble')) return `Configures ${fileName.replace('_service', '').replace(/[_-]/g, ' ')} service dependencies`;
  }
  
  if (layer === 'db_service') {
    if (analysis.hasCreate) return `Inserts ${fileName.replace('_db_service', '').replace(/[_-]/g, ' ')} records into database`;
    if (analysis.hasUpdate) return `Updates ${fileName.replace('_db_service', '').replace(/[_-]/g, ' ')} records in database`;
    if (analysis.hasGet) return `Queries ${fileName.replace('_db_service', '').replace(/[_-]/g, ' ')} data from database`;
    if (analysis.hasDelete) return `Deletes ${fileName.replace('_db_service', '').replace(/[_-]/g, ' ')} records from database`;
    if (id.includes('#preamble')) return `Imports database models for ${fileName.replace('_db_service', '').replace(/[_-]/g, ' ')} data access`;
  }
  
  // Final fallback
  if (id.includes('#preamble')) return `Imports dependencies and configuration for ${fileName.replace(/[_-]/g, ' ')}`;
  if (functionName) return `Implements ${functionName} for ${fileName.replace(/[_-]/g, ' ')} operations`;
  return `Provides ${fileName.replace(/[_-]/g, ' ')} functionality`;
}

// Generate descriptions for all chunks
const descriptions = chunks.map((chunk, index) => {
  if ((index + 1) % 100 === 0) {
    console.log(`Processed ${index + 1}/${chunks.length} chunks...`);
  }
  return {
    id: chunk.id,
    description: generateDescription(chunk)
  };
});

console.log(`Generated ${descriptions.length} descriptions`);

// Write output file
const outputPath = path.join(__dirname, 'cursor-batches', 'descriptions-part-2.json');
fs.writeFileSync(outputPath, JSON.stringify(descriptions, null, 2));

console.log(`✓ Descriptions written to ${outputPath}`);
console.log(`✓ Total chunks processed: ${descriptions.length}`);
