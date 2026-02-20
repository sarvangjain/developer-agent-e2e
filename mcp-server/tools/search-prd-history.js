'use strict';

const { searchPrdHistory: qdrantSearch } = require('../db/qdrant-client');

async function searchPrdHistory(query, limit = 10) {
  const results = await qdrantSearch(query, limit);
  if (results.length === 0) {
    return { message: 'No PRD history indexed yet. Run index-prds.js to add historical PRDs.', results: [] };
  }
  return { count: results.length, results };
}

module.exports = { searchPrdHistory };
