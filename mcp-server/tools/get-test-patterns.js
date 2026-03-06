'use strict';

/**
 * get-test-patterns.js
 * 
 * MCP tool for finding existing test patterns by domain.
 * Searches the test directory for test files matching a domain,
 * and returns their structure, mocks, and patterns.
 * 
 * Critical for Checkpoint 3 (Test Strategy) — the agent needs to see
 * how existing features are tested to follow the same patterns.
 */

const fs = require('fs');
const path = require('path');
const config = require('../../indexer/config');

const TEST_DIR = path.join(config.targetCodebase, 'backend', 'test');

/**
 * Find test files matching a domain keyword.
 * Searches both unit and component test directories.
 */
function findTestFiles(domain) {
  const results = [];
  const searchDirs = ['unit', 'component'];

  for (const dir of searchDirs) {
    const fullDir = path.join(TEST_DIR, dir);
    if (!fs.existsSync(fullDir)) continue;
    walkDir(fullDir, domain.toLowerCase(), dir, results);
  }

  return results;
}

function walkDir(dir, keyword, testType, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check if directory name matches domain
      if (entry.name.toLowerCase().includes(keyword) || entry.name === 'mock') {
        walkDir(fullPath, keyword, testType, results);
      } else {
        // Still recurse but don't add non-matching dirs' files
        walkDir(fullPath, keyword, testType, results);
      }
    } else if (entry.name.endsWith('.spec.js') || entry.name.endsWith('.test.js')) {
      const relativePath = path.relative(TEST_DIR, fullPath);
      // Include if file name or parent dir matches keyword
      if (relativePath.toLowerCase().includes(keyword)) {
        results.push({
          path: `backend/test/${relativePath}`,
          type: testType,
          name: entry.name,
        });
      }
    }
  }
}

/**
 * Extract test patterns from a test file.
 * Reads the file and extracts: describe blocks, mock setup, key assertions.
 */
function extractTestPatterns(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(config.targetCodebase, filePath);

  if (!fs.existsSync(absolutePath)) {
    return { error: `File not found: ${filePath}` };
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split('\n');

  // Extract mocks
  const mocks = [];
  const mockRegex = /jest\.mock\(['"`](.+?)['"`]/g;
  let match;
  while ((match = mockRegex.exec(content)) !== null) {
    mocks.push(match[1]);
  }

  // Extract describe blocks
  const describes = [];
  const describeRegex = /describe\(['"`](.+?)['"`]/g;
  while ((match = describeRegex.exec(content)) !== null) {
    describes.push(match[1]);
  }

  // Extract test/it blocks
  const tests = [];
  const testRegex = /(?:it|test)\(['"`](.+?)['"`]/g;
  while ((match = testRegex.exec(content)) !== null) {
    tests.push(match[1]);
  }

  // Extract beforeEach/afterEach patterns
  const hasBeforeEach = content.includes('beforeEach');
  const hasAfterEach = content.includes('afterEach');
  const hasBeforeAll = content.includes('beforeAll');
  const hasAfterAll = content.includes('afterAll');

  // Extract assertion patterns
  const assertionPatterns = new Set();
  const assertRegex = /expect\(.+?\)\.(to\w+|not\.\w+)/g;
  while ((match = assertRegex.exec(content)) !== null) {
    assertionPatterns.add(match[1]);
  }

  return {
    path: filePath,
    line_count: lines.length,
    mocks,
    describes,
    tests,
    setup: {
      beforeEach: hasBeforeEach,
      afterEach: hasAfterEach,
      beforeAll: hasBeforeAll,
      afterAll: hasAfterAll,
    },
    assertion_patterns: [...assertionPatterns],
    // Include first 100 lines as preview (mock setup is usually at top)
    preview: lines.slice(0, 100).join('\n'),
  };
}

/**
 * Get test patterns for a domain.
 * Returns matching test files with their patterns extracted.
 */
function getTestPatterns(domain) {
  const files = findTestFiles(domain);

  if (files.length === 0) {
    return {
      domain,
      message: `No test files found matching "${domain}". Try a broader keyword.`,
      test_files: [],
    };
  }

  const patterns = files.map(f => extractTestPatterns(f.path));

  // Summary
  const allMocks = new Set();
  for (const p of patterns) {
    if (p.mocks) p.mocks.forEach(m => allMocks.add(m));
  }

  return {
    domain,
    test_files_found: files.length,
    common_mocks: [...allMocks],
    files: patterns,
  };
}

module.exports = { getTestPatterns, findTestFiles, extractTestPatterns };
