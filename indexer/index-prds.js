'use strict';

/**
 * index-prds.js
 *
 * Phase 5: Index historical PRDs into Qdrant for semantic search.
 *
 * Reads all .md files from prds/history/, chunks them by section,
 * extracts metadata (feature name, date, stakeholders), embeds each
 * section, and stores in a separate Qdrant 'prd_history' collection.
 *
 * Handles real-world PRD formats that don't follow a strict template —
 * splits on markdown headings and major structural markers.
 *
 * Usage:
 *   node indexer/index-prds.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { QdrantClient } = require('@qdrant/js-client-rest');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PRD_HISTORY_DIR = path.join(__dirname, '..', 'prds', 'history');
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';
const COLLECTION = 'prd_history';
const EMBEDDING_DIMENSIONS = 768;
const MAX_EMBED_CHARS = 6000;

const qdrant = new QdrantClient({ url: QDRANT_URL });

// ---------------------------------------------------------------------------
// HTTP helper (Node 18.14 compatible)
// ---------------------------------------------------------------------------

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
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

async function embedSingle(text) {
  const truncated = text.length > MAX_EMBED_CHARS ? text.slice(0, MAX_EMBED_CHARS) : text;
  const data = await httpPost(`${OLLAMA_URL}/api/embed`, {
    model: EMBEDDING_MODEL,
    input: truncated,
  });
  return data.embeddings[0];
}

function toUuid(str) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return [
    hash.slice(0, 8), hash.slice(8, 12),
    '4' + hash.slice(13, 16), '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

// ---------------------------------------------------------------------------
// PRD metadata extraction
// ---------------------------------------------------------------------------

/**
 * Extract feature name from the PRD content.
 * Strategy: filename is the most reliable source for these converted PRDs.
 * Content-based extraction is a fallback.
 */
function extractFeatureName(content, filename) {
  // 1. Best source: derive from filename (most reliable for converted PRDs)
  const fromFilename = filename
    .replace(/^_MConverter\.eu_/, '')
    .replace(/^PRD[_-]?/i, '')
    .replace(/\.md$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  
  if (fromFilename.length > 3) return fromFilename;

  // 2. Try "Module" field in table (common in DP World PRDs)
  const moduleMatch = content.match(/\|\s*Module\s*\|\s*(.{5,80})\s*\|/i);
  if (moduleMatch) return moduleMatch[1].trim();

  // 3. Try first line that looks like a title:
  //    - Not a table row (no |)
  //    - Not HTML (<)
  //    - Not a header keyword (STAKEHOLDERS, DOCUMENTATION, etc.)
  //    - Between 5-80 chars
  const skipWords = ['stakeholder', 'documentation', 'timeline', 'document', 
                     'version', 'table of contents', 'definitions', 'name'];
  const lines = content.split('\n').filter(l => l.trim());
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim()
      .replace(/^[#*\s]+/, '')
      .replace(/\*\*/g, '')
      .replace(/\{[^}]+\}/g, '') // remove {#anchors}
      .trim();
    if (trimmed.length >= 5 && trimmed.length <= 80 &&
        !trimmed.startsWith('|') && !trimmed.startsWith('<') &&
        !skipWords.some(w => trimmed.toLowerCase().startsWith(w))) {
      return trimmed;
    }
  }

  return fromFilename || filename;
}

/**
 * Extract date from PRD content.
 */
function extractDate(content) {
  // Look for dates in tables or text: DD-Mon-YY, YYYY-MM-DD, DD/MM/YYYY
  const datePatterns = [
    /(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/,
    /(\d{4}[-\/]\d{2}[-\/]\d{2})/,
    /Created on\s*\|?\s*(\S+)/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return 'unknown';
}

/**
 * Extract outcome/status if mentioned.
 */
function extractOutcome(content) {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('shipped') || lowerContent.includes('deployed') || lowerContent.includes('released')) return 'shipped';
  if (lowerContent.includes('cancelled') || lowerContent.includes('deprecated')) return 'cancelled';
  if (lowerContent.includes('in progress') || lowerContent.includes('development queue')) return 'in_progress';
  return 'shipped'; // default assumption for historical PRDs
}

// ---------------------------------------------------------------------------
// PRD sectioning
// ---------------------------------------------------------------------------

/**
 * Split a PRD into semantic sections.
 *
 * Strategy: split on markdown headings, bold headers, and structural markers
 * commonly found in enterprise PRDs (BACKGROUND, REQUIREMENTS, etc.)
 */
function chunkPrd(content, filename) {
  const featureName = extractFeatureName(content, filename);
  const date = extractDate(content);
  const outcome = extractOutcome(content);

  const sections = [];
  const lines = content.split('\n');

  let currentSection = null;
  let currentLines = [];
  let sectionCounter = 0;

  // Section break patterns
  const sectionBreakPatterns = [
    /^#{1,3}\s+(.+)/,                          // Markdown headings
    /^\*\*([A-Z][A-Z\s]{3,}):?\*\*/,          // **BOLD CAPS HEADERS:**
    /^([A-Z][A-Z\s]{5,}):?\s*$/,              // ALL CAPS LINES
    /^(BACKGROUND|REQUIREMENTS?|PROBLEM STATEMENT|SCOPE|SCOPE LIMITATION|CURRENT PROCESS|REVISED PROCESS|APPENDIX|DEFINITIONS?|TIMELINES?|CHANGE REQUEST|EMAIL NOTIFICATIONS?|REPORTING REQUIREMENT|ASSUMPTIONS?|ACCEPTANCE CRITERIA)/i,
  ];

  /**
   * Clean a section name: remove anchors, normalize case, cap length.
   */
  function cleanSectionName(raw) {
    let name = raw
      .replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/:$/, '')
      .replace(/\{[^}]*\}/g, '')        // Remove {#anchor} fragments
      .replace(/\s+/g, ' ')             // Collapse whitespace
      .trim();

    // Cap at 60 chars — anything longer is not a real section name
    if (name.length > 60) return null;

    // Normalize to Title Case
    name = name.split(' ').map(w => {
      if (w.length <= 2) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');

    return name;
  }

  function flushSection() {
    if (currentSection && currentLines.length > 0) {
      const text = currentLines.join('\n').trim();
      if (text.length > 100) { // Skip tiny sections (<100 chars = no real content)
        sectionCounter++;
        // Disambiguate duplicate section names by appending counter
        const sectionId = `${currentSection} [${sectionCounter}]`;
        sections.push({
          section_name: currentSection,
          section_id: sectionId,
          text,
          feature_name: featureName,
          date,
          outcome,
          filename,
        });
      }
    }
    currentLines = [];
  }

  for (const line of lines) {
    let matched = false;

    for (const pattern of sectionBreakPatterns) {
      const match = line.match(pattern);
      if (match) {
        const cleaned = cleanSectionName(match[1]);
        if (cleaned) {
          flushSection();
          currentSection = cleaned;
          matched = true;
        }
        break;
      }
    }

    if (!matched) {
      if (!currentSection) {
        currentSection = 'Overview';
      }
      currentLines.push(line);
    }
  }

  // Flush last section
  flushSection();

  // If no sections were found, treat whole document as one chunk
  if (sections.length === 0) {
    sections.push({
      section_name: 'Full Document',
      section_id: 'Full Document [1]',
      text: content.trim(),
      feature_name: featureName,
      date,
      outcome,
      filename,
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function indexPrds() {
  console.log('[prd-index] starting PRD history indexing...');

  // Find all .md files in history dir
  if (!fs.existsSync(PRD_HISTORY_DIR)) {
    console.log(`[prd-index] no history directory at ${PRD_HISTORY_DIR}`);
    return;
  }

  const files = fs.readdirSync(PRD_HISTORY_DIR)
    .filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('[prd-index] no .md files found in prds/history/');
    return;
  }

  console.log(`[prd-index] found ${files.length} PRD files`);

  // Chunk all PRDs into sections
  const allSections = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(PRD_HISTORY_DIR, file), 'utf-8');
    const sections = chunkPrd(content, file);
    allSections.push(...sections);
    console.log(`  ${file}: ${sections.length} sections, feature="${sections[0]?.feature_name}"`);
  }

  console.log(`[prd-index] total sections: ${allSections.length}`);

  // Create/recreate Qdrant collection
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION);
  if (exists) {
    console.log(`[prd-index] deleting existing collection: ${COLLECTION}`);
    await qdrant.deleteCollection(COLLECTION);
  }

  console.log(`[prd-index] creating collection: ${COLLECTION} (${EMBEDDING_DIMENSIONS} dims)`);
  await qdrant.createCollection(COLLECTION, {
    vectors: {
      size: EMBEDDING_DIMENSIONS,
      distance: 'Cosine',
    },
  });

  // Embed and store each section
  const points = [];
  let embedded = 0;

  for (const section of allSections) {
    // Prepend feature name prominently for better embedding match.
    // Repeat feature name to boost its weight in the embedding vector.
    const textForEmbedding = [
      `Feature: ${section.feature_name}`,
      `PRD: ${section.feature_name}`,
      `Section: ${section.section_name}`,
      `Module: ${section.feature_name} - ${section.section_name}`,
      '',
      section.text,
    ].join('\n');

    try {
      const embedding = await embedSingle(textForEmbedding);
      const id = toUuid(`${section.filename}#${section.section_name}#${embedded}`);

      points.push({
        id,
        vector: embedding,
        payload: {
          feature_name: section.feature_name,
          section_name: section.section_name,
          text: section.text,
          date: section.date,
          outcome: section.outcome,
          filename: section.filename,
        },
      });
    } catch (err) {
      console.warn(`[prd-index] skipping section "${section.section_name}" from ${section.filename}: ${err.message.slice(0, 60)}`);
    }

    embedded++;
    if (embedded % 10 === 0 || embedded === allSections.length) {
      process.stdout.write(`\r[prd-index] embedded: ${embedded}/${allSections.length}`);
    }
  }

  console.log('');

  // Upsert into Qdrant
  if (points.length > 0) {
    console.log(`[prd-index] upserting ${points.length} points into Qdrant...`);
    
    // Batch upsert
    const BATCH_SIZE = 50;
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);
      await qdrant.upsert(COLLECTION, { wait: true, points: batch });
    }

    const info = await qdrant.getCollection(COLLECTION);
    console.log(`[prd-index] Qdrant collection '${COLLECTION}': ${info.points_count} points`);
  }

  // Summary
  console.log('\n[prd-index] === Summary ===');
  const features = [...new Set(allSections.map(s => s.feature_name))];
  for (const feature of features) {
    const count = allSections.filter(s => s.feature_name === feature).length;
    const date = allSections.find(s => s.feature_name === feature)?.date;
    console.log(`  ${feature} (${date}): ${count} sections`);
  }

  console.log(`\n[prd-index] done. ${points.length} sections indexed from ${files.length} PRDs.`);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = { indexPrds, chunkPrd };

if (require.main === module) {
  indexPrds().catch(err => {
    console.error('[prd-index] fatal error:', err);
    process.exit(1);
  });
}
