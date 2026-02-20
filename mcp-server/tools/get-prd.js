'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../../indexer/config');

const PRD_HISTORY_DIR = path.join(config.projectRoot, 'prds', 'history');

function getPrd(featureName) {
  // Try exact file match
  const candidates = [
    path.join(PRD_HISTORY_DIR, `${featureName}.md`),
    path.join(PRD_HISTORY_DIR, featureName),
  ];

  // Also search by pattern
  if (fs.existsSync(PRD_HISTORY_DIR)) {
    const files = fs.readdirSync(PRD_HISTORY_DIR);
    const match = files.find(f =>
      f.toLowerCase().includes(featureName.toLowerCase().replace(/\s+/g, '-'))
    );
    if (match) candidates.push(path.join(PRD_HISTORY_DIR, match));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return {
        feature_name: featureName,
        path: candidate,
        content: fs.readFileSync(candidate, 'utf-8'),
      };
    }
  }

  return { error: `PRD not found for feature: ${featureName}` };
}

module.exports = { getPrd };
