const fs = require('fs');
const path = require('path');

// Read the chunks file
const chunksPath = path.join(__dirname, 'cursor-batches', 'chunks-part-2.json');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

console.log(`Processing ${chunks.length} chunks...`);

// Function to generate description based on chunk metadata and code
function generateDescription(chunk) {
  const { id, functionName, layer, code, filePath } = chunk;
  
  // Extract file name for context
  const fileName = filePath.split('/').pop().replace('.js', '');
  
  // Analyze code patterns and generate specific descriptions
  const codeLower = code.toLowerCase();
  
  // KYC Company Service
  if (id.includes('kyc_company_service.js')) {
    if (functionName === 'headers') return 'Constructs authorization headers for KYC API requests with tenant-specific configuration';
    if (functionName === 'getKYCQuestionForDFSACompany') return 'Retrieves KYC compliance questions for DFSA-regulated companies by jurisdiction';
    if (functionName === 'getAllKYCQuestionForCompany') return 'Fetches all KYC compliance questions required for company verification';
    if (functionName === 'getCompanyOverviewDetailsFromMawani') return 'Retrieves company overview and registration details from Mawani external system';
    if (functionName === 'putCompanyOnHold') return 'Places company KYC verification request on hold with reviewer comment';
    if (functionName === 'rejectKYCRequest') return 'Rejects company KYC verification request with rejection reason and comment';
    if (functionName === 'approveKYCRequest') return 'Approves company KYC verification request and activates company profile';
    if (functionName === 'sendBackKYCRequest') return 'Returns company KYC request to applicant for corrections with feedback comments';
    if (functionName === 'getKYCClientType') return 'Retrieves available KYC client type classifications for company registration';
    if (functionName === 'getCompanyDetails') return 'Fetches comprehensive company details including KYC status and documentation';
    if (functionName === 'getCompanyDetailsForCayman') return 'Retrieves company information for Cayman Islands jurisdiction-specific requirements';
    if (functionName === 'getCompanyDetailsWithCompanyReference') return 'Fetches company profile using company reference ID from external system';
    if (functionName === 'createCompany') return 'Creates new company registration with KYC details in external system';
    if (functionName === 'addUserInCompany') return 'Associates user with company profile and assigns role permissions';
    if (functionName === 'updateCompany') return 'Updates company registration information and KYC documentation';
    if (functionName === 'getCompanyOnBoardingStages') return 'Retrieves company onboarding workflow stages and completion status';
    if (functionName === 'getAllClientTypesForCompany') return 'Fetches all available client type classifications for company categorization';
    if (functionName === 'getServiceProviderCodeList') return 'Retrieves list of valid service provider codes for company registration';
    if (functionName === 'getCountryList') return 'Fetches available countries for company jurisdiction and incorporation';
    if (functionName === 'getCurrencyList') return 'Retrieves supported currencies for company financial operations';
    if (functionName === 'getKYCDocument') return 'Downloads KYC compliance documents for company verification review';
    if (functionName === 'getAllKYCDocument') return 'Retrieves all uploaded KYC documents for company compliance verification';
    if (functionName === 'uploadKYCDocument') return 'Uploads company KYC compliance documents for verification review';
    if (functionName === 'submitKYCDocuments') return 'Submits company KYC documentation package for compliance team review';
    if (functionName === 'deleteKYCDocument') return 'Removes uploaded KYC document from company verification package';
    if (functionName === 'downloadKYCDocument') return 'Downloads KYC document file from company compliance records';
    if (id.includes('#preamble')) return 'Configures KYC API endpoints and tenant-specific service provider codes';
  }
  
  // KYC Individual Service
  if (id.includes('kyc_individual_service.js')) {
    if (functionName === 'headers') return 'Constructs authorization headers for individual KYC API requests with tenant context';
    if (functionName === 'getIndividualDetails') return 'Retrieves individual user KYC profile and verification status';
    if (functionName === 'createIndividual') return 'Creates new individual user KYC profile with personal details';
    if (functionName === 'updateIndividual') return 'Updates individual user KYC information and contact details';
    if (functionName === 'getKYCDocument') return 'Downloads individual KYC identity documents for verification review';
    if (functionName === 'getAllKYCDocument') return 'Retrieves all uploaded KYC documents for individual verification';
    if (functionName === 'uploadKYCDocument') return 'Uploads individual identity documents for KYC compliance verification';
    if (functionName === 'submitKYCDocuments') return 'Submits individual KYC documentation for compliance team review';
    if (functionName === 'deleteKYCDocument') return 'Removes uploaded KYC document from individual verification package';
    if (functionName === 'downloadKYCDocument') return 'Downloads KYC document file from individual compliance records';
    if (functionName === 'rejectKYCRequest') return 'Rejects individual KYC verification with rejection reason';
    if (functionName === 'approveKYCRequest') return 'Approves individual KYC verification and activates user account';
    if (functionName === 'sendBackKYCRequest') return 'Returns individual KYC request to user for document corrections';
    if (functionName === 'getIndividualOnBoardingStages') return 'Retrieves individual onboarding workflow stages and completion progress';
    if (id.includes('#preamble')) return 'Configures individual KYC API endpoints and authentication parameters';
  }
  
  // Notification Service
  if (id.includes('notification_service.js')) {
    if (functionName === 'headers') return 'Constructs authorization headers for notification service API requests';
    if (functionName === 'sendNotification') return 'Sends notification message to users via configured delivery channels';
    if (functionName === 'getNotificationTemplates') return 'Retrieves available notification message templates by category';
    if (functionName === 'getNotificationTemplate') return 'Fetches specific notification template content by template ID';
    if (id.includes('#preamble')) return 'Configures notification service API endpoints and authentication settings';
  }
  
  // Email Service
  if (id.includes('email_service.js')) {
    if (functionName === 'sendEmail') return 'Sends transactional email messages to users with template rendering';
    if (functionName === 'sendEmailWithAttachment') return 'Sends email with file attachments to recipients';
    if (id.includes('#preamble')) return 'Configures SMTP email service connection and sender credentials';
  }
  
  // Organisation Service
  if (id.includes('organisation_service.js') && !id.includes('db_service')) {
    if (functionName === 'createOrganisation') return 'Creates new organisation entity with registration details and admin user';
    if (functionName === 'updateOrganisation') return 'Updates organisation profile information and business details';
    if (functionName === 'getOrganisation') return 'Retrieves organisation profile with associated users and permissions';
    if (functionName === 'getOrganisations') return 'Fetches list of organisations with filtering and pagination';
    if (functionName === 'deleteOrganisation') return 'Deactivates organisation account and revokes user access';
    if (functionName === 'addUserToOrganisation') return 'Associates user with organisation and assigns role permissions';
    if (functionName === 'removeUserFromOrganisation') return 'Removes user association and permissions from organisation';
    if (functionName === 'getOrganisationUsers') return 'Retrieves all users associated with organisation and their roles';
    if (id.includes('#preamble')) return 'Imports dependencies for organisation business logic processing';
  }
  
  // Organisation DB Service
  if (id.includes('organisation_db_service.js')) {
    if (functionName === 'createOrganisation') return 'Inserts new organisation record into database with registration details';
    if (functionName === 'updateOrganisation') return 'Updates organisation database record with modified information';
    if (functionName === 'getOrganisation') return 'Queries organisation data from database by organisation ID';
    if (functionName === 'getOrganisations') return 'Retrieves organisation records from database with filters';
    if (functionName === 'deleteOrganisation') return 'Marks organisation record as inactive in database';
    if (functionName === 'getOrganisationByCompanyReferenceId') return 'Queries organisation data by external company reference identifier';
    if (id.includes('#preamble')) return 'Imports database models for organisation data access operations';
  }
  
  // Finance Application Service
  if (id.includes('finance_application_service.js') && !id.includes('db_service')) {
    if (functionName === 'createFinanceApplication') return 'Creates new trade finance application request with shipment details';
    if (functionName === 'updateFinanceApplication') return 'Updates finance application information and supporting documentation';
    if (functionName === 'getFinanceApplication') return 'Retrieves finance application details with approval status and terms';
    if (functionName === 'getFinanceApplications') return 'Fetches list of finance applications with filtering options';
    if (functionName === 'submitFinanceApplication') return 'Submits finance application for credit review and approval workflow';
    if (functionName === 'approveFinanceApplication') return 'Approves finance application and initiates funding disbursement process';
    if (functionName === 'rejectFinanceApplication') return 'Rejects finance application with reason and notifies applicant';
    if (functionName === 'calculateFinanceTerms') return 'Calculates interest rates and repayment terms for finance application';
    if (functionName === 'getFinanceApplicationStatus') return 'Retrieves current approval workflow status of finance application';
    if (id.includes('#preamble')) return 'Imports dependencies for finance application business logic processing';
  }
  
  // Finance Application DB Service
  if (id.includes('finance_application_db_service.js')) {
    if (functionName === 'createFinanceApplication') return 'Inserts new finance application record into database';
    if (functionName === 'updateFinanceApplication') return 'Updates finance application database record with changes';
    if (functionName === 'getFinanceApplication') return 'Queries finance application data from database by ID';
    if (functionName === 'getFinanceApplications') return 'Retrieves finance application records with filtering criteria';
    if (functionName === 'getFinanceApplicationsByOrganisation') return 'Fetches all finance applications for specific organisation';
    if (id.includes('#preamble')) return 'Imports database models for finance application data access';
  }
  
  // Credit Facility Service
  if (id.includes('credit_facility_service.js') && !id.includes('db_service')) {
    if (functionName === 'createCreditFacility') return 'Creates new credit facility agreement with approved limit and terms';
    if (functionName === 'updateCreditFacility') return 'Updates credit facility terms and available credit limit';
    if (functionName === 'getCreditFacility') return 'Retrieves credit facility details with utilization and availability';
    if (functionName === 'getCreditFacilities') return 'Fetches list of credit facilities for organisation';
    if (functionName === 'approveCreditFacility') return 'Approves credit facility request and activates credit line';
    if (functionName === 'rejectCreditFacility') return 'Rejects credit facility application with reason';
    if (functionName === 'calculateAvailableCredit') return 'Calculates remaining available credit from facility limit and utilization';
    if (functionName === 'addCounterParty') return 'Associates approved counter-party organisation with credit facility';
    if (functionName === 'removeCounterParty') return 'Removes counter-party association from credit facility';
    if (id.includes('#preamble')) return 'Imports dependencies for credit facility business logic processing';
  }
  
  // Credit Facility DB Service
  if (id.includes('credit_facility_db_service.js')) {
    if (functionName === 'createCreditFacility') return 'Inserts new credit facility record into database';
    if (functionName === 'updateCreditFacility') return 'Updates credit facility database record with changes';
    if (functionName === 'getCreditFacility') return 'Queries credit facility data from database by ID';
    if (functionName === 'getCreditFacilities') return 'Retrieves credit facility records with filters';
    if (functionName === 'getCreditFacilityByOrganisation') return 'Fetches credit facilities for specific organisation ID';
    if (id.includes('#preamble')) return 'Imports database models for credit facility data access';
  }
  
  // User Service
  if (id.includes('user_service.js') && !id.includes('db_service')) {
    if (functionName === 'createUser') return 'Creates new user account with authentication credentials and profile';
    if (functionName === 'updateUser') return 'Updates user profile information and account settings';
    if (functionName === 'getUser') return 'Retrieves user account details with roles and permissions';
    if (functionName === 'getUsers') return 'Fetches list of users with filtering and pagination';
    if (functionName === 'deleteUser') return 'Deactivates user account and revokes authentication access';
    if (functionName === 'resetPassword') return 'Resets user password and sends reset link via email';
    if (functionName === 'changePassword') return 'Updates user password with validation of current password';
    if (functionName === 'verifyEmail') return 'Verifies user email address via confirmation token';
    if (id.includes('#preamble')) return 'Imports dependencies for user management business logic';
  }
  
  // User DB Service
  if (id.includes('user_db_service.js')) {
    if (functionName === 'createUser') return 'Inserts new user record into database with credentials';
    if (functionName === 'updateUser') return 'Updates user database record with modified information';
    if (functionName === 'getUser') return 'Queries user data from database by user ID';
    if (functionName === 'getUserByEmail') return 'Retrieves user record from database by email address';
    if (functionName === 'getUsers') return 'Fetches user records from database with filtering';
    if (functionName === 'deleteUser') return 'Marks user record as inactive in database';
    if (id.includes('#preamble')) return 'Imports database models for user data access operations';
  }
  
  // Auth Service
  if (id.includes('auth_service.js')) {
    if (functionName === 'login') return 'Authenticates user credentials and returns JWT access token';
    if (functionName === 'logout') return 'Invalidates user session and revokes authentication tokens';
    if (functionName === 'refreshToken') return 'Refreshes expired JWT access token using refresh token';
    if (functionName === 'verifyToken') return 'Validates JWT token signature and expiration';
    if (functionName === 'generateToken') return 'Generates new JWT access token with user claims';
    if (id.includes('#preamble')) return 'Imports authentication dependencies and JWT configuration';
  }
  
  // Middleware
  if (layer === 'middleware') {
    if (id.includes('auth_middleware')) return 'Authenticates JWT token and attaches user context to request';
    if (id.includes('role_middleware')) return 'Validates user role permissions for protected endpoints';
    if (id.includes('validation_middleware')) return 'Validates request payload against schema rules';
    if (id.includes('error_middleware')) return 'Handles application errors and formats error responses';
    if (id.includes('rate_limit')) return 'Rate limiting middleware restricting requests per time window';
    if (id.includes('user_object')) {
      if (functionName === 'userToken') return 'Extracts JWT authentication token from request headers';
      if (functionName === 'getTenantCode') return 'Retrieves tenant identifier from user context';
    }
  }
  
  // Routes
  if (layer === 'route') {
    if (id.includes('organisation_routes')) return 'Route definitions for organisation management endpoints';
    if (id.includes('finance_application_routes')) return 'Route definitions for finance application endpoints';
    if (id.includes('credit_facility_routes')) return 'Route definitions for credit facility management endpoints';
    if (id.includes('user_routes')) return 'Route definitions for user management endpoints';
    if (id.includes('auth_routes')) return 'Route definitions for authentication endpoints';
  }
  
  // Schemas
  if (layer === 'schema') {
    if (id.includes('organisation_schema')) return 'Validates organisation creation and update request payloads';
    if (id.includes('finance_application_schema')) return 'Validates finance application request payload structure';
    if (id.includes('credit_facility_schema')) return 'Validates credit facility request payload structure';
    if (id.includes('user_schema')) return 'Validates user registration and profile update payloads';
    if (id.includes('auth_schema')) return 'Validates authentication request credentials payload';
  }
  
  // Config
  if (layer === 'config') {
    if (id.includes('database')) return 'Database connection configuration and pool settings';
    if (id.includes('auth_service')) return 'External authentication service API endpoints and credentials';
    if (id.includes('jwt')) return 'JWT token signing configuration and secret keys';
    if (id.includes('email')) return 'Email service SMTP configuration and templates';
  }
  
  // Generic fallback based on layer and file patterns
  if (layer === 'controller') {
    if (codeLower.includes('create')) return `Handles creation request for ${fileName.replace('_controller', '')} entity`;
    if (codeLower.includes('update')) return `Handles update request for ${fileName.replace('_controller', '')} entity`;
    if (codeLower.includes('delete')) return `Handles deletion request for ${fileName.replace('_controller', '')} entity`;
    if (codeLower.includes('get') || codeLower.includes('fetch')) return `Handles retrieval request for ${fileName.replace('_controller', '')} data`;
    return `Handles request for ${fileName.replace('_controller', '')} operations`;
  }
  
  if (layer === 'service') {
    if (codeLower.includes('calculate')) return `Calculates ${fileName.replace('_service', '')} business values`;
    if (codeLower.includes('validate')) return `Validates ${fileName.replace('_service', '')} business rules`;
    if (codeLower.includes('process')) return `Processes ${fileName.replace('_service', '')} business logic`;
    return `Handles ${fileName.replace('_service', '')} business logic processing`;
  }
  
  if (layer === 'db_service') {
    if (codeLower.includes('create') || codeLower.includes('insert')) return `Inserts ${fileName.replace('_db_service', '')} records into database`;
    if (codeLower.includes('update')) return `Updates ${fileName.replace('_db_service', '')} records in database`;
    if (codeLower.includes('delete')) return `Deletes ${fileName.replace('_db_service', '')} records from database`;
    if (codeLower.includes('get') || codeLower.includes('find') || codeLower.includes('query')) return `Queries ${fileName.replace('_db_service', '')} data from database`;
    return `Manages ${fileName.replace('_db_service', '')} database operations`;
  }
  
  // Ultimate fallback
  return `Implements ${fileName} functionality for system operations`;
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
