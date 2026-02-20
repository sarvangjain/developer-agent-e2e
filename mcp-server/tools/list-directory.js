'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../../indexer/config');

function listDirectory(dirPath) {
  const absolute = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(config.targetCodebase, dirPath);

  if (!fs.existsSync(absolute)) {
    return { error: `Directory not found: ${dirPath}` };
  }

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  return {
    path: dirPath,
    entries: entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
  };
}

module.exports = { listDirectory };
