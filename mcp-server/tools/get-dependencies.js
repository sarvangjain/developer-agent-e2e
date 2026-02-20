'use strict';

const { getDependencies: queryDeps } = require('../db/symbol-client');

function getDependencies(filePath, direction = 'imports', depth = 2) {
  const deps = queryDeps(filePath, direction, depth);
  return {
    start_file: filePath,
    direction,
    depth,
    count: deps.length,
    files: deps,
  };
}

module.exports = { getDependencies };
