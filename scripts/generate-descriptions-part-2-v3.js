const fs = require('fs');
const path = require('path');

// Read the chunks file
const chunksPath = path.join(__dirname, 'cursor-batches', 'chunks-part-2.json');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

console.log(`Processing ${chunks.length} chunks...`);

// Helper to infer description from function name
function inferFromFunctionName(functionName, fileName) {
  if (!functionName) return null;
  
  const name = functionName.toLowerCase();
  const file = fileName.toLowerCase().replace('.js', '').replace(/_/g, ' ');
  
  // Authentication/Login
  if (name === 'authenticate') return 'Authenticates user credentials and returns session token';
  if (name === 'logout') return 'Logs out user and invalidates authentication session';
  if (name === 'refreshtoken') return 'Refreshes expired authentication token';
  if (name === 'verifytoken') return 'Validates authentication token signature and expiration';
  if (name === 'generatetoken') return 'Generates new authentication token for user session';
  
  // Format/Transform functions
  if (name.startsWith('_format') || name.startsWith('format')) {
    if (name.includes('director')) return 'Formats company director details for external system integration';
    if (name.includes('bo')) return 'Formats beneficial owner information for compliance submission';
    if (name.includes('shareholder')) return 'Formats shareholder details for external system sync';
    if (name.includes('boomi')) return 'Formats API response from Boomi integration platform';
    if (name.includes('range')) return 'Constructs pagination range header for API requests';
  }
  
  // Save/Store functions
  if (name.includes('save') && name.includes('dump')) return 'Persists raw integration data to database for audit trail';
  
  // Integration functions
  if (name === 'fiintegration') return 'Integrates financial institution data via Boomi platform';
  if (name === 'fipullapi') return 'Retrieves finance application data from integrated financial institution';
  if (name.includes('fetchfees')) return 'Fetches fee schedule from integrated financial institution';
  
  // Utility/Helper functions
  if (name.includes('_logtimer')) return 'Logs API response time metrics for monitoring';
  if (name.includes('_checkifthereisalinkedorg')) return 'Verifies if user has linked organisation account';
  
  // Document functions
  if (name === 'getkycdocumentforcompany') return 'Retrieves required KYC document types for company by jurisdiction';
  if (name === 'generatetemplate') return 'Generates document template with populated data fields';
  if (name === 'downloadconverteddocument') return 'Downloads document converted to specified format';
  
  // Cargo/Shipment functions
  if (name === 'createshipmentcontainer') return 'Creates shipment tracking record by MBL or container number';
  if (name === 'createtrackingurl') return 'Generates shipment tracking URL for customer access';
  if (name === 'getshipmentdetails') return 'Retrieves shipment tracking status and container details';
  
  // Company/Organisation search
  if (name.includes('search') && name.includes('company')) return 'Searches company database by name or identifier';
  if (name.includes('search') && name.includes('organisation')) return 'Searches organisation records by criteria';
  
  // Credit scoring/rating
  if (name.includes('credit') && name.includes('score')) return 'Calculates credit risk score for organisation';
  if (name.includes('credit') && name.includes('rating')) return 'Retrieves credit rating from external bureau';
  
  return null;
}

// Analyze code content more deeply
function analyzeCodeContent(code) {
  const patterns = {
    // API/HTTP operations
    isApiCall: /axios|fetch|request-promise|http\./i.test(code),
    httpMethod: code.match(/method:\s*['"]?(get|post|put|delete|patch)['"]?/i)?.[1]?.toLowerCase(),
    apiUrl: code.match(/url:\s*[^,}]+/i)?.[0],
    
    // Database operations
    isDbQuery: /\.(find|create|update|delete|findOne|findAll|query)/i.test(code),
    dbOperation: code.match(/\.(find|create|update|delete|findOne|findAll|query)\(/i)?.[1]?.toLowerCase(),
    
    // Email/Notification
    sendsEmail: /sendmail|nodemailer|smtp|transporter\.send/i.test(code),
    sendsNotification: /notification|alert|push|sms/i.test(code),
    
    // File/Document operations
    readsFile: /fs\.read|createReadStream/i.test(code),
    writesFile: /fs\.write|createWriteStream/i.test(code),
    uploadsFile: /upload|multipart|formdata/i.test(code),
    downloadsFile: /download|attachment/i.test(code),
    
    // Business entities mentioned
    hasFinance: /finance|loan|lending|disbursement/i.test(code),
    hasCredit: /credit.*facility|credit.*limit/i.test(code),
    hasKYC: /kyc|verification|compliance/i.test(code),
    hasShipment: /shipment|cargo|container|mbl|hbl|bill.*lading/i.test(code),
    hasCompany: /company|organisation|organization/i.test(code),
    hasUser: /user|account|profile/i.test(code),
    hasDocument: /document|pdf|file/i.test(code),
    hasPayment: /payment|transaction|disbursement/i.test(code),
    hasApproval: /approval|approve|reject/i.test(code),
    hasSignature: /signature|docusign|esign/i.test(code),
    hasExchangeRate: /exchange.*rate|currency|forex/i.test(code),
    hasScreening: /screening|sanction|pep|watchlist/i.test(code),
    
    // Actions
    creates: /\bcreate|insert|add|register\b/i.test(code),
    updates: /\bupdate|modify|edit|change\b/i.test(code),
    deletes: /\bdelete|remove|destroy\b/i.test(code),
    retrieves: /\bget|fetch|retrieve|find|query|select\b/i.test(code),
    validates: /\bvalidate|verify|check\b/i.test(code),
    calculates: /\bcalculate|compute|sum|total\b/i.test(code),
    sends: /\bsend|email|notify|alert\b/i.test(code),
    approves: /\bapprove|accept|confirm\b/i.test(code),
    rejects: /\breject|decline|deny\b/i.test(code),
    formats: /\bformat|transform|convert|parse\b/i.test(code),
    submits: /\bsubmit|file|apply\b/i.test(code),
  };
  
  return patterns;
}

// Generate smart description based on code analysis
function generateSmartDescription(chunk) {
  const { functionName, code, filePath, layer, id } = chunk;
  const fileName = filePath.split('/').pop();
  const patterns = analyzeCodeContent(code);
  
  // Try function name inference first
  const inferredDesc = inferFromFunctionName(functionName, fileName);
  if (inferredDesc) return inferredDesc;
  
  // Build description from patterns
  let action = '';
  let entity = '';
  let context = '';
  
  // Determine action
  if (patterns.creates) action = 'Creates';
  else if (patterns.updates) action = 'Updates';
  else if (patterns.deletes) action = 'Deletes';
  else if (patterns.retrieves) action = 'Retrieves';
  else if (patterns.validates) action = 'Validates';
  else if (patterns.calculates) action = 'Calculates';
  else if (patterns.sends) action = 'Sends';
  else if (patterns.approves) action = 'Approves';
  else if (patterns.rejects) action = 'Rejects';
  else if (patterns.formats) action = 'Formats';
  else if (patterns.submits) action = 'Submits';
  else if (patterns.uploadsFile) action = 'Uploads';
  else if (patterns.downloadsFile) action = 'Downloads';
  
  // Determine entity
  if (patterns.hasFinance) entity = 'finance application';
  else if (patterns.hasCredit) entity = 'credit facility';
  else if (patterns.hasKYC) entity = 'KYC verification';
  else if (patterns.hasShipment) entity = 'shipment tracking';
  else if (patterns.hasDocument) entity = 'document';
  else if (patterns.hasCompany) entity = 'company';
  else if (patterns.hasUser) entity = 'user';
  else if (patterns.hasPayment) entity = 'payment';
  else if (patterns.hasSignature) entity = 'e-signature';
  else if (patterns.hasExchangeRate) entity = 'exchange rate';
  else if (patterns.hasScreening) entity = 'compliance screening';
  
  // Add context based on layer and operation type
  if (patterns.isApiCall) {
    if (patterns.httpMethod === 'post' && !action) action = 'Sends';
    if (patterns.httpMethod === 'get' && !action) action = 'Retrieves';
    if (patterns.httpMethod === 'put' && !action) action = 'Updates';
    if (patterns.httpMethod === 'delete' && !action) action = 'Deletes';
    context = 'from external system';
  } else if (patterns.isDbQuery) {
    if (patterns.dbOperation === 'create' && !action) action = 'Inserts';
    if (patterns.dbOperation === 'find' && !action) action = 'Queries';
    if (patterns.dbOperation === 'update' && !action) action = 'Updates';
    if (patterns.dbOperation === 'delete' && !action) action = 'Deletes';
    context = layer === 'db_service' ? 'in database' : '';
  }
  
  // Combine into description
  if (action && entity) {
    return `${action} ${entity} ${context}`.trim().replace(/\s+/g, ' ');
  }
  
  // Still couldn't generate, return null to use fallback
  return null;
}

// Main description generation function with all logic
function generateDescription(chunk) {
  const { id, functionName, layer, code, filePath } = chunk;
  const fileName = filePath.split('/').pop().replace('.js', '');
  
  // === Try smart analysis first ===
  const smartDesc = generateSmartDescription(chunk);
  if (smartDesc && smartDesc.length <= 100) return smartDesc;
  
  // === Specific file/function mappings (keep existing comprehensive mappings) ===
  
  // KYC Company Service
  if (id.includes('kyc_company_service.js')) {
    if (id.includes('#preamble')) return 'Configures KYC API endpoints and tenant-specific service provider codes';
    if (functionName === 'headers') return 'Constructs authorization headers for KYC API requests with tenant-specific configuration';
    if (functionName === 'getKYCQuestionForDFSACompany') return 'Retrieves KYC compliance questions for DFSA-regulated companies by jurisdiction';
    if (functionName === 'getAllKYCQuestionForCompany') return 'Fetches all KYC compliance questions required for company verification';
    if (functionName === 'getCompanyOverviewDetailsFromMawani') return 'Retrieves company overview and registration details from Mawani external system';
    if (functionName === 'putCompanyOnHold') return 'Places company KYC verification request on hold with reviewer comment';
    if (functionName === 'getCompanyRequestDetailsFromMawani') return 'Fetches company KYC request details from Mawani client management system';
  }
  
  // Feedback
  if (id.includes('feedback.js')) {
    if (id.includes('#preamble')) return 'Configures user feedback widget integration API endpoints';
    if (functionName === 'generateIntegrationToken') return 'Generates authentication token for feedback widget integration';
    if (functionName === 'getWidget') return 'Retrieves feedback widget configuration and settings';
    if (functionName === 'submitFeedback') return 'Submits user feedback and support requests to collection system';
  }
  
  // Exchange Rates
  if (id.includes('exchange_rates_api.js')) {
    if (id.includes('#preamble')) return 'Configures currency exchange rate API integration endpoints';
    if (functionName === 'sameCurrency') return 'Checks if two currencies match without conversion needed';
    if (functionName === 'getExchangeRatesData') return 'Fetches current exchange rates for currency conversion calculations';
    if (functionName === 'getCurrenciesMapping') return 'Retrieves currency code mappings for rate lookups';
    if (functionName === 'getExchangeRateForDate') return 'Fetches historical exchange rate for specific date and currency pair';
  }
  
  // Email API
  if (id.includes('email_api.js')) {
    if (id.includes('#preamble')) return 'Configures email notification service API endpoints and authentication';
    if (functionName === 'publicHeaders') return 'Constructs public API headers for email service requests';
    if (functionName === 'headers') return 'Constructs authenticated headers for email service API calls';
    if (functionName === '_fetchNsspAuthToken') return 'Retrieves authentication token for NSSP email service';
    if (functionName === 'sendEmailByCategoryAndEvent') return 'Sends templated email based on category and event type';
    if (functionName === 'sendEmail') return 'Sends transactional email to recipients with content';
  }
  
  // Document Service (External)
  if (id.includes('external_services/document_service.js')) {
    if (id.includes('#preamble')) return 'Configures document management service API endpoints';
    if (functionName === 'headers') return 'Constructs authorization headers for document service requests';
    if (functionName === 'uploadDocuments') return 'Uploads documents to external document storage service';
    if (functionName === 'uploadDocumentStream') return 'Streams document file upload to storage service';
    if (functionName === 'downloadDocuments') return 'Downloads document file from storage service';
    if (functionName === 'downloadDocumentsAsArrayBuffer') return 'Downloads document as binary array buffer';
    if (functionName === 'uploadDocumentsForDocusign') return 'Uploads document to storage for DocuSign signing workflow';
    if (functionName === 'getKYCDocumentForCompany') return 'Retrieves required KYC document types for company by jurisdiction';
    if (functionName === 'generateTemplate') return 'Generates document template with populated data fields';
    if (functionName === 'downloadConvertedDocument') return 'Downloads document converted to specified format';
  }
  
  // Cargo Flow API
  if (id.includes('cargo_flow_api.js')) {
    if (id.includes('#preamble')) return 'Configures CargoFlow shipment tracking API integration';
    if (functionName === 'createShipmentContainer') return 'Creates shipment tracking record by MBL or container number';
    if (functionName === 'createTrackingUrl') return 'Generates shipment tracking URL for customer access';
    if (functionName === 'getShipmentDetails') return 'Retrieves shipment tracking status and container details';
  }
  
  // BVD API
  if (id.includes('bvd_api.js')) {
    if (id.includes('#preamble')) return 'Configures Bureau van Dijk company data API integration';
  }
  
  // Boomi API
  if (id.includes('boomi_api.js')) {
    if (id.includes('#preamble')) return 'Configures Boomi integration platform API endpoints';
    if (functionName === '_formatDirectorOrSMDetails') return 'Formats company director details for Boomi integration';
    if (functionName === '_formatBODetails') return 'Formats beneficial owner information for Boomi submission';
    if (functionName === '_formatShareholderDetails') return 'Formats shareholder details for Boomi platform sync';
    if (functionName === '_formatBoomiResponse') return 'Formats API response from Boomi integration platform';
    if (functionName === '_saveDumpData') return 'Persists raw Boomi integration data for audit trail';
    if (functionName === 'fiIntegration') return 'Integrates financial institution data via Boomi platform';
    if (functionName === 'fiPullApi') return 'Retrieves finance application from integrated financial institution';
    if (functionName === 'fetchFeesFromIntegratedFI') return 'Fetches fee schedule from integrated financial institution';
  }
  
  // AECB Integration
  if (id.includes('aecb_integration.js')) {
    if (id.includes('#preamble')) return 'Configures AECB credit bureau API integration';
  }
  
  // Accuity
  if (id.includes('accuity.js')) {
    if (id.includes('#preamble')) return 'Configures Accuity sanctions and PEP screening API';
  }
  
  // Auth API Service
  if (id.includes('auth_api_service.js')) {
    if (id.includes('#preamble')) return 'Configures authentication service API integration';
    if (functionName === 'authenticate') return 'Authenticates user credentials and returns JWT token';
    if (functionName === 'logout') return 'Logs out user and invalidates session token';
  }
  
  // Auth API
  if (id.includes('auth_api.js')) {
    if (id.includes('#preamble')) return 'Configures authentication service API endpoints';
    if (functionName === 'headers') return 'Constructs authorization headers for authentication requests';
    if (functionName === 'formRangeHeader') return 'Constructs pagination range header for API requests';
    if (functionName === '_logTimerForExternalApi') return 'Logs API response time metrics for monitoring';
    if (functionName === '_checkIfThereIsALinkedOrg') return 'Verifies if user has linked organisation account';
    if (functionName === 'authenticate') return 'Authenticates user credentials via external auth service';
    if (functionName === 'logout') return 'Logs out user and revokes authentication session';
  }
  
  // Compliance Screening
  if (id.includes('compliance_screening/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for compliance screening business logic';
  }
  
  // Credit Facility
  if (id.includes('credit_facility/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for credit facility business logic';
  }
  
  // CRM
  if (id.includes('crm/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for CRM integration business logic';
  }
  
  // Document Service (Internal)
  if (id.includes('document_service/index.js')) {
    if (id.includes('#preamble')) return 'Imports dependencies for document management business logic';
  }
  
  // File Storage
  if (id.includes('file_storage_service.js')) {
    if (id.includes('#preamble')) return 'Configures cloud file storage service integration';
  }
  
  // DocuSign
  if (id.includes('docusign_service')) {
    if (id.includes('#preamble')) {
      if (id.includes('helpers')) return 'Imports DocuSign helper utilities for envelope management';
      if (id.includes('buyer_envelope')) return 'Imports dependencies for buyer DocuSign envelope creation';
      if (id.includes('seller_envelope')) return 'Imports dependencies for seller DocuSign envelope creation';
      if (id.includes('index.js')) return 'Imports dependencies for DocuSign e-signature integration';
      return 'Configures DocuSign e-signature API integration';
    }
  }
  
  // Database Services
  if (layer === 'db_service') {
    const entityName = fileName.replace('_db_service', '').replace('db_service/', '').replace(/_/g, ' ');
    if (id.includes('#preamble')) return `Imports database models for ${entityName} data access`;
  }
  
  // === Generic fallbacks based on layer ===
  const entityName = fileName.replace(/_service|_api/g, '').replace(/_/g, ' ');
  
  if (id.includes('#preamble')) {
    if (layer === 'service') return `Configures ${entityName} service dependencies`;
    if (layer === 'config') return `Defines ${entityName} configuration settings`;
    return `Imports dependencies for ${entityName}`;
  }
  
  if (functionName) {
    return `Handles ${functionName} operation for ${entityName}`;
  }
  
  return `Provides ${entityName} functionality`;
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

// Count how many still have generic "Implements" or "Provides"
const genericCount = descriptions.filter(d => 
  d.description.includes('Implements') || 
  (d.description.includes('Provides') && d.description.includes('functionality'))
).length;
console.log(`Generic descriptions: ${genericCount}`);

// Write output file
const outputPath = path.join(__dirname, 'cursor-batches', 'descriptions-part-2.json');
fs.writeFileSync(outputPath, JSON.stringify(descriptions, null, 2));

console.log(`✓ Descriptions written to ${outputPath}`);
console.log(`✓ Total chunks processed: ${descriptions.length}`);
