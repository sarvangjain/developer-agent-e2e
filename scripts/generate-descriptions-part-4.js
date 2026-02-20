const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'cursor-batches/chunks-part-4.json');
const outputPath = path.join(__dirname, 'cursor-batches/descriptions-part-4.json');

// Read the input file
const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log(`Processing ${chunks.length} chunks...`);

// Generate description for each chunk
const descriptions = chunks.map((chunk, index) => {
  if (index % 100 === 0) {
    console.log(`Processing chunk ${index + 1}/${chunks.length}...`);
  }
  
  const { id } = chunk;
  const description = generateDescription(chunk);
  
  return { id, description };
});

// Write output
fs.writeFileSync(outputPath, JSON.stringify(descriptions, null, 2), 'utf8');
console.log(`\nWrote ${descriptions.length} descriptions to ${outputPath}`);

function generateDescription(chunk) {
  const { filePath, functionName, module, layer, code } = chunk;
  
  // Extract key information from code
  const fileName = path.basename(filePath, path.extname(filePath));
  const codeText = code.toLowerCase();
  const funcName = (functionName || '').toLowerCase();
  
  // Helper functions
  const hasEntity = (entity) => codeText.includes(entity.toLowerCase());
  const funcIncludes = (text) => funcName.includes(text.toLowerCase());
  const hasPattern = (pattern) => code.match(pattern) !== null;
  
  // Detect key business entities from code
  const entities = {
    insurance: hasEntity('insurance'),
    creditFacility: hasEntity('credit') && (hasEntity('facility') || hasEntity('limit')),
    financeApplication: hasEntity('finance') && hasEntity('application'),
    organisation: hasEntity('organisation') || hasEntity('organization'),
    user: hasEntity('user') && !funcName.includes('userid'),
    document: hasEntity('document'),
    kyc: hasEntity('kyc'),
    invoice: hasEntity('invoice'),
    transaction: hasEntity('transaction'),
    payment: hasEntity('payment'),
    counterParty: hasEntity('counter') && hasEntity('party'),
    report: hasEntity('report'),
    notification: hasEntity('notification') || hasEntity('email'),
    interest: hasEntity('interest'),
    security: hasEntity('security'),
    compliance: hasEntity('compliance'),
    audit: hasEntity('audit'),
    workflow: hasEntity('workflow'),
    approval: hasEntity('approval'),
    collateral: hasEntity('collateral'),
    guarantee: hasEntity('guarantee'),
    disbursement: hasEntity('disbursement'),
    repayment: hasEntity('repayment')
  };
  
  // Controller layer
  if (layer === 'controller') {
    if (entities.insurance) {
      if (funcIncludes('getall') || funcIncludes('list')) return 'Handles request to retrieve all insurances for user';
      if (funcIncludes('get') && funcIncludes('detail')) return 'Handles request to fetch insurance policy details';
      if (funcIncludes('create') || funcIncludes('add')) return 'Handles request to create new insurance policy';
      if (funcIncludes('update')) return 'Handles request to update insurance policy details';
      if (funcIncludes('renew')) return 'Handles request to renew insurance policy';
      if (funcIncludes('delete')) return 'Handles request to delete insurance policy';
      return 'Handles insurance management request';
    }
    if (entities.creditFacility) {
      if (funcIncludes('getall') || funcIncludes('list')) return 'Handles request to retrieve all credit facilities';
      if (funcIncludes('get') && funcIncludes('detail')) return 'Handles request to fetch credit facility details';
      if (funcIncludes('create')) return 'Handles request to create credit facility';
      if (funcIncludes('update')) return 'Handles request to update credit facility';
      if (funcIncludes('approve')) return 'Handles request to approve credit facility application';
      if (funcIncludes('reject')) return 'Handles request to reject credit facility application';
      if (funcIncludes('counter') || entities.counterParty) return 'Handles request for credit facility counter-party management';
      return 'Handles credit facility management request';
    }
    if (entities.financeApplication) {
      if (funcIncludes('submit') || funcIncludes('create')) return 'Handles request to submit finance application';
      if (funcIncludes('approve')) return 'Handles request to approve finance application';
      if (funcIncludes('reject')) return 'Handles request to reject finance application';
      if (funcIncludes('get')) return 'Handles request to retrieve finance application';
      return 'Handles finance application processing request';
    }
    return `Handles ${fileName} request processing`;
  }
  
  // Service layer - business logic
  if (layer === 'service') {
    if (entities.insurance) {
      if (funcIncludes('getall') || funcIncludes('list')) return 'Retrieves all insurance policies with filtering and pagination';
      if (funcIncludes('get') && funcIncludes('detail')) return 'Fetches detailed insurance policy terms and linked facilities';
      if (funcIncludes('getcf') || funcIncludes('facility')) return 'Retrieves credit facilities eligible for insurance coverage';
      if (funcIncludes('update')) return 'Updates insurance policy details and generates history';
      if (funcIncludes('renew')) return 'Renews insurance policy with new terms';
      if (funcIncludes('create')) return 'Creates new insurance policy for credit facility';
      if (funcIncludes('expiry') || funcIncludes('notification')) return 'Sends insurance expiry notification emails to stakeholders';
      if (funcIncludes('counterparty') || funcIncludes('counter')) return 'Retrieves counter-parties applicable for insurance by facility';
      return 'Processes insurance management business logic';
    }
    if (entities.creditFacility) {
      if (funcIncludes('create')) return 'Creates credit facility with validation and limit checks';
      if (funcIncludes('update')) return 'Updates credit facility and recalculates exposure limits';
      if (funcIncludes('calculate') || funcIncludes('compute')) return 'Calculates credit facility utilization and available limits';
      if (funcIncludes('validate')) return 'Validates credit facility against business rules';
      if (funcIncludes('approve')) return 'Approves credit facility and triggers disbursement workflow';
      if (funcIncludes('counter') || entities.counterParty) return 'Manages counter-party allocation for credit facility';
      if (funcIncludes('getall') || funcIncludes('list')) return 'Retrieves credit facilities with filters and pagination';
      if (funcIncludes('get')) return 'Fetches credit facility details with linked entities';
      return 'Processes credit facility business logic';
    }
    if (entities.financeApplication) {
      if (funcIncludes('submit') || funcIncludes('create')) return 'Processes finance application submission with validation';
      if (funcIncludes('approve')) return 'Approves finance application and triggers disbursement';
      if (funcIncludes('reject')) return 'Rejects finance application with notification';
      if (funcIncludes('calculate')) return 'Calculates finance application eligibility and pricing';
      if (funcIncludes('validate')) return 'Validates finance application against credit policy';
      if (funcIncludes('get')) return 'Retrieves finance application with supporting documents';
      return 'Processes finance application business logic';
    }
    if (entities.disbursement) {
      if (funcIncludes('create') || funcIncludes('initiate')) return 'Initiates disbursement for approved finance';
      if (funcIncludes('approve')) return 'Approves disbursement request for payment';
      return 'Processes disbursement business logic';
    }
    if (entities.repayment) {
      if (funcIncludes('calculate')) return 'Calculates repayment schedule and outstanding amounts';
      if (funcIncludes('process')) return 'Processes repayment transaction and updates balances';
      return 'Processes repayment business logic';
    }
    if (entities.interest) {
      if (funcIncludes('calculate') || funcIncludes('compute')) return 'Calculates interest accrual for finance transactions';
      if (funcIncludes('apply')) return 'Applies interest charges to outstanding balances';
      return 'Processes interest calculation business logic';
    }
    if (entities.organisation) {
      if (funcIncludes('create')) return 'Creates organisation with KYC validation';
      if (funcIncludes('update')) return 'Updates organisation details and credit profile';
      if (funcIncludes('validate')) return 'Validates organisation against compliance rules';
      if (funcIncludes('get')) return 'Retrieves organisation details with credit history';
      return 'Processes organisation management business logic';
    }
    if (entities.user) {
      if (funcIncludes('authenticate') || funcIncludes('login')) return 'Authenticates user credentials and generates access token';
      if (funcIncludes('create') || funcIncludes('register')) return 'Creates user account with role assignment';
      if (funcIncludes('update')) return 'Updates user profile and permissions';
      if (funcIncludes('validate')) return 'Validates user permissions for resource access';
      return 'Processes user management business logic';
    }
    if (entities.notification) {
      if (funcIncludes('send')) return 'Sends email notification to users and stakeholders';
      if (funcIncludes('expiry')) return 'Sends expiry reminder notifications';
      return 'Processes notification delivery business logic';
    }
    if (entities.document) {
      if (funcIncludes('upload')) return 'Processes document upload with virus scan';
      if (funcIncludes('validate')) return 'Validates document format and completeness';
      if (funcIncludes('get')) return 'Retrieves document with access control check';
      return 'Processes document management business logic';
    }
    if (entities.kyc) {
      if (funcIncludes('verify') || funcIncludes('validate')) return 'Validates KYC documents for compliance';
      if (funcIncludes('submit')) return 'Submits KYC for verification';
      return 'Processes KYC verification business logic';
    }
    if (entities.approval) {
      if (funcIncludes('submit')) return 'Submits request for approval workflow';
      if (funcIncludes('approve')) return 'Approves request and updates status';
      if (funcIncludes('reject')) return 'Rejects request with comments';
      return 'Processes approval workflow business logic';
    }
    if (entities.report) {
      if (funcIncludes('generate')) return 'Generates business report with analytics';
      return 'Processes report generation business logic';
    }
    return `Processes ${fileName} business logic`;
  }
  
  // Database service layer
  if (layer === 'db_service') {
    if (entities.insurance) {
      if (funcIncludes('create') || funcIncludes('insert')) return 'Inserts insurance policy data into database';
      if (funcIncludes('update')) return 'Updates insurance policy records in database';
      if (funcIncludes('get') || funcIncludes('fetch')) return 'Queries insurance policy data from database';
      if (funcIncludes('delete')) return 'Deletes insurance policy records from database';
      return 'Manages insurance database operations';
    }
    if (entities.creditFacility) {
      if (funcIncludes('create') || funcIncludes('insert')) return 'Inserts credit facility data into database';
      if (funcIncludes('update')) return 'Updates credit facility records in database';
      if (funcIncludes('get') || funcIncludes('fetch')) return 'Queries credit facility data from database';
      if (funcIncludes('delete')) return 'Deletes credit facility records from database';
      return 'Manages credit facility database operations';
    }
    if (entities.financeApplication) {
      if (funcIncludes('create') || funcIncludes('insert')) return 'Inserts finance application into database';
      if (funcIncludes('update')) return 'Updates finance application status in database';
      if (funcIncludes('get') || funcIncludes('fetch')) return 'Queries finance application from database';
      return 'Manages finance application database operations';
    }
    if (entities.organisation) {
      if (funcIncludes('create')) return 'Inserts organisation data into database';
      if (funcIncludes('update')) return 'Updates organisation records in database';
      if (funcIncludes('get')) return 'Queries organisation data from database';
      return 'Manages organisation database operations';
    }
    if (entities.user) {
      if (funcIncludes('create')) return 'Inserts user account into database';
      if (funcIncludes('update')) return 'Updates user profile in database';
      if (funcIncludes('get')) return 'Queries user data from database';
      return 'Manages user database operations';
    }
    if (entities.transaction) {
      if (funcIncludes('create')) return 'Inserts transaction record into database';
      if (funcIncludes('get')) return 'Queries transaction history from database';
      return 'Manages transaction database operations';
    }
    return `Manages ${fileName} database operations`;
  }
  
  // Middleware layer
  if (layer === 'middleware') {
    if (hasEntity('auth') || funcIncludes('auth')) return 'Authentication middleware verifying user credentials';
    if (hasEntity('rate') && hasEntity('limit')) return 'Rate limiting middleware restricting requests per time window';
    if (hasEntity('validate') || funcIncludes('validate')) return 'Validation middleware checking request payload structure';
    if (hasEntity('error') || funcIncludes('error')) return 'Error handling middleware formatting error responses';
    if (hasEntity('log') || funcIncludes('log')) return 'Logging middleware tracking request activity';
    if (hasEntity('cors')) return 'CORS middleware handling cross-origin requests';
    if (hasEntity('permission') || hasEntity('role') || hasEntity('authorization')) return 'Authorization middleware checking user permissions';
    if (hasEntity('audit')) return 'Audit middleware logging user actions';
    return `${functionName || fileName} middleware for request pipeline`;
  }
  
  // Route layer
  if (layer === 'route') {
    if (entities.insurance) return 'Route definitions for insurance management endpoints';
    if (entities.creditFacility) return 'Route definitions for credit facility endpoints';
    if (entities.financeApplication) return 'Route definitions for finance application endpoints';
    if (entities.organisation) return 'Route definitions for organisation endpoints';
    if (entities.user) return 'Route definitions for user management endpoints';
    if (entities.document) return 'Route definitions for document management endpoints';
    if (entities.kyc) return 'Route definitions for KYC verification endpoints';
    if (entities.transaction) return 'Route definitions for transaction endpoints';
    if (entities.payment) return 'Route definitions for payment endpoints';
    if (entities.report) return 'Route definitions for reporting endpoints';
    return `Route definitions for ${fileName} endpoints`;
  }
  
  // Schema layer
  if (layer === 'schema') {
    if (entities.insurance) {
      if (funcIncludes('create')) return 'Validates insurance policy creation payload structure';
      if (funcIncludes('update')) return 'Validates insurance policy update payload structure';
      return 'Validates insurance request payload structure';
    }
    if (entities.creditFacility) {
      if (funcIncludes('create')) return 'Validates credit facility creation payload structure';
      if (funcIncludes('update')) return 'Validates credit facility update payload structure';
      if (funcIncludes('counter')) return 'Validates counter-party addition payload structure';
      return 'Validates credit facility payload structure';
    }
    if (entities.financeApplication) {
      if (funcIncludes('submit') || funcIncludes('create')) return 'Validates finance application submission payload structure';
      if (funcIncludes('update')) return 'Validates finance application update payload structure';
      return 'Validates finance application payload structure';
    }
    if (entities.organisation) return 'Validates organisation request payload structure';
    if (entities.user) {
      if (funcIncludes('register') || funcIncludes('create')) return 'Validates user registration payload structure';
      if (funcIncludes('login')) return 'Validates user login credentials structure';
      return 'Validates user request payload structure';
    }
    if (entities.document) return 'Validates document upload payload structure';
    if (entities.transaction) return 'Validates transaction request payload structure';
    return `Validates ${fileName} request payload structure`;
  }
  
  // Utility layer
  if (layer === 'util' || layer === 'utility') {
    if (hasEntity('date') || funcIncludes('date')) return 'Utility functions for date formatting and calculations';
    if (hasEntity('format') || funcIncludes('format')) return 'Utility functions for data formatting operations';
    if (hasEntity('hash') || hasEntity('encrypt') || hasEntity('decrypt')) return 'Utility functions for encryption and hashing';
    if (hasEntity('validate') || funcIncludes('validate')) return 'Utility functions for data validation';
    if (hasEntity('email')) return 'Utility functions for email operations';
    if (hasEntity('file')) return 'Utility functions for file operations';
    if (hasEntity('string')) return 'Utility functions for string manipulation';
    if (hasEntity('number') || hasEntity('math') || hasEntity('calculate')) return 'Utility functions for numerical calculations';
    if (hasEntity('logger') || hasEntity('log')) return 'Utility functions for logging operations';
    if (hasEntity('jwt') || hasEntity('token')) return 'Utility functions for JWT token operations';
    if (hasEntity('parse') || funcIncludes('parse')) return 'Utility functions for data parsing';
    return `Utility functions for ${fileName} operations`;
  }
  
  // Config layer
  if (layer === 'config' || layer === 'configuration') {
    if (hasEntity('database') || hasEntity('db')) return 'Database connection configuration settings';
    if (hasEntity('server')) return 'Server configuration settings';
    if (hasEntity('auth')) return 'Authentication configuration settings';
    if (hasEntity('email') || hasEntity('smtp')) return 'Email service configuration settings';
    if (hasEntity('environment') || hasEntity('env')) return 'Environment-specific configuration settings';
    if (hasEntity('redis')) return 'Redis cache configuration settings';
    if (hasEntity('s3') || hasEntity('storage')) return 'File storage configuration settings';
    return `${fileName} configuration settings`;
  }
  
  // Model/Schema definition layer
  if (layer === 'model') {
    if (entities.insurance) return 'Database schema definition for insurance entity';
    if (entities.creditFacility) return 'Database schema definition for credit facility entity';
    if (entities.financeApplication) return 'Database schema definition for finance application entity';
    if (entities.organisation) return 'Database schema definition for organisation entity';
    if (entities.user) return 'Database schema definition for user entity';
    if (entities.transaction) return 'Database schema definition for transaction entity';
    return `Database schema definition for ${fileName} entity`;
  }
  
  // Fallback based on function name patterns
  if (functionName) {
    if (funcIncludes('create')) return `Creates ${fileName} with validation`;
    if (funcIncludes('update')) return `Updates ${fileName} entity`;
    if (funcIncludes('get') || funcIncludes('fetch') || funcIncludes('retrieve')) return `Retrieves ${fileName} data`;
    if (funcIncludes('delete') || funcIncludes('remove')) return `Deletes ${fileName} entity`;
    if (funcIncludes('validate')) return `Validates ${fileName} data`;
    if (funcIncludes('calculate') || funcIncludes('compute')) return `Calculates ${fileName} metrics`;
    if (funcIncludes('send')) return `Sends ${fileName} notification`;
    if (funcIncludes('process')) return `Processes ${fileName} transaction`;
  }
  
  // Ultimate fallback
  return `Implements ${fileName} functionality`;
}
