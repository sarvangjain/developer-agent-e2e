const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'cursor-batches', 'chunks-part-5.json');
const outputPath = path.join(__dirname, 'cursor-batches', 'descriptions-part-5.json');

console.log('Reading input file...');
const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Found ${chunks.length} chunks to process`);

function generateDescription(chunk) {
  const { functionName, layer, filePath, code } = chunk;
  const fileName = path.basename(filePath, '.js');
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerCode = code.toLowerCase();
  
  // Analyze code patterns for specific business logic
  const codePatterns = {
    hasSelect: lowerCode.includes('.select(') || lowerCode.includes('select `'),
    hasInsert: lowerCode.includes('.insert(') || lowerCode.includes('insert into'),
    hasUpdate: lowerCode.includes('.update(') || lowerCode.includes('update `'),
    hasDelete: lowerCode.includes('.delete(') || lowerCode.includes('delete from'),
    hasJoin: lowerCode.includes('.join(') || lowerCode.includes('leftjoin') || lowerCode.includes('innerjoin'),
    hasWhere: lowerCode.includes('.where('),
    hasWhereIn: lowerCode.includes('.wherein('),
    hasDecrement: lowerCode.includes('.decrement('),
    hasIncrement: lowerCode.includes('.increment('),
    hasTransaction: lowerCode.includes('db.transaction') || lowerCode.includes('trx =>'),
  };
  
  // Generate description based on layer and function analysis
  if (layer === 'db_service') {
    return generateDbServiceDescription(functionName, fileName, code, codePatterns);
  } else if (layer === 'service') {
    return generateServiceDescription(functionName, fileName, code);
  } else if (layer === 'controller') {
    return generateControllerDescription(functionName, fileName, code);
  } else if (layer === 'middleware') {
    return generateMiddlewareDescription(functionName, fileName, code);
  } else if (layer === 'route') {
    return `Route definitions for ${extractDomain(fileName)} API endpoints`;
  } else if (layer === 'schema') {
    return `Validates ${extractEntity(functionName, fileName)} request payload structure`;
  } else if (layer === 'util') {
    return generateUtilDescription(functionName, fileName, code);
  } else if (layer === 'config') {
    return `Configuration settings for ${extractDomain(fileName)}`;
  }
  
  return `Handles ${extractEntity(functionName, fileName)} operations`;
}

function generateDbServiceDescription(functionName, fileName, code, patterns) {
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerCode = code.toLowerCase();
  
  // Pattern matching for specific operations
  
  // Transaction monitoring
  if (lowerFunc.includes('transactionmonitoring')) {
    return 'Retrieves transaction monitoring details for compliance review';
  }
  
  // Trading partners / Counter-parties
  if (lowerFunc.includes('tradingpartner')) {
    if (lowerFunc.includes('get')) {
      return 'Retrieves counter-party trading partner information by ID';
    }
  }
  
  // SOFR rates
  if (lowerFunc.includes('sofrrate')) {
    return 'Retrieves SOFR benchmark interest rates from database';
  }
  
  // Logistics finance payment terms
  if (lowerFunc.includes('logisticsfinancepaymentterms')) {
    return 'Retrieves logistics finance payment terms configuration';
  }
  
  // Organisation banks
  if (lowerFunc.includes('organisationbanks')) {
    if (lowerFunc.includes('details')) {
      return 'Retrieves organisation bank account details with address information';
    } else if (lowerFunc.includes('get')) {
      return 'Retrieves organisation bank account records by IDs';
    }
  }
  
  // Finance IDs by user
  if (lowerFunc.includes('allfinanceidsbyuser')) {
    return 'Retrieves all finance application IDs accessible by user organisation';
  }
  
  // Sync request table operations
  if (lowerFunc.includes('syncrequest')) {
    if (lowerFunc.includes('insert')) {
      return 'Creates external system sync request log entry';
    } else if (lowerFunc.includes('update')) {
      return 'Updates sync request response data from external system';
    }
  }
  
  // LMS transaction view
  if (lowerFunc.includes('lmstransactionview')) {
    return 'Retrieves loan management system transaction comprehensive view data';
  }
  
  // Lending finance transaction operations
  if (lowerFunc.includes('lendingfinancetransaction')) {
    if (lowerFunc.includes('distribution')) {
      return 'Creates finance transaction distribution breakdown record';
    } else if (lowerFunc.includes('insert')) {
      return 'Creates lending finance transaction record';
    }
  }
  
  // Short amount distribution
  if (lowerFunc.includes('shortamountdistribution') || lowerFunc.includes('shortpayment')) {
    if (lowerFunc.includes('insert')) {
      return 'Creates short payment amount distribution allocation record';
    } else if (lowerFunc.includes('update')) {
      return 'Updates short payment distribution pre-remittance balance';
    } else if (lowerFunc.includes('decrement')) {
      return 'Decrements organisation settlement balance short payment amount';
    } else if (lowerFunc.includes('getmaker')) {
      return 'Retrieves maker-created short payment distribution data for checker approval';
    }
  }
  
  // Maker-checker operations
  if (lowerFunc.includes('maker')) {
    if (lowerFunc.includes('financetxn') && lowerFunc.includes('distribution')) {
      if (lowerFunc.includes('accounting')) {
        return 'Retrieves maker transaction distribution data for accounting system sync';
      }
      return 'Retrieves maker transaction distribution data for checker approval';
    } else if (lowerFunc.includes('financetxn')) {
      if (lowerFunc.includes('accounting')) {
        return 'Retrieves maker transaction data for accounting system integration';
      }
      return 'Retrieves maker transaction data for checker approval workflow';
    }
  }
  
  // Upcoming transactions
  if (lowerFunc.includes('upcomingtransaction')) {
    if (lowerFunc.includes('insert')) {
      return 'Creates upcoming scheduled transaction details record';
    } else if (lowerFunc.includes('filtervalues')) {
      return 'Retrieves filter options for upcoming transactions listing';
    } else if (lowerFunc.includes('get')) {
      return 'Retrieves upcoming scheduled transactions with filters';
    }
  }
  
  // Completed transactions
  if (lowerFunc.includes('completedtransaction')) {
    if (lowerFunc.includes('filtervalues')) {
      return 'Retrieves filter options for completed transactions listing';
    }
  }
  
  // Update transaction
  if (lowerFunc.includes('updatetransaction') && lowerFunc.includes('withid')) {
    return 'Updates finance transaction data by transaction ID';
  }
  
  // AECB (credit bureau) operations
  if (lowerFunc.includes('aecb')) {
    if (lowerFunc.includes('filtervalues')) {
      return 'Retrieves AECB credit bureau report filter options';
    } else if (lowerFunc.includes('filedata') || lowerFunc.includes('file')) {
      return 'Retrieves AECB credit bureau file data by ID';
    } else if (lowerFunc.includes('contractdata') || lowerFunc.includes('contract')) {
      if (lowerFunc.includes('update')) {
        return 'Updates AECB credit bureau contract submission details';
      } else if (lowerFunc.includes('disbursal')) {
        return 'Retrieves contract data with disbursement files for AECB';
      }
      return 'Retrieves AECB credit bureau contract data by FI';
    } else if (lowerFunc.includes('overdue')) {
      return 'Retrieves AECB overdue entry submission status';
    }
  }
  
  // Overdue operations
  if (lowerFunc.includes('overdue') && lowerFunc.includes('finance')) {
    return 'Retrieves overdue finance applications for collection management';
  }
  
  // Monthly settled data
  if (lowerFunc.includes('monthlysettled')) {
    return 'Retrieves monthly settled transaction data for reporting';
  }
  
  // Due date operations
  if (lowerFunc.includes('duedate')) {
    return 'Retrieves finance application payment due date';
  }
  
  // Transaction date range queries
  if (lowerFunc.includes('daterange') || lowerFunc.includes('trxdate')) {
    if (lowerFunc.includes('finance')) {
      return 'Retrieves finance applications by transaction date range';
    } else if (lowerFunc.includes('trxdetails') || lowerFunc.includes('latest')) {
      return 'Retrieves latest transaction details within date range';
    }
  }
  
  // Generic patterns based on verb
  const action = extractDbAction(lowerFunc);
  const entity = extractEntity(lowerFunc, fileName);
  
  if (action) {
    return `${action} ${entity} data in database`;
  }
  
  return `Queries ${entity} data from database`;
}

function generateServiceDescription(functionName, fileName, code) {
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerCode = code.toLowerCase();
  
  // Look for business logic patterns
  if (lowerCode.includes('validate') || lowerCode.includes('validation')) {
    return `Validates ${extractEntity(functionName, fileName)} with business rules`;
  }
  
  if (lowerCode.includes('calculate') || lowerCode.includes('compute')) {
    return `Calculates ${extractEntity(functionName, fileName)} amounts and rates`;
  }
  
  if (lowerCode.includes('email') || lowerCode.includes('notification') || lowerCode.includes('send')) {
    return `Sends ${extractEntity(functionName, fileName)} notification to stakeholders`;
  }
  
  if (lowerCode.includes('approve') || lowerCode.includes('approval')) {
    return `Processes ${extractEntity(functionName, fileName)} approval workflow`;
  }
  
  if (lowerCode.includes('reject')) {
    return `Processes ${extractEntity(functionName, fileName)} rejection with comments`;
  }
  
  const action = extractServiceAction(lowerFunc);
  const entity = extractEntity(lowerFunc, fileName);
  
  return `${action} ${entity} business logic processing`;
}

function generateControllerDescription(functionName, fileName, code) {
  const lowerFunc = (functionName || '').toLowerCase();
  const action = extractControllerAction(lowerFunc);
  const entity = extractEntity(lowerFunc, fileName);
  
  return `Handles ${action} request for ${entity}`;
}

function generateMiddlewareDescription(functionName, fileName, code) {
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerFile = fileName.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lowerFunc.includes('auth') || lowerFile.includes('auth') || lowerCode.includes('authenticate')) {
    return 'Authentication middleware verifying user credentials and session';
  }
  
  if (lowerFunc.includes('permission') || lowerFunc.includes('authorize') || lowerCode.includes('permission')) {
    return 'Authorization middleware checking user role-based permissions';
  }
  
  if (lowerFunc.includes('ratelimit') || lowerFunc.includes('rate_limit')) {
    return 'Rate limiting middleware restricting API request frequency';
  }
  
  if (lowerFunc.includes('validate') || lowerCode.includes('validate')) {
    return 'Validation middleware checking request payload structure';
  }
  
  if (lowerFunc.includes('error') || lowerFile.includes('error')) {
    return 'Error handling middleware formatting and logging exceptions';
  }
  
  if (lowerFunc.includes('log') || lowerFile.includes('log')) {
    return 'Logging middleware recording request and response details';
  }
  
  if (lowerFunc.includes('cors')) {
    return 'CORS middleware configuring cross-origin resource sharing';
  }
  
  return `Middleware for ${extractDomain(fileName)} request processing`;
}

function generateUtilDescription(functionName, fileName, code) {
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerFile = fileName.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lowerFunc.includes('date') || lowerFile.includes('date')) {
    return 'Utility for date formatting and timezone conversion';
  }
  
  if (lowerFunc.includes('format') || lowerFunc.includes('transform')) {
    return 'Utility for data formatting and transformation';
  }
  
  if (lowerFunc.includes('validate') || lowerFunc.includes('validation')) {
    return 'Utility for input validation and sanitization';
  }
  
  if (lowerFunc.includes('encrypt') || lowerFunc.includes('hash') || lowerFunc.includes('crypto')) {
    return 'Utility for encryption and cryptographic hashing';
  }
  
  if (lowerFunc.includes('email') || lowerFile.includes('email')) {
    return 'Utility for email composition and delivery';
  }
  
  if (lowerFunc.includes('pdf')) {
    return 'Utility for PDF document generation and export';
  }
  
  if (lowerFunc.includes('csv') || lowerFunc.includes('excel')) {
    return 'Utility for spreadsheet data export and import';
  }
  
  if (lowerFunc.includes('file') || lowerFunc.includes('upload')) {
    return 'Utility for file upload and cloud storage';
  }
  
  if (lowerFunc.includes('currency') || lowerFunc.includes('money')) {
    return 'Utility for currency formatting and conversion';
  }
  
  if (lowerFunc.includes('number')) {
    return 'Utility for number formatting and rounding';
  }
  
  return `Utility helper functions for ${extractDomain(fileName)}`;
}

function extractDbAction(lowerFunc) {
  if (lowerFunc.startsWith('get') || lowerFunc.startsWith('fetch') || lowerFunc.startsWith('find')) {
    return 'Retrieves';
  }
  if (lowerFunc.startsWith('getall') || lowerFunc.startsWith('list')) {
    return 'Lists';
  }
  if (lowerFunc.startsWith('create') || lowerFunc.startsWith('insert') || lowerFunc.startsWith('add')) {
    return 'Creates';
  }
  if (lowerFunc.startsWith('update') || lowerFunc.startsWith('set') || lowerFunc.startsWith('modify')) {
    return 'Updates';
  }
  if (lowerFunc.startsWith('delete') || lowerFunc.startsWith('remove')) {
    return 'Deletes';
  }
  if (lowerFunc.includes('decrement')) {
    return 'Decrements';
  }
  if (lowerFunc.includes('increment')) {
    return 'Increments';
  }
  if (lowerFunc.includes('upsert')) {
    return 'Upserts';
  }
  return null;
}

function extractServiceAction(lowerFunc) {
  if (lowerFunc.includes('process')) return 'Processes';
  if (lowerFunc.includes('calculate') || lowerFunc.includes('compute')) return 'Calculates';
  if (lowerFunc.includes('validate') || lowerFunc.includes('verify')) return 'Validates';
  if (lowerFunc.includes('send') || lowerFunc.includes('notify')) return 'Sends';
  if (lowerFunc.includes('approve')) return 'Approves';
  if (lowerFunc.includes('reject')) return 'Rejects';
  if (lowerFunc.includes('submit')) return 'Submits';
  if (lowerFunc.includes('create')) return 'Creates';
  if (lowerFunc.includes('update')) return 'Updates';
  if (lowerFunc.includes('generate')) return 'Generates';
  return 'Processes';
}

function extractControllerAction(lowerFunc) {
  if (lowerFunc.includes('create')) return 'creation';
  if (lowerFunc.includes('update')) return 'update';
  if (lowerFunc.includes('delete')) return 'deletion';
  if (lowerFunc.includes('get') || lowerFunc.includes('fetch')) return 'retrieval';
  if (lowerFunc.includes('list')) return 'listing';
  if (lowerFunc.includes('validate')) return 'validation';
  if (lowerFunc.includes('approve')) return 'approval';
  if (lowerFunc.includes('reject')) return 'rejection';
  if (lowerFunc.includes('submit')) return 'submission';
  return 'request';
}

function extractEntity(functionName, fileName) {
  const lowerFunc = (functionName || '').toLowerCase();
  const lowerFile = fileName.toLowerCase();
  
  // Specific entities
  if (lowerFunc.includes('creditfacility') || lowerFunc.includes('credit_facility') || lowerFile.includes('credit_facility')) {
    return 'credit facility';
  }
  if (lowerFunc.includes('financeapplication') || lowerFunc.includes('finance_application') || lowerFunc.includes('finance') || lowerFile.includes('finance')) {
    return 'finance application';
  }
  if (lowerFunc.includes('transaction') || lowerFunc.includes('txn')) {
    return 'transaction';
  }
  if (lowerFunc.includes('organisation') || lowerFunc.includes('organization') || lowerFunc.includes('org')) {
    return 'organisation';
  }
  if (lowerFunc.includes('company') || lowerFunc.includes('companies')) {
    return 'company';
  }
  if (lowerFunc.includes('counterparty') || lowerFunc.includes('counter_party') || lowerFunc.includes('tradingpartner')) {
    return 'counter-party';
  }
  if (lowerFunc.includes('user') || lowerFunc.includes('member')) {
    return 'user';
  }
  if (lowerFunc.includes('invoice')) {
    return 'invoice';
  }
  if (lowerFunc.includes('payment')) {
    return 'payment';
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
  if (lowerFunc.includes('limit')) {
    return 'credit limit';
  }
  if (lowerFunc.includes('bank')) {
    return 'bank account';
  }
  if (lowerFunc.includes('document') || lowerFunc.includes('doc')) {
    return 'document';
  }
  if (lowerFunc.includes('contract') || lowerFunc.includes('agreement')) {
    return 'contract';
  }
  if (lowerFunc.includes('rate')) {
    return 'rate';
  }
  if (lowerFunc.includes('fee')) {
    return 'fee';
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
    return 'KYC verification';
  }
  if (lowerFunc.includes('compliance')) {
    return 'compliance check';
  }
  
  // Use file name as fallback
  return fileName.replace(/_/g, ' ').replace(/-/g, ' ');
}

function extractDomain(fileName) {
  const lowerFile = fileName.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
  
  if (lowerFile.includes('credit') || lowerFile.includes('facility')) {
    return 'credit facility';
  }
  if (lowerFile.includes('finance')) {
    return 'finance application';
  }
  if (lowerFile.includes('organisation') || lowerFile.includes('organization')) {
    return 'organisation';
  }
  if (lowerFile.includes('transaction')) {
    return 'transaction';
  }
  if (lowerFile.includes('auth')) {
    return 'authentication';
  }
  if (lowerFile.includes('user')) {
    return 'user';
  }
  
  return lowerFile;
}

// Process all chunks
console.log('Generating descriptions...');
const results = chunks.map((chunk, index) => {
  if (index % 100 === 0) {
    console.log(`Processed ${index}/${chunks.length}...`);
  }
  
  const description = generateDescription(chunk);
  
  // Ensure max 20 words
  const words = description.split(' ');
  const finalDescription = words.length > 20 ? words.slice(0, 20).join(' ') : description;
  
  return {
    id: chunk.id,
    description: finalDescription
  };
});

// Write output
console.log('Writing output file...');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`Successfully wrote ${results.length} descriptions to ${outputPath}`);
