'use strict';

const { getSymbolDetails } = require('../db/symbol-client');

function getSymbol(name) {
  const results = getSymbolDetails(name);
  if (!results || results.length === 0) {
    return { error: `Symbol '${name}' not found` };
  }
  return { symbols: results };
}

module.exports = { getSymbol };
