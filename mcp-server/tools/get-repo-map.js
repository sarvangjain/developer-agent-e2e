'use strict';

const fs = require('fs');
const path = require('path');

const REPO_MAP_PATH = path.join(__dirname, '..', '..', 'index', 'repo-map.txt');

function getRepoMap() {
  if (!fs.existsSync(REPO_MAP_PATH)) {
    return { error: 'repo-map.txt not found. Run the indexer first.' };
  }
  return { content: fs.readFileSync(REPO_MAP_PATH, 'utf-8') };
}

module.exports = { getRepoMap };
