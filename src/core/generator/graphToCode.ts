// =============================================================================
// Atlas — Graph to Code Generator
// =============================================================================
// Generates a single runnable Express TypeScript file from the graph.
// This is designed for live preview/execution, not full project export.
// =============================================================================

import { GraphState, NodeData, EdgeData, NodeType } from '@/core/types';

const API_NODE_TYPES: NodeType[] = ['REST_API', 'GRAPHQL_API'];
const SERVICE_NODE_TYPES: NodeType[] = ['SQL_DATABASE', 'NOSQL_DATABASE', 'REDIS_CACHE', 'OBJECT_STORAGE', 'SUPABASE', 'FIREBASE', 'GITHUB'];

export function graphToCode(graph: GraphState): string {
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return `// No nodes in the graph yet.
// Add nodes to see generated code.
`;
  }

  const lines: string[] = [];

  // --- Imports ---
  lines.push(`import express from 'express';`);
  lines.push(`import cors from 'cors';`);
  lines.push(``);
  lines.push(`const app = express();`);
  lines.push(`app.use(cors());`);
  lines.push(`app.use(express.json());`);
  lines.push(``);

  // --- Service Initialization (Databases, Caches, etc.) ---
  const serviceNodes = nodes.filter(n => SERVICE_NODE_TYPES.includes(n.type as NodeType));
  const apiNodes = nodes.filter(n => API_NODE_TYPES.includes(n.type as NodeType));
  const functionNodes = nodes.filter(n => n.type === 'FUNCTION');

  if (serviceNodes.length > 0) {
    lines.push(`// =============================================================================`);
    lines.push(`// Service Initialization`);
    lines.push(`// =============================================================================`);
    lines.push(``);

    for (const node of serviceNodes) {
      lines.push(generateServiceInit(node));
      lines.push(``);
    }
  }

  // --- Function Helpers ---
  if (functionNodes.length > 0) {
    lines.push(`// =============================================================================`);
    lines.push(`// Function Helpers`);
    lines.push(`// =============================================================================`);
    lines.push(``);

    for (const node of functionNodes) {
      lines.push(generateFunctionHelper(node));
      lines.push(``);
    }
  }

  // --- Health Check ---
  lines.push(`// Health check`);
  lines.push(`app.get('/health', (_req, res) => {`);
  lines.push(`  res.json({ status: 'ok', nodes: ${nodes.length} });`);
  lines.push(`});`);
  lines.push(``);

  // --- API Routes (only for REST_API / GRAPHQL_API) ---
  if (apiNodes.length > 0) {
    lines.push(`// =============================================================================`);
    lines.push(`// API Routes`);
    lines.push(`// =============================================================================`);
    lines.push(``);

    for (const node of apiNodes) {
      lines.push(generateApiRoute(node, edges, nodes));
      lines.push(``);
    }
  }

  // --- Server Start ---
  lines.push(`const PORT = process.env.PORT || 3001;`);
  lines.push(`app.listen(PORT, () => {`);
  lines.push(`  console.log(\`[Atlas Server] Running on http://localhost:\${PORT}\`);`);
  lines.push(`});`);

  return lines.join('\n');
}

// =============================================================================
// Service Initialization Generators
// =============================================================================

function generateServiceInit(node: NodeData): string {
  const varName = sanitizeVarName(node.label);
  const lines: string[] = [];

  switch (node.type) {
    case 'SQL_DATABASE':
      const sqlConfig = node.config as any;
      lines.push(`// ${node.label} (SQLite)`);
      lines.push(`const sqlite3 = require('sqlite3').verbose();`);
      lines.push(`const ${varName} = new sqlite3.Database(':memory:');`);

      // Schema initialization
      if (sqlConfig.schema) {
        lines.push(`${varName}.serialize(() => {`);
        const tables = sqlConfig.schema.split('),').map((s: string) => s.trim());
        for (const tableDef of tables) {
          const cleanDef = tableDef.replace(')', '');
          const [tableName, columns] = cleanDef.split('(');
          if (tableName && columns) {
            const cols = columns.split(',').map((c: string) => {
              const cName = c.trim();
              return cName.includes(' ') ? cName : `${cName} TEXT`;
            }).join(', ');
            const finalCols = cols.toLowerCase().includes('primary key')
              ? cols
              : 'id INTEGER PRIMARY KEY AUTOINCREMENT, ' + cols;
            lines.push(`  ${varName}.run("CREATE TABLE IF NOT EXISTS ${tableName.trim()} (${finalCols})");`);
          }
        }
        lines.push(`});`);
      } else {
        lines.push(`${varName}.serialize(() => {`);
        lines.push(`  ${varName}.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");`);
        lines.push(`});`);
      }
      lines.push(`console.log('[${node.label}] SQLite initialized');`);
      break;

    case 'NOSQL_DATABASE':
      lines.push(`// ${node.label} (MongoDB - placeholder)`);
      lines.push(`const ${varName} = {`);
      lines.push(`  collection: (name: string) => ({`);
      lines.push(`    find: () => ({ toArray: async () => [] }),`);
      lines.push(`    insertOne: async (doc: any) => ({ insertedId: Date.now(), ops: [doc] }),`);
      lines.push(`    updateOne: async () => ({ nModified: 1 }),`);
      lines.push(`    deleteOne: async () => ({ deletedCount: 1 }),`);
      lines.push(`  })`);
      lines.push(`};`);
      lines.push(`console.log('[${node.label}] NoSQL placeholder initialized');`);
      break;

    case 'REDIS_CACHE':
      lines.push(`// ${node.label} (Redis - placeholder)`);
      lines.push(`const ${varName} = {`);
      lines.push(`  get: async (key: string) => null,`);
      lines.push(`  set: async (key: string, value: string, ttl?: number) => 'OK',`);
      lines.push(`  del: async (key: string) => 1,`);
      lines.push(`};`);
      lines.push(`console.log('[${node.label}] Redis placeholder initialized');`);
      break;

    case 'OBJECT_STORAGE':
      lines.push(`// ${node.label} (Object Storage - placeholder)`);
      lines.push(`const ${varName} = {`);
      lines.push(`  upload: async (key: string, data: Buffer) => ({ url: \`https://storage.example.com/\${key}\` }),`);
      lines.push(`  download: async (key: string) => null,`);
      lines.push(`};`);
      lines.push(`console.log('[${node.label}] Object Storage placeholder initialized');`);
      break;

    case 'SUPABASE':
      const sbConfig = node.config as any;
      lines.push(`// ${node.label} (Supabase)`);
      lines.push(`const { createClient } = require('@supabase/supabase-js');`);
      lines.push(`const ${varName} = createClient('${sbConfig.url || 'YOUR_SUPABASE_URL'}', '${sbConfig.key || 'YOUR_SUPABASE_KEY'}');`);
      lines.push(`console.log('[${node.label}] Supabase client initialized');`);
      break;

    case 'FIREBASE':
      const fbConfig = node.config as any;
      lines.push(`// ${node.label} (Firebase)`);
      lines.push(`const { initializeApp } = require('firebase/app');`);
      lines.push(`const ${varName} = initializeApp({ apiKey: '${fbConfig.apiKey || ''}', projectId: '${fbConfig.projectId || ''}' });`);
      lines.push(`console.log('[${node.label}] Firebase app initialized');`);
      break;

    case 'GITHUB':
      lines.push(`// ${node.label} (GitHub)`);
      lines.push(`const { Octokit } = require('@octokit/rest');`);
      lines.push(`const ${varName} = new Octokit();`);
      lines.push(`console.log('[${node.label}] GitHub client initialized');`);
      break;

    default:
      lines.push(`// ${node.label} (${node.type}) - no specific initialization`);
  }

  return lines.join('\n');
}

// =============================================================================
// Function Helper Generator
// =============================================================================

function generateFunctionHelper(node: NodeData): string {
  const fnName = sanitizeVarName(node.label);
  const config = node.config as any;
  const code = config.code || config.customCode || 'return input;';

  const lines: string[] = [];
  lines.push(`// Function: ${node.label}`);
  lines.push(`async function ${fnName}(input: any) {`);

  const codeLines = code.split('\n');
  for (const line of codeLines) {
    lines.push(`  ${line}`);
  }

  lines.push(`}`);
  return lines.join('\n');
}

// =============================================================================
// API Route Generator
// =============================================================================

function generateApiRoute(node: NodeData, edges: EdgeData[], allNodes: NodeData[]): string {
  const config = node.config as any;
  const routePath = config.path || `/api/${sanitizeVarName(node.label)}`;
  const httpMethod = (config.method || 'get').toLowerCase();

  // Find connected downstream services
  const downstreamEdges = edges.filter(e => e.sourceId === node.id);
  const downstreamNodes = downstreamEdges
    .map(e => allNodes.find(n => n.id === e.targetId))
    .filter(Boolean) as NodeData[];

  const lines: string[] = [];
  lines.push(`// --- ${node.label} ---`);
  lines.push(`app.${httpMethod}('${routePath}', async (req, res) => {`);
  lines.push(`  try {`);
  lines.push(`    const input = req.method === 'GET' ? req.query : (req.body || {});`);
  lines.push(`    console.log('[${node.label}] Received:', JSON.stringify(input).slice(0, 100));`);
  lines.push(``);

  // Check for custom code first
  if (config.customCode) {
    const codeLines = config.customCode.split('\n');
    for (const line of codeLines) {
      lines.push(`    ${line}`);
    }
  } else {
    // Generate smart CRUD code based on downstream connections
    lines.push(generateSmartCrud(node, downstreamNodes, httpMethod));
  }

  lines.push(`  } catch (err: any) {`);
  lines.push(`    console.error('[${node.label}] Error:', err.message);`);
  lines.push(`    res.status(500).json({ error: err.message });`);
  lines.push(`  }`);
  lines.push(`});`);

  return lines.join('\n');
}

// =============================================================================
// Smart CRUD Generator
// =============================================================================

function generateSmartCrud(apiNode: NodeData, downstreamNodes: NodeData[], method: string): string {
  const lines: string[] = [];

  // Find the first SQL database in downstream nodes
  const sqlNode = downstreamNodes.find(n => n.type === 'SQL_DATABASE');
  const nosqlNode = downstreamNodes.find(n => n.type === 'NOSQL_DATABASE');
  const functionNode = downstreamNodes.find(n => n.type === 'FUNCTION');

  if (sqlNode) {
    const varName = sanitizeVarName(sqlNode.label);
    const sqlConfig = sqlNode.config as any;

    // Determine table name from schema or default to 'items'
    let tableName = 'items';
    if (sqlConfig.schema) {
      const firstTable = sqlConfig.schema.split('(')[0].trim();
      if (firstTable) tableName = firstTable;
    }

    if (method === 'post') {
      lines.push(`    // INSERT into ${tableName}`);
      lines.push(`    const keys = Object.keys(input).filter(k => k !== 'id');`);
      lines.push(`    const placeholders = keys.map(() => '?').join(',');`);
      lines.push(`    const sql = \`INSERT INTO ${tableName} (\${keys.join(',')}) VALUES (\${placeholders})\`;`);
      lines.push(`    const values = keys.map(k => input[k]);`);
      lines.push(``);
      lines.push(`    ${varName}.run(sql, values, function(this: any, err: Error | null) {`);
      lines.push(`      if (err) return res.status(500).json({ error: err.message });`);
      lines.push(`      res.json({ success: true, id: this.lastID, ...input });`);
      lines.push(`    });`);
    } else if (method === 'delete') {
      lines.push(`    // DELETE from ${tableName}`);
      lines.push(`    const id = input.id;`);
      lines.push(`    if (!id) return res.status(400).json({ error: 'ID required' });`);
      lines.push(``);
      lines.push(`    ${varName}.run("DELETE FROM ${tableName} WHERE id = ?", [id], function(this: any, err: Error | null) {`);
      lines.push(`      if (err) return res.status(500).json({ error: err.message });`);
      lines.push(`      res.json({ success: true, deleted: this.changes });`);
      lines.push(`    });`);
    } else {
      // GET - SELECT
      lines.push(`    // SELECT from ${tableName}`);
      lines.push(`    ${varName}.all("SELECT * FROM ${tableName}", (err: Error | null, rows: any[]) => {`);
      lines.push(`      if (err) return res.status(500).json({ error: err.message });`);
      lines.push(`      res.json({ success: true, data: rows });`);
      lines.push(`    });`);
    }
  } else if (nosqlNode) {
    const varName = sanitizeVarName(nosqlNode.label);

    if (method === 'post') {
      lines.push(`    // Insert document`);
      lines.push(`    const result = await ${varName}.collection('items').insertOne(input);`);
      lines.push(`    res.json({ success: true, id: result.insertedId, ...input });`);
    } else if (method === 'delete') {
      lines.push(`    // Delete document`);
      lines.push(`    const result = await ${varName}.collection('items').deleteOne({ _id: input.id });`);
      lines.push(`    res.json({ success: true, deleted: result.deletedCount });`);
    } else {
      lines.push(`    // Find documents`);
      lines.push(`    const items = await ${varName}.collection('items').find().toArray();`);
      lines.push(`    res.json({ success: true, data: items });`);
    }
  } else if (functionNode) {
    const fnName = sanitizeVarName(functionNode.label);
    lines.push(`    // Call function: ${functionNode.label}`);
    lines.push(`    const result = await ${fnName}(input);`);
    lines.push(`    res.json({ success: true, data: result });`);
  } else {
    // No downstream connection - simple echo
    lines.push(`    // No downstream service - echo input`);
    lines.push(`    res.json({ node: '${apiNode.label}', data: input, timestamp: Date.now() });`);
  }

  return lines.join('\n');
}

// =============================================================================
// Utilities
// =============================================================================

function sanitizeVarName(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}
