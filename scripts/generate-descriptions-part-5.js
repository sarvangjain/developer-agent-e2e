const fs = require('fs');
const path = require('path');

// Read the input file
const inputPath = path.join(__dirname, 'cursor-batches', 'chunks-part-5.json');
const outputPath = path.join(__dirname, 'cursor-batches', 'descriptions-part-5.json');

console.log('Reading input file...');
const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Found ${chunks.length} chunks to process`);

// Function to generate description based on chunk metadata
function generateDescription(chunk) {
  const { functionName, layer, filePath, code, module } = chunk;
  
  // Extract meaningful context from file path
  const fileName = path.basename(filePath, '.js');
  
  // Parse function/class names to understand purpose
  const lowerName = (functionName || fileName).toLowerCase();
  const lowerCode = code.toLowerCase();
  
  // Determine the action and entity based on patterns
  let description = '';
  
  // Layer-specific patterns
  if (layer === 'controller') {
    // Controller layer - handles requests
    if (lowerName.includes('create') || lowerCode.includes('req.body') && lowerCode.includes('create')) {
      description = generateControllerDesc(chunk, 'create');
    } else if (lowerName.includes('update') || lowerCode.includes('update')) {
      description = generateControllerDesc(chunk, 'update');
    } else if (lowerName.includes('delete') || lowerCode.includes('delete')) {
      description = generateControllerDesc(chunk, 'delete');
    } else if (lowerName.includes('get') || lowerName.includes('fetch') || lowerName.includes('list')) {
      description = generateControllerDesc(chunk, 'retrieve');
    } else {
      description = generateControllerDesc(chunk, 'handle');
    }
  } else if (layer === 'service') {
    // Service layer - business logic
    description = generateServiceDesc(chunk);
  } else if (layer === 'db_service') {
    // Database layer
    description = generateDbServiceDesc(chunk);
  } else if (layer === 'middleware') {
    // Middleware layer
    description = generateMiddlewareDesc(chunk);
  } else if (layer === 'route') {
    // Route definitions
    description = generateRouteDesc(chunk);
  } else if (layer === 'schema') {
    // Schema validation
    description = generateSchemaDesc(chunk);
  } else if (layer === 'util') {
    // Utility functions
    description = generateUtilDesc(chunk);
  } else if (layer === 'config') {
    // Configuration
    description = generateConfigDesc(chunk);
  } else {
    // Fallback
    description = `Handles ${extractEntity(chunk)} operations in ${module || 'application'} module`;
  }
  
  // Ensure max 20 words
  const words = description.split(' ');
  if (words.length > 20) {
    description = words.slice(0, 20).join(' ');
  }
  
  return description;
}

function extractEntity(chunk) {
  const { filePath, functionName, code } = chunk;
  const fileName = path.basename(filePath, '.js');
  
  // Common entities in trade finance
  const entities = {
    'credit': 'credit facility',
    'facility': 'credit facility',
    'finance': 'finance application',
    'application': 'finance application',
    'organisation': 'organisation',
    'organization': 'organisation',
    'company': 'company',
    'user': 'user',
    'auth': 'authentication',
    'invoice': 'invoice',
    'transaction': 'transaction',
    'payment': 'payment',
    'document': 'document',
    'kyc': 'KYC verification',
    'compliance': 'compliance',
    'approval': 'approval workflow',
    'counterparty': 'counter-party',
    'counter-party': 'counter-party',
    'limit': 'credit limit',
    'disbursement': 'disbursement',
    'repayment': 'repayment',
    'interest': 'interest calculation',
    'contract': 'contract',
    'agreement': 'agreement',
    'rate': 'rate',
    'fee': 'fee',
    'commission': 'commission',
    'report': 'report',
    'analytics': 'analytics',
    'notification': 'notification',
    'email': 'email',
    'webhook': 'webhook',
    'audit': 'audit log',
    'log': 'log',
  };
  
  const searchText = `${fileName} ${functionName} ${code}`.toLowerCase();
  
  for (const [key, value] of Object.entries(entities)) {
    if (searchText.includes(key)) {
      return value;
    }
  }
  
  return fileName.replace(/-/g, ' ');
}

function extractAction(chunk) {
  const { functionName, code } = chunk;
  const searchText = `${functionName} ${code}`.toLowerCase();
  
  if (searchText.includes('create') || searchText.includes('insert')) return 'creates';
  if (searchText.includes('update') || searchText.includes('modify') || searchText.includes('edit')) return 'updates';
  if (searchText.includes('delete') || searchText.includes('remove')) return 'deletes';
  if (searchText.includes('get') || searchText.includes('fetch') || searchText.includes('find') || searchText.includes('retrieve')) return 'retrieves';
  if (searchText.includes('list') || searchText.includes('getall')) return 'lists';
  if (searchText.includes('validate') || searchText.includes('check')) return 'validates';
  if (searchText.includes('calculate') || searchText.includes('compute')) return 'calculates';
  if (searchText.includes('send') || searchText.includes('notify')) return 'sends';
  if (searchText.includes('process')) return 'processes';
  if (searchText.includes('generate')) return 'generates';
  if (searchText.includes('approve')) return 'approves';
  if (searchText.includes('reject')) return 'rejects';
  if (searchText.includes('submit')) return 'submits';
  
  return 'handles';
}

function generateControllerDesc(chunk, action) {
  const entity = extractEntity(chunk);
  const verb = action === 'retrieve' ? 'retrieval' : 
               action === 'create' ? 'creation' :
               action === 'update' ? 'update' :
               action === 'delete' ? 'deletion' : action;
  return `Handles ${verb} request for ${entity}`;
}

function generateServiceDesc(chunk) {
  const entity = extractEntity(chunk);
  const action = extractAction(chunk);
  
  // Make it more specific based on code analysis
  const { code, functionName } = chunk;
  const lowerCode = code.toLowerCase();
  
  if (lowerCode.includes('business logic') || lowerCode.includes('validation')) {
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity} with business logic validation`;
  }
  
  if (lowerCode.includes('email') || lowerCode.includes('notification')) {
    return `Sends ${entity} notification to relevant parties`;
  }
  
  if (lowerCode.includes('calculate') || lowerCode.includes('compute')) {
    return `Calculates ${entity} amounts and applicable rates`;
  }
  
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity} business logic processing`;
}

function generateDbServiceDesc(chunk) {
  const entity = extractEntity(chunk);
  const action = extractAction(chunk);
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity} data in database`;
}

function generateMiddlewareDesc(chunk) {
  const { functionName, fileName, code } = chunk;
  const name = functionName || path.basename(chunk.filePath, '.js');
  const lowerName = name.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lowerName.includes('auth') || lowerCode.includes('authenticate')) {
    return 'Authentication middleware verifying user credentials and tokens';
  }
  if (lowerName.includes('permission') || lowerName.includes('authorize') || lowerCode.includes('permission')) {
    return 'Authorization middleware checking user permissions for resource access';
  }
  if (lowerName.includes('rate') || lowerName.includes('limit')) {
    return 'Rate limiting middleware restricting requests per user or IP';
  }
  if (lowerName.includes('validate') || lowerCode.includes('validate')) {
    return 'Validation middleware checking request payload structure';
  }
  if (lowerName.includes('error') || lowerCode.includes('error')) {
    return 'Error handling middleware formatting and logging application errors';
  }
  if (lowerName.includes('log')) {
    return 'Logging middleware recording request and response details';
  }
  if (lowerName.includes('cors')) {
    return 'CORS middleware configuring cross-origin resource sharing';
  }
  
  const entity = extractEntity(chunk);
  return `Middleware for ${entity} request processing`;
}

function generateRouteDesc(chunk) {
  const entity = extractEntity(chunk);
  const module = chunk.module || 'application';
  return `Route definitions for ${entity} API endpoints`;
}

function generateSchemaDesc(chunk) {
  const entity = extractEntity(chunk);
  const { code } = chunk;
  const lowerCode = code.toLowerCase();
  
  if (lowerCode.includes('request') || lowerCode.includes('body')) {
    return `Validates ${entity} request payload structure and data types`;
  }
  if (lowerCode.includes('response')) {
    return `Validates ${entity} response payload structure`;
  }
  
  return `Validates ${entity} data structure and constraints`;
}

function generateUtilDesc(chunk) {
  const { functionName, code, filePath } = chunk;
  const fileName = path.basename(filePath, '.js');
  const lowerName = (functionName || fileName).toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lowerName.includes('date') || lowerCode.includes('date')) {
    return 'Utility for date formatting and manipulation operations';
  }
  if (lowerName.includes('format')) {
    return 'Utility for data formatting and transformation';
  }
  if (lowerName.includes('validate')) {
    return 'Utility for data validation and verification';
  }
  if (lowerName.includes('parse') || lowerName.includes('transform')) {
    return 'Utility for parsing and transforming data structures';
  }
  if (lowerName.includes('encrypt') || lowerName.includes('hash') || lowerName.includes('crypto')) {
    return 'Utility for encryption and cryptographic operations';
  }
  if (lowerName.includes('email') || lowerName.includes('mail')) {
    return 'Utility for email composition and sending';
  }
  if (lowerName.includes('file') || lowerName.includes('upload')) {
    return 'Utility for file upload and storage operations';
  }
  if (lowerName.includes('pdf')) {
    return 'Utility for PDF document generation and processing';
  }
  if (lowerName.includes('csv') || lowerName.includes('excel')) {
    return 'Utility for spreadsheet export and import operations';
  }
  if (lowerName.includes('number') || lowerName.includes('currency')) {
    return 'Utility for number formatting and currency conversion';
  }
  
  const entity = extractEntity(chunk);
  return `Utility helper functions for ${entity} operations`;
}

function generateConfigDesc(chunk) {
  const { filePath } = chunk;
  const fileName = path.basename(filePath, '.js');
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('database') || lowerName.includes('db')) {
    return 'Configuration for database connection and settings';
  }
  if (lowerName.includes('server') || lowerName.includes('app')) {
    return 'Configuration for application server settings';
  }
  if (lowerName.includes('email') || lowerName.includes('smtp')) {
    return 'Configuration for email service provider settings';
  }
  if (lowerName.includes('auth')) {
    return 'Configuration for authentication and security settings';
  }
  if (lowerName.includes('logger') || lowerName.includes('log')) {
    return 'Configuration for application logging settings';
  }
  if (lowerName.includes('payment') || lowerName.includes('gateway')) {
    return 'Configuration for payment gateway integration';
  }
  
  const entity = extractEntity(chunk);
  return `Configuration settings for ${entity} module`;
}

// Process all chunks
console.log('Generating descriptions...');
const results = chunks.map((chunk, index) => {
  if (index % 100 === 0) {
    console.log(`Processed ${index}/${chunks.length}...`);
  }
  
  return {
    id: chunk.id,
    description: generateDescription(chunk)
  };
});

// Write output
console.log('Writing output file...');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`Successfully wrote ${results.length} descriptions to ${outputPath}`);
