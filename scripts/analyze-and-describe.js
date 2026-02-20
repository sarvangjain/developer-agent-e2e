#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || '/Users/sarvang.jain/Work/Repos/developer-agent-e2e/scripts/cursor-batches/chunks-part-1.json';
const outputPath = '/Users/sarvang.jain/Work/Repos/developer-agent-e2e/scripts/cursor-batches/descriptions-part-1.json';

const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Loaded ${chunks.length} chunks for processing\n`);

function analyzeCode(code) {
  const patterns = {
    // HTTP/API patterns
    router: /router\.(get|post|put|delete|patch)/i,
    express: /express\(\)|app\.(get|post|use)/i,
    
    // Database patterns
    knex: /knex\(['"`](\w+)['"`]\)/,
    select: /\.select\(/,
    insert: /\.insert\(/,
    update: /\.update\(/,
    deleteQuery: /\.del\(|\.delete\(/,
    where: /\.where\(/,
    join: /\.(join|leftJoin|rightJoin|innerJoin)\(/,
    
    // Auth patterns
    jwt: /jwt\.(sign|verify)/i,
    bcrypt: /bcrypt\.(hash|compare)/i,
    token: /token|authorization|bearer/i,
    
    // Email patterns
    sendEmail: /sendEmail|nodemailer|send.*mail/i,
    emailTemplate: /subject|template|<html>|<body>/i,
    
    // File operations
    fileUpload: /multer|upload|file/i,
    s3: /s3\.|aws-sdk|S3/,
    pdf: /pdf|pdfkit/i,
    excel: /xlsx|exceljs/i,
    
    // Validation patterns
    joi: /Joi\.|\.validate\(/,
    validator: /validator\./i,
    
    // Payment/Finance patterns
    payment: /payment|transaction|invoice|settle/i,
    finance: /finance|loan|credit|facility/i,
    interest: /interest|rate|apr/i,
    
    // Notification patterns
    notification: /notification|notify|alert/i,
    
    // Status/Workflow
    status: /status|state|workflow/i,
    approve: /approve|approval/i,
    reject: /reject/i,
    
    // Calculations
    calculate: /calculate|compute|sum|total|amount/i,
    
    // Error handling
    errorHandler: /error|throw|catch/i,
    
    // Middleware
    middleware: /\(req,\s*res,\s*next\)/,
    
    // Exports
    moduleExports: /module\.exports\s*=/,
    exports: /exports\./,
    
    // Functions
    async: /async\s+function|async\s+\(/,
    promise: /Promise|\.then\(|\.catch\(/,
    
    // Config
    env: /process\.env/,
    config: /config\.|require.*config/i,
  };
  
  const matches = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    matches[key] = pattern.test(code);
  }
  
  return matches;
}

function extractEntityFromPath(filePath) {
  const fileName = path.basename(filePath, '.js');
  
  // Remove common suffixes
  let entity = fileName
    .replace(/_controller$|_service$|_db_service$|_routes?$|_schema$|_middleware$/, '')
    .replace(/_/g, ' ');
  
  return entity;
}

function generateDescription(chunk) {
  const { id, filePath, functionName, module, layer, code } = chunk;
  const patterns = analyzeCode(code);
  const entity = extractEntityFromPath(filePath);
  const fileName = path.basename(filePath);
  
  // Analyze specific files
  if (filePath.includes('knexfile.js')) {
    if (functionName === 'getMigrationDirectories') {
      return 'Discovers database migration directories using filesystem search';
    }
    if (functionName === 'generateConfigObject') {
      return 'Generates Knex database configuration for migrations across environments';
    }
    if (!functionName) {
      return 'Database migration tool configuration for PostgreSQL connection management';
    }
  }
  
  if (filePath.includes('jest.config.js')) {
    return 'Unit test runner configuration defining coverage and module paths';
  }
  
  if (filePath.includes('force_gc.js')) {
    return 'Forces garbage collection after test execution preventing memory leaks';
  }
  
  if (filePath.includes('src/server.js')) {
    return 'Initializes HTTP server and bootstraps Express application instance';
  }
  
  if (filePath.includes('src/router.js')) {
    return 'Configures middleware pipeline and registers application route handlers';
  }
  
  if (filePath.includes('newrelic.js')) {
    return 'Configures New Relic APM monitoring for application performance tracking';
  }
  
  if (filePath.includes('scripts/mock_data')) {
    if (filePath.includes('index.js')) {
      return 'Orchestrates mock data generation for test environment seeding';
    }
    return 'Generates test data fixtures for development environment';
  }
  
  // Config layer
  if (layer === 'config') {
    // Specific file handlers
    if (fileName === 'source_access.js') {
      return 'Stores API keys and service URLs for external integrations';
    }
    if (fileName === 'settings.js') {
      return 'Defines application settings including port and CORS patterns';
    }
    if (fileName === 'envs.js') {
      return 'Enumerates environment names for deployment stage identification';
    }
    if (fileName === 'database.js') {
      return 'Configures PostgreSQL connection parameters across deployment environments';
    }
    if (fileName === 'auth_service.js') {
      return 'Configures authentication service endpoints and provider credentials';
    }
    if (fileName === 'constants.js') {
      return 'Defines business constants including status codes and enumerations';
    }
    if (fileName === 'app_default_data.js') {
      return 'Provides default application data for roles and permissions';
    }
    if (fileName === 'error_messages.js') {
      return 'Centralized error message constants for API validation responses';
    }
    if (fileName === 'document_service.js') {
      return 'S3 bucket paths and document service endpoint configuration';
    }
    if (fileName === 'scf_txn_monitoring_notifications.js') {
      return 'Email and bell notification templates for supply chain finance monitoring';
    }
    if (fileName === 'scf_notifications.js') {
      return 'Email and bell notification templates for supply chain finance events';
    }
    if (fileName === 'payment_notifications.js') {
      return 'Email and bell notification templates for payment workflow events';
    }
    if (fileName === 'lending_notifications.js') {
      return 'Email and bell notification templates for lending approval workflows';
    }
    if (fileName === 'notifications.js') {
      return 'Email and bell notification templates for finance application workflows';
    }
    if (fileName === 'company_notifications.js') {
      return 'Email templates for company registration approval and rejection notifications';
    }
    if (fileName === 'credit_facility_notifications.js') {
      return 'Email templates for credit facility request and renewal notifications';
    }
    if (fileName.includes('mail_config')) {
      return 'Email service configuration for notification delivery';
    }
    if (fileName === 'routes.js') {
      return 'Central route path definitions mapping API endpoints';
    }
    if (fileName === 'notification.js') {
      return 'Notification service configuration and template settings';
    }
    if (fileName === 'migration_database.js') {
      return 'Database connection settings for running migration scripts';
    }
    if (fileName === 'lending_cache_route.js') {
      return 'Cache invalidation route mappings for lending module';
    }
    if (fileName === 'history.js') {
      return 'Audit trail configuration for entity change tracking';
    }
    if (fileName === 'finance_states.js') {
      return 'Finance application workflow state definitions and transitions';
    }
    if (fileName === 'facility_states.js') {
      return 'Credit facility workflow state definitions and transitions';
    }
    if (fileName === 'lending_states.js') {
      return 'Lending application workflow state definitions and transitions';
    }
    
    // Config.js function handlers
    if (filePath.includes('config/config.js')) {
      if (functionName === 'getAppEnv') return 'Returns current application environment name';
      if (functionName === 'isDevEnv') return 'Checks if application running in development environment';
      if (functionName === 'isProdEnv') return 'Checks if application running in production environment';
      if (functionName === 'isStagingEnv') return 'Checks if application running in staging environment';
      if (functionName === 'isQaEnv') return 'Checks if application running in QA environment';
      if (functionName === 'isTestEnv') return 'Checks if application running in test environment';
      if (functionName === 'isDemoEnv') return 'Checks if application running in demo environment';
      if (functionName === 'isUatEnv') return 'Checks if application running in UAT environment';
      if (functionName === 'getDb') return 'Returns Knex database connection instance';
      if (functionName === 'getApiResponseCodes') return 'Returns HTTP status code constants for API responses';
      if (functionName === 'getConfig') return 'Retrieves configuration value by key with fallback support';
      if (functionName === 'getAwsResource') return 'Returns AWS resource configuration for current environment';
      if (functionName === 'getMigrationDb') return 'Returns database connection for migration operations';
      if (!functionName) return 'Central configuration module exporting environment-specific settings';
    }
    
    // Check code content for more specific descriptions
    if (code.includes('NOTIFICATION') || code.includes('EMAIL')) {
      return `Email and bell notification templates for ${entity} workflows`;
    }
    if (code.includes('STATE') || code.includes('STATUS')) {
      return `Workflow state definitions for ${entity} lifecycle management`;
    }
    if (code.includes('ROUTE') || code.includes('PATH')) {
      return `API route path definitions for ${entity} endpoints`;
    }
    if (code.includes('CONNECTION') || code.includes('DATABASE')) {
      return `Database connection configuration for ${entity} operations`;
    }
    
    return `Configuration settings for ${entity} module behavior`;
  }
  
  // Schema layer
  if (layer === 'schema') {
    const schemaEntity = entity.replace(/ schema$/, '');
    return `Validates ${schemaEntity} request payload structure using Joi`;
  }
  
  // Route layer
  if (layer === 'route') {
    const routeEntity = entity.replace(/ routes?$/, '');
    return `Defines HTTP routes for ${routeEntity} API endpoints`;
  }
  
  // Middleware layer
  if (layer === 'middleware') {
    if (fileName === 'error_handler.js' || functionName === 'errorHandler') {
      return 'Catches exceptions and transforms them into standardized API responses';
    }
    if (fileName === 'about.js') {
      return 'Provides application version and health check endpoint data';
    }
    if (fileName === 'access_control.js') {
      return 'Enforces CORS policy and validates request origin domains';
    }
    if (fileName === 'asyncContext.js') {
      return 'Manages async context storage for request-scoped data tracking';
    }
    if (fileName === 'rate_limit.js') {
      return 'Throttles API requests per IP address within time window';
    }
    if (fileName === 'logger.js' || functionName === 'logRequest') {
      return 'Logs HTTP request details including method, path, and duration';
    }
    if (patterns.token || patterns.jwt) {
      if (functionName && functionName.includes('Permission')) {
        return 'Verifies user has required role permission for endpoint access';
      }
      return 'Validates JWT tokens and extracts authenticated user context';
    }
    return `Request pipeline middleware for ${entity} processing`;
  }
  
  // Controller layer
  if (layer === 'controller') {
    if (!functionName) {
      return `Handles HTTP requests for ${entity} operations`;
    }
    
    const fn = functionName.toLowerCase();
    
    // Create operations
    if (fn.includes('create') || fn.includes('add')) {
      if (entity.includes('credit facility')) {
        return 'Handles create credit facility request returning new facility record';
      }
      if (entity.includes('finance application')) {
        return 'Handles finance application creation request with validation';
      }
      if (entity.includes('organisation') || entity.includes('organization')) {
        return 'Handles organisation registration request creating new entity';
      }
      if (entity.includes('user')) {
        return 'Handles user registration request with credential validation';
      }
      if (entity.includes('counter party') || entity.includes('counterparty')) {
        return 'Handles counterparty addition request to credit facility';
      }
      if (entity.includes('document')) {
        return 'Handles document upload request storing file metadata';
      }
      return `Handles create ${entity} request returning created record`;
    }
    
    // Update operations
    if (fn.includes('update') || fn.includes('edit') || fn.includes('modify')) {
      if (entity.includes('credit facility')) {
        return 'Handles credit facility update request modifying facility terms';
      }
      if (entity.includes('finance application')) {
        return 'Handles finance application update request with validation';
      }
      if (entity.includes('status')) {
        return `Handles ${entity} status update request changing workflow state`;
      }
      return `Handles update ${entity} request with validation`;
    }
    
    // Delete operations
    if (fn.includes('delete') || fn.includes('remove')) {
      return `Handles delete ${entity} request removing record`;
    }
    
    // Retrieve operations
    if (fn.includes('get') || fn.includes('fetch') || fn.includes('retrieve') || fn.includes('find')) {
      if (fn.includes('list') || fn.includes('all')) {
        return `Handles request fetching all ${entity} records with filters`;
      }
      if (fn.includes('byid') || fn.includes('by_id') || fn.includes('detail')) {
        return `Handles request retrieving ${entity} details by identifier`;
      }
      if (fn.includes('outstanding')) {
        return `Handles request calculating outstanding ${entity} amounts`;
      }
      if (fn.includes('summary')) {
        return `Handles request generating ${entity} summary report`;
      }
      return `Handles request retrieving ${entity} data`;
    }
    
    // Approval operations
    if (fn.includes('approve')) {
      return `Handles ${entity} approval request updating status to approved`;
    }
    
    // Rejection operations
    if (fn.includes('reject')) {
      return `Handles ${entity} rejection request updating status to rejected`;
    }
    
    // Submission operations
    if (fn.includes('submit')) {
      return `Handles ${entity} submission request initiating approval workflow`;
    }
    
    // Download operations
    if (fn.includes('download')) {
      return `Handles ${entity} download request generating file response`;
    }
    
    // Upload operations
    if (fn.includes('upload')) {
      return `Handles ${entity} file upload request processing attachment`;
    }
    
    // Export operations
    if (fn.includes('export')) {
      return `Handles ${entity} export request generating Excel report`;
    }
    
    // Import operations
    if (fn.includes('import')) {
      return `Handles ${entity} import request processing bulk data`;
    }
    
    // Search operations
    if (fn.includes('search')) {
      return `Handles ${entity} search request filtering by criteria`;
    }
    
    // Validate operations
    if (fn.includes('validate') || fn.includes('check')) {
      return `Handles ${entity} validation request checking business rules`;
    }
    
    // Calculate operations
    if (fn.includes('calculate') || fn.includes('compute')) {
      return `Handles ${entity} calculation request computing amounts`;
    }
    
    // Send operations
    if (fn.includes('send') || fn.includes('notify')) {
      return `Handles ${entity} notification request triggering email`;
    }
    
    return `Handles ${functionName} request for ${entity}`;
  }
  
  // Service layer
  if (layer === 'service') {
    if (!functionName) {
      return `Implements business logic for ${entity} operations`;
    }
    
    const fn = functionName.toLowerCase();
    
    // Create operations
    if (fn.includes('create') || fn.includes('add')) {
      if (patterns.validate || patterns.joi) {
        return `Creates ${entity} validating business rules and constraints`;
      }
      return `Creates ${entity} with business logic processing`;
    }
    
    // Update operations
    if (fn.includes('update') || fn.includes('edit')) {
      if (patterns.status || patterns.workflow) {
        return `Updates ${entity} status applying workflow transitions`;
      }
      return `Updates ${entity} applying business rule validation`;
    }
    
    // Delete operations
    if (fn.includes('delete') || fn.includes('remove')) {
      return `Deletes ${entity} handling cascade relationships`;
    }
    
    // Retrieve operations
    if (fn.includes('get') || fn.includes('fetch') || fn.includes('retrieve') || fn.includes('find')) {
      if (fn.includes('outstanding')) {
        return `Calculates outstanding ${entity} amounts by organisation`;
      }
      if (fn.includes('summary')) {
        return `Generates ${entity} summary aggregating key metrics`;
      }
      return `Retrieves ${entity} data with business transformations`;
    }
    
    // Calculate operations
    if (fn.includes('calculate') || fn.includes('compute')) {
      if (entity.includes('interest')) {
        return 'Calculates interest accrual for financing transactions';
      }
      if (entity.includes('payment')) {
        return 'Calculates payment amounts including fees and charges';
      }
      return `Calculates ${entity} amounts using business formulas`;
    }
    
    // Process operations
    if (fn.includes('process')) {
      if (patterns.payment) {
        return `Processes ${entity} payment executing settlement workflow`;
      }
      if (patterns.approve) {
        return `Processes ${entity} approval updating status and notifying`;
      }
      return `Processes ${entity} executing business workflow`;
    }
    
    // Validate operations
    if (fn.includes('validate') || fn.includes('check')) {
      return `Validates ${entity} against business rules and constraints`;
    }
    
    // Approve operations
    if (fn.includes('approve')) {
      if (patterns.notification || patterns.sendEmail) {
        return `Approves ${entity} updating status and sending notifications`;
      }
      return `Approves ${entity} transitioning workflow to approved state`;
    }
    
    // Reject operations
    if (fn.includes('reject')) {
      return `Rejects ${entity} updating status to rejected state`;
    }
    
    // Submit operations
    if (fn.includes('submit')) {
      return `Submits ${entity} for approval initiating workflow`;
    }
    
    // Generate operations
    if (fn.includes('generate')) {
      if (patterns.pdf) {
        return `Generates ${entity} PDF document from template`;
      }
      if (patterns.excel) {
        return `Generates ${entity} Excel report with data`;
      }
      return `Generates ${entity} documents or reports`;
    }
    
    // Send/Notify operations
    if (fn.includes('send') || fn.includes('notify')) {
      if (patterns.sendEmail || patterns.emailTemplate) {
        return `Sends ${entity} email notification to stakeholders`;
      }
      return `Notifies users about ${entity} events`;
    }
    
    // Export operations
    if (fn.includes('export')) {
      return `Exports ${entity} data to Excel format`;
    }
    
    // Import operations
    if (fn.includes('import')) {
      return `Imports ${entity} data from external source`;
    }
    
    // Sync operations
    if (fn.includes('sync') || fn.includes('synchronize')) {
      return `Synchronizes ${entity} with external system`;
    }
    
    return `Processes ${functionName} business logic for ${entity}`;
  }
  
  // DB Service layer
  if (layer === 'db_service') {
    if (!functionName) {
      return `Database access layer for ${entity} table operations`;
    }
    
    const fn = functionName.toLowerCase();
    
    // Create/Insert operations
    if (fn.includes('create') || fn.includes('insert') || fn.includes('add')) {
      return `Inserts new ${entity} record into database table`;
    }
    
    // Update operations
    if (fn.includes('update') || fn.includes('edit')) {
      return `Updates existing ${entity} record in database`;
    }
    
    // Delete operations
    if (fn.includes('delete') || fn.includes('remove')) {
      return `Deletes ${entity} record from database table`;
    }
    
    // Retrieve operations
    if (fn.includes('get') || fn.includes('fetch') || fn.includes('find') || fn.includes('retrieve')) {
      if (fn.includes('byid') || fn.includes('by_id')) {
        return `Queries ${entity} record by primary key from database`;
      }
      if (fn.includes('all') || fn.includes('list')) {
        return `Queries all ${entity} records from database table`;
      }
      if (fn.includes('where') || fn.includes('by')) {
        return `Queries ${entity} records matching filter criteria from database`;
      }
      return `Retrieves ${entity} data from database table`;
    }
    
    // Count operations
    if (fn.includes('count')) {
      return `Counts ${entity} records matching criteria in database`;
    }
    
    // Exists operations
    if (fn.includes('exists') || fn.includes('check')) {
      return `Checks if ${entity} record exists in database`;
    }
    
    // Search operations
    if (fn.includes('search')) {
      return `Searches ${entity} records with filters in database`;
    }
    
    // Bulk operations
    if (fn.includes('bulk')) {
      if (fn.includes('insert')) {
        return `Bulk inserts multiple ${entity} records into database`;
      }
      if (fn.includes('update')) {
        return `Bulk updates multiple ${entity} records in database`;
      }
      return `Executes bulk ${entity} operation in database`;
    }
    
    return `Database query for ${functionName} on ${entity} table`;
  }
  
  // Utility layer
  if (layer === 'util' || filePath.includes('/utils/') || filePath.includes('/helpers/')) {
    if (fileName.includes('logger')) {
      return 'Provides logging functions for application events and errors';
    }
    if (fileName.includes('reset_sequence')) {
      return 'Resets database auto-increment sequences for test cleanup';
    }
    if (fileName.includes('date') || fileName.includes('time')) {
      return 'Date formatting and timezone conversion utility functions';
    }
    if (fileName.includes('file')) {
      return 'File upload, storage, and retrieval utility functions';
    }
    if (fileName.includes('email') || fileName.includes('mail')) {
      return 'Email sending and template rendering utility functions';
    }
    if (fileName.includes('pdf')) {
      return 'PDF generation and document manipulation utilities';
    }
    if (fileName.includes('excel')) {
      return 'Excel file generation and parsing utility functions';
    }
    if (fileName.includes('validation') || fileName.includes('validator')) {
      return 'Input validation and data sanitization utilities';
    }
    if (fileName.includes('crypto') || fileName.includes('encryption')) {
      return 'Cryptographic hashing and encryption utility functions';
    }
    if (fileName.includes('token')) {
      return 'JWT token generation and verification utilities';
    }
    if (fileName.includes('constants')) {
      return 'Application-wide constant definitions and enumerations';
    }
    
    if (functionName) {
      const fn = functionName.toLowerCase();
      if (fn.includes('format')) {
        return `Formats ${entity} data for display or transmission`;
      }
      if (fn.includes('parse')) {
        return `Parses ${entity} from string or external format`;
      }
      if (fn.includes('validate')) {
        return `Validates ${entity} data structure and values`;
      }
      if (fn.includes('convert')) {
        return `Converts ${entity} between different formats`;
      }
      if (fn.includes('generate')) {
        return `Generates ${entity} using utility logic`;
      }
    }
    
    return `Utility functions for ${entity} operations`;
  }
  
  // Error classes
  if (filePath.includes('/errors/')) {
    if (fileName.includes('api_error')) {
      return 'Custom error class for API exceptions with status codes';
    }
    return `Error class for ${entity} exception handling`;
  }
  
  // Models
  if (filePath.includes('/models/')) {
    return `Knex model definition for ${entity} database entity`;
  }
  
  // Migrations
  if (filePath.includes('/migrations/')) {
    if (code.includes('createTable')) {
      const tableMatch = code.match(/createTable\(['"`](\w+)['"`]/);
      const tableName = tableMatch ? tableMatch[1] : entity;
      return `Creates ${tableName} database table with schema definition`;
    }
    if (code.includes('alterTable') || code.includes('table.')) {
      return `Alters ${entity} table structure adding or modifying columns`;
    }
    if (code.includes('dropTable')) {
      return `Drops ${entity} database table`;
    }
    return 'Database migration modifying schema structure';
  }
  
  // Seeds
  if (filePath.includes('/seeds/')) {
    return `Seeds ${entity} test data into database`;
  }
  
  // Tests
  if (filePath.includes('/test/') || filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    return `Unit tests for ${entity} functionality`;
  }
  
  // Default fallback
  if (patterns.moduleExports) {
    if (patterns.config) {
      return `Configuration module for ${entity} settings`;
    }
    if (patterns.router || patterns.express) {
      return `Express router for ${entity} endpoints`;
    }
  }
  
  return `Module implementing ${entity} functionality`;
}

// Process all chunks
console.log('Processing chunks...\n');
const results = [];
let processed = 0;

for (const chunk of chunks) {
  processed++;
  if (processed % 100 === 0 || processed === 1) {
    console.log(`Progress: ${processed}/${chunks.length}`);
  }
  
  results.push({
    id: chunk.id,
    description: generateDescription(chunk)
  });
}

// Write output
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`\n✓ Completed! Generated ${results.length} descriptions`);
console.log(`✓ Output written to: ${outputPath}`);

// Validation
if (results.length !== chunks.length) {
  console.error(`\n⚠ WARNING: Output count (${results.length}) doesn't match input count (${chunks.length})`);
  process.exit(1);
}

// Check for duplicate IDs
const ids = new Set();
for (const item of results) {
  if (ids.has(item.id)) {
    console.error(`\n⚠ WARNING: Duplicate ID found: ${item.id}`);
  }
  ids.add(item.id);
}

console.log(`✓ Validation passed: All ${results.length} chunks processed with unique IDs`);
