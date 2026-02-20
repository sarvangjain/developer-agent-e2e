'use strict';

const { execSync } = require('child_process');
const config = require('../../indexer/config');

function grepCodebase(pattern, fileGlob = '*.js') {
  try {
    const cmd = `grep -rn --include='${fileGlob}' '${pattern.replace(/'/g, "\\'")}' backend/`;
    const output = execSync(cmd, {
      cwd: config.targetCodebase,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024,  // 1MB
      timeout: 10000,
    });

    const lines = output.split('\n').filter(l => l.trim());
    const results = lines.slice(0, 50).map(line => {
      const match = line.match(/^(.+?):(\d+):(.+)$/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          content: match[3].trim(),
        };
      }
      return { raw: line };
    });

    return {
      pattern,
      total_matches: lines.length,
      showing: results.length,
      results,
    };
  } catch (err) {
    if (err.status === 1) {
      // grep returns exit code 1 for no matches
      return { pattern, total_matches: 0, results: [] };
    }
    return { error: `grep failed: ${err.message}` };
  }
}

module.exports = { grepCodebase };
