'use strict';

/**
 * parse-codebase.js
 * 
 * Walks the target codebase, parses every .js file with tree-sitter,
 * and extracts structural information:
 *   - Functions (name, params, line range, exported?)
 *   - Classes (name, methods, line range)
 *   - Exports (what each file exports)
 *   - Imports (require/import statements, resolved via module aliases)
 *   - Routes (CargoFin's custom route object pattern)
 * 
 * Output: writes index/parsed-files.json
 *         (consumed by build-symbol-map.js and build-repo-map.js)
 * 
 * Usage:
 *   node indexer/parse-codebase.js
 *   (reads config from indexer/config.js)
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// ---------------------------------------------------------------------------
// Config — loaded from indexer/config.js
// ---------------------------------------------------------------------------
const config = require('./config');

// ---------------------------------------------------------------------------
// Module alias resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a require path that uses module-alias (e.g. @main/controllers/auth)
 * to a real filesystem-relative path from the backend root.
 * 
 * @param {string} requirePath - The raw require string (e.g. '@main/routes/auth')
 * @param {string} currentFile - Absolute path of the file containing the require
 * @returns {string|null} - Resolved absolute path, or null if can't resolve
 */
function resolveImportPath(requirePath, currentFile) {
  // Skip node_modules packages (no leading . or @alias)
  if (!requirePath.startsWith('.') && !requirePath.startsWith('@')) {
    return null; // npm package, not a local file
  }

  const aliases = config.moduleAliases;
  const backendRoot = config.backendRoot;

  // Check if it matches a module alias
  for (const [alias, aliasPath] of Object.entries(aliases)) {
    if (requirePath.startsWith(alias + '/') || requirePath === alias) {
      const remainder = requirePath.slice(alias.length);
      const resolved = path.join(backendRoot, aliasPath, remainder);
      return resolveToFile(resolved);
    }
  }

  // Relative path — resolve from current file's directory
  if (requirePath.startsWith('.')) {
    const dir = path.dirname(currentFile);
    const resolved = path.resolve(dir, requirePath);
    return resolveToFile(resolved);
  }

  // @-scoped npm package (e.g. @azure/cosmos) — skip
  if (requirePath.startsWith('@')) {
    return null;
  }

  return null;
}

/**
 * Given a resolved path (without extension), try to find the actual file.
 * Node.js resolution: try .js, then /index.js
 */
function resolveToFile(resolved) {
  // Already has .js extension
  if (resolved.endsWith('.js') && fs.existsSync(resolved)) {
    return resolved;
  }
  // Try adding .js
  if (fs.existsSync(resolved + '.js')) {
    return resolved + '.js';
  }
  // Try as directory with index.js
  if (fs.existsSync(path.join(resolved, 'index.js'))) {
    return path.join(resolved, 'index.js');
  }
  // Try adding .json
  if (fs.existsSync(resolved + '.json')) {
    return resolved + '.json';
  }
  // Can't resolve — return best guess with .js
  return resolved.endsWith('.js') ? resolved : resolved + '.js';
}

// ---------------------------------------------------------------------------
// Tree-sitter initialization
// ---------------------------------------------------------------------------

let Parser;
let JavaScript;

async function initTreeSitter() {
  const TreeSitter = require('web-tree-sitter');
  await TreeSitter.init();
  Parser = new TreeSitter();

  // web-tree-sitter needs a .wasm grammar file
  // tree-sitter-javascript ships one as tree-sitter-javascript.wasm
  const wasmPath = findJavaScriptWasm();
  JavaScript = await TreeSitter.Language.load(wasmPath);
  Parser.setLanguage(JavaScript);

  console.log('[parse] tree-sitter initialized with JavaScript grammar');
}

/**
 * Locate the tree-sitter-javascript WASM file.
 * It's typically at node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm
 * but can vary. We check a few locations.
 */
function findJavaScriptWasm() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'tree-sitter-javascript', 'tree-sitter-javascript.wasm'),
    path.join(__dirname, '..', 'grammars', 'tree-sitter-javascript.wasm'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Could not find tree-sitter-javascript.wasm. ' +
    'Make sure tree-sitter-javascript is installed, or place the .wasm file in grammars/'
  );
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

async function discoverFiles() {
  const pattern = path.join(config.targetCodebase, '**', '*.js');

  // Glob ignore patterns must be absolute to match absolute glob paths
  const absoluteIgnores = config.excludePatterns.map(p => {
    if (path.isAbsolute(p)) return p;
    return path.join(config.targetCodebase, p);
  });

  const files = await glob(pattern, {
    ignore: absoluteIgnores,
    nodir: true,
    absolute: true,
  });

  console.log(`[parse] discovered ${files.length} .js files`);
  return files;
}

// ---------------------------------------------------------------------------
// AST extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract all relevant symbols from a parsed tree-sitter AST.
 * 
 * @param {object} tree - tree-sitter parse tree
 * @param {string} source - raw source code
 * @param {string} filePath - absolute file path
 * @returns {object} - { functions, classes, exports, imports, routes }
 */
function extractSymbols(tree, source, filePath) {
  const result = {
    functions: [],
    classes: [],
    exports: [],
    imports: [],
    routes: [],
  };

  const rootNode = tree.rootNode;

  // Walk all top-level and nested nodes
  walkNode(rootNode, source, filePath, result, { depth: 0 });

  return result;
}

/**
 * Recursively walk the AST tree and extract symbols.
 * 
 * FIX 3: Improved recursion — we always recurse into structural nodes (program,
 * expression_statement, etc.) but stop at function/class bodies to avoid
 * extracting inner helper functions as top-level symbols.
 */
function walkNode(node, source, filePath, result, ctx) {
  switch (node.type) {
    case 'function_declaration':
      result.functions.push(extractFunction(node, source, false));
      return; // don't recurse into function body

    case 'class_declaration':
      result.classes.push(extractClass(node, source));
      return; // don't recurse — extractClass handles methods

    case 'expression_statement':
      handleExpressionStatement(node, source, filePath, result);
      break;

    case 'variable_declaration':
    case 'lexical_declaration':
      handleVariableDeclaration(node, source, filePath, result);
      break;
  }

  // Recurse into children — skip function/method bodies but walk everything else
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    const skipTypes = new Set([
      'function_expression', 'arrow_function', 'method_definition',
    ]);
    // Always recurse into program and top-level structural nodes
    // Skip into function bodies (they're handled by extractFunction / extractInlineExportedMethods)
    if (!skipTypes.has(child.type)) {
      walkNode(child, source, filePath, result, { depth: ctx.depth + 1 });
    }
  }
}

/**
 * Extract function info from a function_declaration node.
 */
function extractFunction(node, source, isExported) {
  const nameNode = node.childForFieldName('name');
  const paramsNode = node.childForFieldName('parameters');

  const name = nameNode ? nameNode.text : '<anonymous>';
  const params = paramsNode ? paramsNode.text : '()';

  return {
    type: 'function',
    name,
    params,
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    isExported,
    isAsync: source.slice(node.startIndex, node.startIndex + 6) === 'async ',
  };
}

/**
 * Extract class info including its methods.
 */
function extractClass(node, source) {
  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  const name = nameNode ? nameNode.text : '<anonymous>';
  const methods = [];

  if (bodyNode) {
    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (child.type === 'method_definition') {
        const methodName = child.childForFieldName('name');
        const methodParams = child.childForFieldName('parameters');
        methods.push({
          name: methodName ? methodName.text : '<anonymous>',
          params: methodParams ? methodParams.text : '()',
          startLine: child.startPosition.row + 1,
          endLine: child.endPosition.row + 1,
          isAsync: child.text.startsWith('async '),
        });
      }
    }
  }

  return {
    type: 'class',
    name,
    methods,
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
  };
}

/**
 * Handle expression statements like:
 *   module.exports = { ... }
 *   module.exports = someFunction
 *   exports.name = ...
 */
function handleExpressionStatement(node, source, filePath, result) {
  const expr = node.childForFieldName('expression') || node.firstChild;
  if (!expr) return;

  if (expr.type === 'assignment_expression') {
    handleAssignment(expr, source, filePath, result);
  }

  if (expr.type === 'call_expression') {
    handleCallExpression(expr, source, filePath, result);
  }
}

/**
 * Handle assignment expressions for exports detection.
 */
function handleAssignment(node, source, filePath, result) {
  const left = node.childForFieldName('left');
  const right = node.childForFieldName('right');
  if (!left || !right) return;

  const leftText = left.text;

  // module.exports = ...
  if (leftText === 'module.exports') {
    const exported = extractExportValue(right, source);
    result.exports.push({
      type: 'module.exports',
      value: exported,
      startLine: node.startPosition.row + 1,
    });

    // FIX 1: Extract inline methods from module.exports = { key: async (req, res) => {} }
    if (right.type === 'object') {
      extractInlineExportedMethods(right, source, result);
    }

    // Check if the exported object looks like a route definition
    if (right.type === 'object' || right.type === 'call_expression') {
      const routes = extractRoutes(right, source, filePath, result.imports);
      result.routes.push(...routes);
    }
  }

  // exports.X = ...
  if (leftText.startsWith('exports.')) {
    const name = leftText.slice('exports.'.length);
    result.exports.push({
      type: 'named',
      name,
      startLine: node.startPosition.row + 1,
    });

    // FIX 1b: exports.name = async (req, res) => {} — inline function on named export
    if (right.type === 'function_expression' || right.type === 'arrow_function') {
      const paramsNode = right.childForFieldName('parameters');
      result.functions.push({
        type: 'function',
        name,
        params: paramsNode ? paramsNode.text : '()',
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        isExported: true,
        isAsync: source.slice(right.startIndex, right.startIndex + 6) === 'async ',
      });
    }
  }
}

/**
 * Extract what's being exported.
 */
function extractExportValue(node, source) {
  if (node.type === 'object') {
    // module.exports = { a, b, c } or { a: fn, b: fn }
    const keys = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'pair') {
        const key = child.childForFieldName('key');
        if (key) keys.push(key.text);
      } else if (child.type === 'shorthand_property_identifier') {
        keys.push(child.text);
      }
    }
    return { type: 'object', keys };
  }

  if (node.type === 'identifier') {
    return { type: 'identifier', name: node.text };
  }

  if (node.type === 'function_expression' || node.type === 'arrow_function') {
    return { type: 'function' };
  }

  if (node.type === 'call_expression') {
    // module.exports = (routes => { ... })([...]) — the route aggregator pattern
    return { type: 'call_expression', text: source.slice(node.startIndex, Math.min(node.startIndex + 80, node.endIndex)) };
  }

  return { type: node.type };
}

/**
 * FIX 1: Extract inline method definitions from module.exports = { ... }
 * 
 * Handles the dominant CargoFin pattern:
 *   module.exports = {
 *     loginUser: async (req, res) => { ... },
 *     logoutUser: async (req, res) => { ... },
 *   }
 * 
 * Each key with a function/arrow value is extracted as an exported function.
 * Also handles:
 *   module.exports = {
 *     loginUser: function(req, res) { ... },
 *     logoutUser(req, res) { ... },   // shorthand method
 *   }
 */
function extractInlineExportedMethods(objectNode, source, result) {
  for (let i = 0; i < objectNode.childCount; i++) {
    const child = objectNode.child(i);

    // pair: key: value
    if (child.type === 'pair') {
      const key = child.childForFieldName('key');
      const value = child.childForFieldName('value');
      if (!key || !value) continue;

      const name = key.text;

      // value is arrow_function or function_expression
      if (value.type === 'arrow_function' || value.type === 'function_expression') {
        const paramsNode = value.childForFieldName('parameters');
        const isAsync = source.slice(value.startIndex, value.startIndex + 6) === 'async ';

        // Check if a function with this name already exists (from a top-level declaration)
        const existing = result.functions.find(f => f.name === name);
        if (existing) {
          existing.isExported = true;
        } else {
          result.functions.push({
            type: 'function',
            name,
            params: paramsNode ? paramsNode.text : '()',
            startLine: child.startPosition.row + 1,
            endLine: child.endPosition.row + 1,
            isExported: true,
            isAsync,
          });
        }
      }
    }

    // method_definition (shorthand): { name(params) { ... } }
    if (child.type === 'method_definition') {
      const methodName = child.childForFieldName('name');
      const methodParams = child.childForFieldName('parameters');
      if (methodName) {
        result.functions.push({
          type: 'function',
          name: methodName.text,
          params: methodParams ? methodParams.text : '()',
          startLine: child.startPosition.row + 1,
          endLine: child.endPosition.row + 1,
          isExported: true,
          isAsync: child.text.startsWith('async '),
        });
      }
    }
  }
}

/**
 * Handle variable declarations to find:
 *   const x = require('...')
 *   const { a, b } = require('...')
 *   const fn = function() {}
 *   const fn = () => {}
 */
function handleVariableDeclaration(node, source, filePath, result) {
  for (let i = 0; i < node.childCount; i++) {
    const declarator = node.child(i);
    if (declarator.type !== 'variable_declarator') continue;

    const nameNode = declarator.childForFieldName('name');
    const valueNode = declarator.childForFieldName('value');
    if (!nameNode || !valueNode) continue;

    // Check for require()
    if (isRequireCall(valueNode)) {
      const requirePath = extractRequirePath(valueNode);
      if (requirePath) {
        const resolved = resolveImportPath(requirePath, filePath);
        const importedNames = extractImportedNames(nameNode);

        result.imports.push({
          raw: requirePath,
          resolved,
          names: importedNames,
          startLine: declarator.startPosition.row + 1,
        });
      }
    }

    // Check for function expression or arrow function
    if (valueNode.type === 'function_expression' || valueNode.type === 'arrow_function') {
      const name = nameNode.text;
      const paramsNode = valueNode.childForFieldName('parameters');
      result.functions.push({
        type: 'function',
        name,
        params: paramsNode ? paramsNode.text : '()',
        startLine: declarator.startPosition.row + 1,
        endLine: declarator.endPosition.row + 1,
        isExported: false,
        isAsync: source.slice(valueNode.startIndex, valueNode.startIndex + 6) === 'async ',
      });
    }
  }
}

/**
 * Check if a node is a require() call.
 */
function isRequireCall(node) {
  if (node.type === 'call_expression') {
    const fn = node.childForFieldName('function');
    return fn && fn.text === 'require';
  }
  return false;
}

/**
 * Extract the string argument from require('...')
 */
function extractRequirePath(node) {
  const args = node.childForFieldName('arguments');
  if (!args || args.childCount < 2) return null;

  // arguments node: ( child0=string_literal )
  for (let i = 0; i < args.childCount; i++) {
    const child = args.child(i);
    if (child.type === 'string' || child.type === 'template_string') {
      // Remove quotes / backticks
      let text = child.text;
      text = text.replace(/^['"`]|['"`]$/g, '');
      return text;
    }
  }
  return null;
}

/**
 * Extract the names being imported from a require.
 * Handles: const x = require(...) => ['x']
 *          const { a, b } = require(...) => ['a', 'b']
 */
function extractImportedNames(nameNode) {
  if (nameNode.type === 'identifier') {
    return [nameNode.text];
  }
  if (nameNode.type === 'object_pattern') {
    const names = [];
    for (let i = 0; i < nameNode.childCount; i++) {
      const child = nameNode.child(i);
      if (child.type === 'shorthand_property_identifier_pattern') {
        names.push(child.text);
      } else if (child.type === 'pair_pattern') {
        const value = child.childForFieldName('value');
        if (value) names.push(value.text);
      }
    }
    return names;
  }
  return [];
}

/**
 * Handle standalone require() calls (not assigned to a variable).
 */
function handleCallExpression(node, source, filePath, result) {
  if (isRequireCall(node)) {
    const requirePath = extractRequirePath(node);
    if (requirePath) {
      const resolved = resolveImportPath(requirePath, filePath);
      result.imports.push({
        raw: requirePath,
        resolved,
        names: [],
        startLine: node.startPosition.row + 1,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Route extraction (CargoFin custom pattern)
// ---------------------------------------------------------------------------

/**
 * Detect CargoFin's route definition pattern:
 * 
 * module.exports = {
 *   routeName: {
 *     method: 'get',
 *     path: '/some/path',
 *     function: controllerFn,
 *     middlewares: [...],
 *     publicAccess: true,
 *   }
 * }
 * 
 * The route objects are identified by having both 'method' and 'path' properties.
 */
function extractRoutes(node, source, filePath, imports) {
  const routes = [];

  // If the module.exports is the IIFE in config/routes.js, skip — it's an aggregator
  if (node.type === 'call_expression') {
    return routes;
  }

  if (node.type !== 'object') return routes;

  // Build a variable name → resolved file path lookup from imports
  // e.g. financeController → /abs/path/to/controllers/logistics_finance.js
  const varToFile = new Map();
  if (imports) {
    for (const imp of imports) {
      if (imp.resolved && imp.names && imp.names.length === 1) {
        varToFile.set(imp.names[0], imp.resolved);
      }
    }
  }

  // Each top-level property in the exported object is a potential route
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child.type !== 'pair') continue;

    const key = child.childForFieldName('key');
    const value = child.childForFieldName('value');

    if (!key || !value || value.type !== 'object') continue;

    // Check if this object has 'method' and 'path' properties
    const props = extractObjectProperties(value, source);
    if (props.method && props.path) {
      // Resolve handler reference: "financeController.getCreditSummaryByUserId"
      // → { controllerFile: "backend/src/main/controllers/logistics_finance.js", functionName: "getCreditSummaryByUserId" }
      let controllerFile = null;
      let handlerFunction = null;
      const handlerStr = props.function || null;

      if (handlerStr && handlerStr.includes('.')) {
        const [varName, fnName] = handlerStr.split('.');
        handlerFunction = fnName;
        const resolvedPath = varToFile.get(varName);
        if (resolvedPath) {
          controllerFile = path.isAbsolute(resolvedPath)
            ? path.relative(config.targetCodebase, resolvedPath)
            : resolvedPath;
        }
      } else if (handlerStr) {
        handlerFunction = handlerStr;
      }

      routes.push({
        name: key.text,
        method: props.method,
        path: props.path,
        handler: handlerStr,
        handlerFunction,
        controllerFile,
        middlewares: props.middlewares || null,
        publicAccess: props.publicAccess === 'true',
        startLine: child.startPosition.row + 1,
        endLine: child.endPosition.row + 1,
      });
    }
  }

  return routes;
}

/**
 * Extract key-value pairs from a simple object literal.
 * Returns { key: valueText } for string/identifier values.
 */
function extractObjectProperties(objectNode, source) {
  const props = {};

  for (let i = 0; i < objectNode.childCount; i++) {
    const child = objectNode.child(i);
    if (child.type !== 'pair') continue;

    const key = child.childForFieldName('key');
    const value = child.childForFieldName('value');
    if (!key || !value) continue;

    const keyName = key.text;

    // Extract value based on type
    if (value.type === 'string' || value.type === 'template_string') {
      props[keyName] = value.text.replace(/^['"`]|['"`]$/g, '');
    } else if (value.type === 'identifier' || value.type === 'member_expression') {
      props[keyName] = value.text;
    } else if (value.type === 'true' || value.type === 'false') {
      props[keyName] = value.text;
    } else if (value.type === 'array') {
      props[keyName] = value.text;
    } else if (value.type === 'object') {
      props[keyName] = value.text;
    }
  }

  return props;
}

// ---------------------------------------------------------------------------
// Main parse pipeline
// ---------------------------------------------------------------------------

async function parseCodebase() {
  console.log('[parse] starting codebase parse...');
  console.log(`[parse] target: ${config.targetCodebase}`);

  await initTreeSitter();

  const files = await discoverFiles();
  const parsedFiles = {};
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalImports = 0;
  let totalRoutes = 0;
  let parseErrors = 0;

  for (const filePath of files) {
    try {
      // Skip files larger than 1MB — likely generated/binary data
      const stat = fs.statSync(filePath);
      if (stat.size > 1024 * 1024) {
        console.log(`[parse] skipping large file (${(stat.size / 1024).toFixed(0)}KB): ${filePath}`);
        continue;
      }

      const source = fs.readFileSync(filePath, 'utf-8');
      const tree = Parser.parse(source);

      const symbols = extractSymbols(tree, source, filePath);
      const relativePath = path.relative(config.targetCodebase, filePath);

      // Mark exported functions
      markExportedFunctions(symbols);

      parsedFiles[relativePath] = {
        absolutePath: filePath,
        lineCount: source.split('\n').length,
        functions: symbols.functions,
        classes: symbols.classes,
        exports: symbols.exports,
        imports: symbols.imports,
        routes: symbols.routes,
      };

      totalFunctions += symbols.functions.length;
      totalClasses += symbols.classes.length;
      totalImports += symbols.imports.length;
      totalRoutes += symbols.routes.length;
    } catch (err) {
      parseErrors++;
      if (parseErrors <= 10) {
        console.error(`[parse] error parsing ${filePath}: ${err.message}`);
      }
    }
  }

  if (parseErrors > 10) {
    console.error(`[parse] ... and ${parseErrors - 10} more parse errors`);
  }

  console.log(`[parse] complete.`);
  console.log(`[parse]   files: ${Object.keys(parsedFiles).length}`);
  console.log(`[parse]   functions: ${totalFunctions}`);
  console.log(`[parse]   classes: ${totalClasses}`);
  console.log(`[parse]   imports: ${totalImports}`);
  console.log(`[parse]   routes: ${totalRoutes}`);
  console.log(`[parse]   parse errors: ${parseErrors}`);

  // Write output
  const outputPath = path.join(config.projectRoot, 'index', 'parsed-files.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(parsedFiles, null, 2));
  console.log(`[parse] output written to ${outputPath}`);

  return parsedFiles;
}

/**
 * Cross-reference exports with functions to mark which functions are exported.
 */
function markExportedFunctions(symbols) {
  for (const exp of symbols.exports) {
    if (exp.type === 'module.exports' && exp.value) {
      if (exp.value.type === 'identifier') {
        // module.exports = someFunction
        const fn = symbols.functions.find(f => f.name === exp.value.name);
        if (fn) fn.isExported = true;
      } else if (exp.value.type === 'object' && exp.value.keys) {
        // module.exports = { fn1, fn2 } or { fn1: fn1, fn2: fn2 }
        for (const key of exp.value.keys) {
          const fn = symbols.functions.find(f => f.name === key);
          if (fn) fn.isExported = true;
        }
      }
    } else if (exp.type === 'named') {
      const fn = symbols.functions.find(f => f.name === exp.name);
      if (fn) fn.isExported = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Export for use by other modules + direct execution
// ---------------------------------------------------------------------------

module.exports = { parseCodebase, resolveImportPath, initTreeSitter };

if (require.main === module) {
  parseCodebase().catch(err => {
    console.error('[parse] fatal error:', err);
    process.exit(1);
  });
}
