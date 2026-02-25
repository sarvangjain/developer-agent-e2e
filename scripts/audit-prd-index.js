'use strict';

/**
 * Quick audit of PRD history index quality.
 * Checks: section distribution, content quality, search accuracy.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const http = require('http');
const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://127.0.0.1:11434';
const COLLECTION = 'prd_history';

const qdrant = new QdrantClient({ url: QDRANT_URL });

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: parsed.hostname, port: parsed.port, path: parsed.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        else resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function embedQuery(text) {
  const data = await httpPost(`${OLLAMA_URL}/api/embed`, { model: 'nomic-embed-text', input: text });
  return data.embeddings[0];
}

async function audit() {
  console.log('=== PRD Index Audit ===\n');

  // 1. Collection stats
  const info = await qdrant.getCollection(COLLECTION);
  console.log(`Collection: ${info.points_count} points\n`);

  // 2. Scroll all points to check section distribution
  const allPoints = await qdrant.scroll(COLLECTION, { limit: 100, with_payload: true });
  
  // Group by feature
  const byFeature = {};
  const bySectionName = {};
  const textLengths = [];
  
  for (const point of allPoints.points) {
    const p = point.payload;
    if (!byFeature[p.feature_name]) byFeature[p.feature_name] = [];
    byFeature[p.feature_name].push(p.section_name);
    bySectionName[p.section_name] = (bySectionName[p.section_name] || 0) + 1;
    textLengths.push(p.text.length);
  }

  // 3. Feature breakdown
  console.log('--- Sections per Feature ---');
  for (const [feature, sections] of Object.entries(byFeature)) {
    console.log(`\n  ${feature} (${sections.length} sections):`);
    for (const s of sections) {
      console.log(`    - ${s}`);
    }
  }

  // 4. Section name distribution (are we getting meaningful splits?)
  console.log('\n--- Section Names (frequency) ---');
  const sorted = Object.entries(bySectionName).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) {
    console.log(`  ${name}: ${count}`);
  }

  // 5. Text length stats
  const avg = Math.round(textLengths.reduce((a, b) => a + b, 0) / textLengths.length);
  const min = Math.min(...textLengths);
  const max = Math.max(...textLengths);
  const tiny = textLengths.filter(l => l < 100).length;
  console.log(`\n--- Text Lengths ---`);
  console.log(`  avg: ${avg} chars, min: ${min}, max: ${max}`);
  console.log(`  tiny (<100 chars): ${tiny}`);

  // 6. Search quality tests
  console.log('\n--- Search Quality Tests ---');
  
  const tests = [
    { query: 'credit note automation Oracle integration', expect: 'CreditNoteAutomation' },
    { query: 'facility closure workflow', expect: 'CreditFacilityClosure' },
    { query: 'preshipment financing', expect: 'PreshipmentFinancing' },
    { query: 'multi currency credit facility', expect: 'MultiCurrency' },
    { query: 'buy sell platform enhancement', expect: 'Buy Sell' },
    { query: 'financial assessment module', expect: 'FinancialAssessment' },
    { query: 'transaction summary widget', expect: 'TransactionSummary' },
  ];

  for (const test of tests) {
    const embedding = await embedQuery(test.query);
    const results = await qdrant.search(COLLECTION, {
      vector: embedding, limit: 3, with_payload: true,
    });

    const topFeature = results[0]?.payload?.feature_name || 'NONE';
    const match = topFeature.includes(test.expect) ? '✅' : '❌';
    console.log(`\n  Query: "${test.query}"`);
    console.log(`  Expected: ${test.expect}`);
    console.log(`  Top result: ${match} ${topFeature} — "${results[0]?.payload?.section_name}"`);
    console.log(`    Score: ${results[0]?.score?.toFixed(4)}`);
    if (results[1]) {
      console.log(`  #2: ${results[1]?.payload?.feature_name} — "${results[1]?.payload?.section_name}" (${results[1]?.score?.toFixed(4)})`);
    }
  }
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
