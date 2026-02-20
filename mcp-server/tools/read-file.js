'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../../indexer/config');

function readFile(filePath) {
  // Resolve relative to codebase root
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(config.targetCodebase, filePath);

  if (!fs.existsSync(absolute)) {
    return { error: `File not found: ${filePath}` };
  }

  const content = fs.readFileSync(absolute, 'utf-8');
  return {
    path: filePath,
    content,
    lines: content.split('\n').length,
  };
}

module.exports = { readFile };
