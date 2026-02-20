const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'cursor-batches', 'chunks-part-5.json');
const outputPath = path.join(__dirname, 'cursor-batches', 'descriptions-part-5.json');

console.log('Reading input file...');
const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Found ${chunks.length} chunks to process`);

function generateDescription(chunk) {
  const { id, functionName, layer, filePath, code, module } = chunk;
  const fileName = path.basename(filePath, '.js');
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerCode = code.toLowerCase();
  const lowerFile = fileName.toLowerCase();
  
  // Extract entity from function name or file name
  const extractEntity = () => {
    // Check function name for entity clues
    if (lowerFunc.includes('creditfacility') || lowerFunc.includes('credit_facility') || lowerFunc.includes('facility')) {
      return 'credit facility';
    }
    if (lowerFunc.includes('financeapplication') || lowerFunc.includes('finance_application') || lowerFunc.includes('finance')) {
      return 'finance application';
    }
    if (lowerFunc.includes('organisation') || lowerFunc.includes('organization') || lowerFunc.includes('org')) {
      return 'organisation';
    }
    if (lowerFunc.includes('company') || lowerFunc.includes('companies')) {
      return 'company';
    }
    if (lowerFunc.includes('user') || lowerFunc.includes('member')) {
      return 'user';
    }
    if (lowerFunc.includes('transaction') || lowerFunc.includes('txn')) {
      return 'transaction';
    }
    if (lowerFunc.includes('invoice')) {
      return 'invoice';
    }
    if (lowerFunc.includes('payment')) {
      return 'payment';
    }
    if (lowerFunc.includes('document') || lowerFunc.includes('doc')) {
      return 'document';
    }
    if (lowerFunc.includes('counterparty') || lowerFunc.includes('counter_party') || lowerFunc.includes('tradingpartner')) {
      return 'counter-party';
    }
    if (lowerFunc.includes('limit')) {
      return 'credit limit';
    }
    if (lowerFunc.includes('disbursement')) {
      return 'disbursement';
    }
    if (lowerFunc.includes('repayment')) {
      return 'repayment';
    }
    if (lowerFunc.includes('interest')) {
      return 'interest';
    }
    if (lowerFunc.includes('bank')) {
      return 'bank account';
    }
    if (lowerFunc.includes('rate')) {
      return 'rate';
    }
    if (lowerFunc.includes('fee')) {
      return 'fee';
    }
    if (lowerFunc.includes('contract') || lowerFunc.includes('agreement')) {
      return 'contract';
    }
    if (lowerFunc.includes('approval')) {
      return 'approval';
    }
    if (lowerFunc.includes('notification') || lowerFunc.includes('email')) {
      return 'notification';
    }
    if (lowerFunc.includes('audit') || lowerFunc.includes('log')) {
      return 'audit log';
    }
    if (lowerFunc.includes('kyc')) {
      return 'KYC';
    }
    if (lowerFunc.includes('compliance')) {
      return 'compliance';
    }
    
    // Check file name
    if (lowerFile.includes('credit') || lowerFile.includes('facility')) {
      return 'credit facility';
    }
    if (lowerFile.includes('finance')) {
      return 'finance application';
    }
    if (lowerFile.includes('organisation') || lowerFile.includes('organization')) {
      return 'organisation';
    }
    
    return 'data';
  };
  
  // Determine action verb based on function name
  const extractAction = () => {
    if (lowerFunc.startsWith('get') || lowerFunc.startsWith('fetch') || lowerFunc.startsWith('find') || lowerFunc.includes('retrieve')) {
      return 'retrieves';
    }
    if (lowerFunc.startsWith('getall') || lowerFunc.includes('list')) {
      return 'lists';
    }
    if (lowerFunc.startsWith('create') || lowerFunc.startsWith('add') || lowerFunc.startsWith('insert')) {
      return 'creates';
    }
    if (lowerFunc.startsWith('update') || lowerFunc.startsWith('modify') || lowerFunc.startsWith('edit') || lowerFunc.startsWith('set')) {
      return 'updates';
    }
    if (lowerFunc.startsWith('delete') || lowerFunc.startsWith('remove')) {
      return 'deletes';
    }
    if (lowerFunc.includes('validate') || lowerFunc.includes('check') || lowerFunc.includes('verify')) {
      return 'validates';
    }
    if (lowerFunc.includes('calculate') || lowerFunc.includes('compute')) {
      return 'calculates';
    }
    if (lowerFunc.includes('send') || lowerFunc.includes('notify')) {
      return 'sends';
    }
    if (lowerFunc.includes('approve')) {
      return 'approves';
    }
    if (lowerFunc.includes('reject')) {
      return 'rejects';
    }
    if (lowerFunc.includes('submit')) {
      return 'submits';
    }
    if (lowerFunc.includes('process')) {
      return 'processes';
    }
    if (lowerFunc.includes('generate')) {
      return 'generates';
    }
    if (lowerFunc.includes('sync') || lowerFunc.includes('synchronize')) {
      return 'synchronizes';
    }
    
    return 'handles';
  };
  
  // Extract specific details from function name
  const extractDetails = () => {
    const details = [];
    
    // Look for specific patterns in function name
    if (lowerFunc.includes('byid') || lowerFunc.includes('by_id')) {
      details.push('by ID');
    }
    if (lowerFunc.includes('byuser') || lowerFunc.includes('by_user')) {
      details.push('by user');
    }
    if (lowerFunc.includes('byorg') || lowerFunc.includes('byorganisation')) {
      details.push('by organisation');
    }
    if (lowerFunc.includes('monitoring')) {
      details.push('for monitoring');
    }
    if (lowerFunc.includes('details')) {
      details.push('details');
    }
    if (lowerFunc.includes('information')) {
      details.push('information');
    }
    if (lowerFunc.includes('outstanding')) {
      details.push('outstanding amounts');
    }
    if (lowerFunc.includes('upcoming')) {
      details.push('upcoming');
    }
    if (lowerFunc.includes('sofr')) {
      details.push('SOFR');
    }
    if (lowerFunc.includes('logistics')) {
      details.push('logistics');
    }
    if (lowerFunc.includes('paymentterms')) {
      details.push('payment terms');
    }
    if (lowerFunc.includes('status')) {
      details.push('status');
    }
    
    return details;
  };
  
  const entity = extractEntity();
  const action = extractAction();
  const details = extractDetails();
  
  // Generate description based on layer
  let description = '';
  
  if (layer === 'controller') {
    const actionNoun = action.replace('retrieves', 'retrieval')
      .replace('creates', 'creation')
      .replace('updates', 'update')
      .replace('deletes', 'deletion')
      .replace('validates', 'validation')
      .replace('calculates', 'calculation')
      .replace('sends', 'sending')
      .replace('lists', 'listing');
    
    description = `Handles ${actionNoun} request for ${entity}`;
    if (details.length > 0) {
      description += ` ${details.join(' ')}`;
    }
  } else if (layer === 'db_service') {
    description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}`;
    if (details.length > 0) {
      description += ` ${details.join(' ')}`;
    }
    description += ' data in database';
  } else if (layer === 'service') {
    description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}`;
    if (details.length > 0) {
      description += ` ${details.join(' ')}`;
    }
    description += ' business logic';
  } else if (layer === 'middleware') {
    if (lowerFunc.includes('auth') || lowerFile.includes('auth')) {
      description = 'Authentication middleware verifying user credentials';
    } else if (lowerFunc.includes('permission') || lowerFunc.includes('authorize')) {
      description = 'Authorization middleware checking user permissions';
    } else if (lowerFunc.includes('rate') || lowerFunc.includes('limit')) {
      description = 'Rate limiting middleware restricting requests';
    } else if (lowerFunc.includes('validate')) {
      description = 'Validation middleware checking request payload';
    } else if (lowerFunc.includes('error')) {
      description = 'Error handling middleware formatting errors';
    } else {
      description = `Middleware for ${entity} processing`;
    }
  } else if (layer === 'route') {
    description = `Route definitions for ${entity} endpoints`;
  } else if (layer === 'schema') {
    description = `Validates ${entity} request payload structure`;
  } else if (layer === 'util') {
    description = `Utility functions for ${entity} operations`;
  } else if (layer === 'config') {
    description = `Configuration settings for ${entity}`;
  } else {
    description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}`;
    if (details.length > 0) {
      description += ` ${details.join(' ')}`;
    }
  }
  
  // Ensure max 20 words
  const words = description.split(' ');
  if (words.length > 20) {
    description = words.slice(0, 20).join(' ');
  }
  
  return description;
}

// Process all chunks with more specific analysis
console.log('Generating descriptions...');
const results = chunks.map((chunk, index) => {
  if (index % 100 === 0) {
    console.log(`Processed ${index}/${chunks.length}...`);
  }
  
  const description = generateDescription(chunk);
  
  return {
    id: chunk.id,
    description
  };
});

// Write output
console.log('Writing output file...');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`Successfully wrote ${results.length} descriptions to ${outputPath}`);
