import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess, execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GraphState, NodeData, EdgeData } from '@/core/types';

const ATLAS_SECRET = process.env.ATLAS_SECRET || 'atlas-local-dev-secret';


// Persist running servers across HMR (Hot Module Replacement)
const globalForServers = global as unknown as { atlasRunningServers: Map<number, { process: ChildProcess; port: number; workDir: string }> };

export const runningServers = globalForServers.atlasRunningServers || new Map<number, { process: ChildProcess; port: number; workDir: string }>();

if (process.env.NODE_ENV !== 'production') {
  globalForServers.atlasRunningServers = runningServers;
}

// Find an available port
function getAvailablePort(): number {
  const usedPorts = Array.from(runningServers.values()).map(s => s.port);
  let port = 4000;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

// Generate JavaScript code (not TypeScript) that can run directly with Node
function generateServerCode(graph: GraphState, port: number): string {
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return `
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'No nodes in graph' }));
app.listen(${port}, () => console.log('[Atlas] Server on http://localhost:${port}'));
`;
  }

  const lines: string[] = [];

  // === IMPORTS ===
  lines.push(`const express = require('express');`);
  lines.push(`const cors = require('cors');`);
  lines.push(`const { apiReference } = require('@scalar/express-api-reference');`);
  lines.push(`const app = express();`);
  lines.push(`process.env.PORT = '${port}';`);
  lines.push(`app.use(cors());`);
  lines.push(`app.use(express.json());`);
  lines.push(`// Global error handler for JSON parsing`);
  lines.push(`app.use((err, req, res, next) => {`);
  lines.push(`  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {`);
  lines.push(`    console.error('Bad JSON:', err.message);`);
  lines.push(`    return res.status(400).json({ error: 'Invalid JSON format', details: err.message });`);
  lines.push(`  }`);
  lines.push(`  next();`);
  lines.push(`});`);
  lines.push(``);

  // === SERVICE NODE TYPES (non-API) ===
  const serviceNodeTypes = ['SQL_DATABASE', 'NOSQL_DATABASE', 'REDIS_CACHE', 'OBJECT_STORAGE', 'SUPABASE', 'FIREBASE', 'GITHUB'];
  const apiNodeTypes = ['REST_API', 'GRAPHQL_API'];

  // === GENERATE SERVICE INITIALIZATION CODE ===
  const serviceNodes = nodes.filter(n => serviceNodeTypes.includes(n.type));
  const apiNodes = nodes.filter(n => apiNodeTypes.includes(n.type));
  const functionNodes = nodes.filter(n => n.type === 'FUNCTION');

  // Create service instances
  for (const node of serviceNodes) {
    const varName = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    lines.push(`// === SERVICE: ${node.label} (${node.type}) ===`);

    switch (node.type) {
      case 'SQL_DATABASE':
        const sqlConfig = node.config as any;
        const dbType = sqlConfig.dbType || 'sqlite';
        if (dbType === 'sqlite') {
          lines.push(`const sqlite3 = require('sqlite3').verbose();`);
          lines.push(`const path = require('path');`);
          lines.push(`const dbPath = path.resolve(process.cwd(), 'mydb.sqlite');`);
          lines.push(`const ${varName} = new sqlite3.Database(dbPath);`);
          lines.push(`console.log('[${node.label}] SQLite database connected at ' + dbPath);`);
          lines.push(`// Initialize schema`);
          lines.push(`${varName}.serialize(() => {`);

          if (sqlConfig.schema) {
            // Parse schema string: "table1(col1, col2), table2(col3)"
            const tables = sqlConfig.schema.split('),').map((s: string) => s.trim());
            for (const tableDef of tables) {
              const cleanDef = tableDef.replace(')', ''); // Remove trailing )
              const [tableName, columns] = cleanDef.split('(');
              if (tableName && columns) {
                // Determine columns with crude type guessing or default to TEXT
                const cols = columns.split(',').map((c: string) => {
                  const cName = c.trim();
                  // If it contains type already (e.g. "id INTEGER"), leave it. Otherwise default
                  return cName.includes(' ') ? cName : `${cName} TEXT`;
                }).join(', ');

                // Check if ID exists (explicitly named 'id' or contains 'PRIMARY KEY')
                const lowerCols = cols.toLowerCase();
                const hasExplicitId = cols.split(',').map((c: string) => c.trim().split(' ')[0].toLowerCase()).includes('id');
                const finalCols = (lowerCols.includes('primary key') || hasExplicitId)
                  ? cols
                  : 'id INTEGER PRIMARY KEY AUTOINCREMENT, ' + cols;

                lines.push(`  ${varName}.run("CREATE TABLE IF NOT EXISTS ${tableName.trim()} (${finalCols})");`);
              }
            }
            lines.push(`  console.log('[${node.label}] Initialized tables from schema');`);
          } else {
            lines.push(`  ${varName}.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");`);
            lines.push(`  console.log('[${node.label}] Initialized default items table');`);
          }
          lines.push(`});`);
        } else {
          lines.push(`// TODO: ${dbType} connection - configure connection string`);
          lines.push(`const ${varName} = { query: async (sql, params) => ({ rows: [] }) }; // Placeholder`);
        }
        break;
      case 'NOSQL_DATABASE':
        lines.push(`// MongoDB placeholder - requires 'mongodb' package`);
        lines.push(`const ${varName} = { collection: (name) => ({ find: () => [], insertOne: async (doc) => doc }) };`);
        lines.push(`console.log('[${node.label}] NoSQL database stub initialized');`);
        break;
      case 'REDIS_CACHE':
        lines.push(`// Redis placeholder - requires 'redis' package`);
        lines.push(`const ${varName} = { get: async (k) => null, set: async (k, v) => 'OK' };`);
        lines.push(`console.log('[${node.label}] Redis cache stub initialized');`);
        break;
      case 'OBJECT_STORAGE':
        lines.push(`// Object storage placeholder - requires S3/Azure SDK`);
        lines.push(`const ${varName} = { upload: async (key, data) => ({ key }), download: async (key) => null };`);
        lines.push(`console.log('[${node.label}] Object storage stub initialized');`);
        break;
      case 'SUPABASE':
        lines.push(`// Supabase Client`);
        lines.push(`const { createClient } = require('@supabase/supabase-js');`);
        const sbConfig = node.config as any;
        lines.push(`const ${varName} = createClient('${sbConfig.url || 'YOUR_URL'}', '${sbConfig.key || 'YOUR_KEY'}');`);
        lines.push(`console.log('[${node.label}] Supabase client initialized');`);
        break;
      case 'FIREBASE':
        lines.push(`// Firebase App`);
        lines.push(`const { initializeApp } = require('firebase/app');`);
        const fbConfig = node.config as any;
        lines.push(`const ${varName} = initializeApp({ apiKey: '${fbConfig.apiKey || ''}', projectId: '${fbConfig.projectId || ''}' });`);
        lines.push(`console.log('[${node.label}] Firebase app initialized');`);
        break;
      case 'GITHUB':
        lines.push(`// GitHub Client`);
        lines.push(`const { Octokit } = require('@octokit/rest');`);
        lines.push(`const ${varName} = new Octokit();`);
        lines.push(`console.log('[${node.label}] GitHub client initialized');`);
        break;
    }
    lines.push(``);
  }

  // === GENERATE FUNCTION HELPERS ===
  for (const node of functionNodes) {
    const fnName = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fnCode = (node.config as any).code || (node.config as any).customCode || 'return input;';
    lines.push(`// === FUNCTION: ${node.label} ===`);
    lines.push(`async function ${fnName}(input) {`);
    const codeLines = fnCode.split('\n');
    for (const line of codeLines) {
      lines.push(`  ${line}`);
    }
    lines.push(`}`);
    lines.push(``);
  }

  // === GENERATE API ROUTES (ONLY for REST_API / GRAPHQL_API) ===
  const paths: any = {};

  for (const node of apiNodes) {
    const routePath = getRoutePath(node);
    const config = node.config as any;
    const method = (config.method || 'GET').toLowerCase();
    const userCode = config.customCode || config.code || getDefaultApiCode(node, edges, nodes, serviceNodes, functionNodes);

    // Generate dynamic schema based on method and connected nodes
    let schemaProperties: any = {
      message: { type: 'string', example: 'Success' }
    };

    // Attempt to infer schema from connected SQL database if simple CRUD
    const connectedSqlNode = edges
      .filter(e => e.sourceId === node.id)
      .map(e => nodes.find(n => n.id === e.targetId))
      .find(n => n?.type === 'SQL_DATABASE');

    if (connectedSqlNode && (connectedSqlNode.config as any).schema) {
      try {
        const schemaStr = (connectedSqlNode.config as any).schema;
        const firstTable = schemaStr.split('(')[1]?.split(')')[0];
        if (firstTable) {
          const cols = firstTable.split(',');
          schemaProperties = {};
          cols.forEach((c: string) => {
            const [name, type] = c.trim().split(' ');
            schemaProperties[name] = {
              type: type?.toLowerCase().includes('int') ? 'integer' : 'string'
            };
          });
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    }

    const requestBody = method !== 'get' ? {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: config.sampleInput ? undefined : schemaProperties, // Use inferred if no sample
            example: config.sampleInput || {
              // Provide a relevant example based on the node label
              data: `Sample data for ${node.label}`,
              ...schemaProperties
            }
          }
        }
      }
    } : undefined;

    // Add to Swagger paths
    if (!paths[routePath]) paths[routePath] = {};
    paths[routePath][method] = {
      summary: node.label,
      description: config.jobSpec || `Handler for ${node.label}`,
      requestBody,
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: schemaProperties,
                example: {
                  success: true,
                  data: schemaProperties
                }
              }
            }
          }
        },
        '400': { description: 'Bad Request' },
        '500': { description: 'Server error' }
      }
    };

    lines.push(`// API: ${node.label} (${node.type})`);
    lines.push(`app.${method}('${routePath}', async (req, res) => {`);
    lines.push(`  try {`);
    lines.push(`    const input = req.method === 'GET' ? req.query : (req.body || {});`);
    lines.push(`    console.log('[${node.label}] Received (${method.toUpperCase()}):', JSON.stringify(input).slice(0, 100));`);

    const codeLines = userCode.split('\n');
    for (const line of codeLines) {
      lines.push(`    ${line}`);
    }

    lines.push(`  } catch (err) {`);
    lines.push(`    console.error('[${node.label}] Error:', err.message);`);
    lines.push(`    res.status(500).json({ error: err.message });`);
    lines.push(`  }`);
    lines.push(`});`);
    lines.push(``);
  }

  // Swagger Setup
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Atlas Live Server API',
      version: '1.0.0',
      description: 'Auto-generated API documentation for your Atlas graph.'
    },
    paths: paths
  };

  lines.push(`// Swagger / Scalar Setup`);
  lines.push(`const swaggerDocument = ${JSON.stringify(swaggerDocument, null, 2)};`);
  lines.push(`app.use('/api-docs', apiReference({`);
  lines.push(`  spec: { content: swaggerDocument },`);
  lines.push(`  theme: 'purple',`);
  lines.push(`  showSidebar: true,`);
  lines.push(`}));`);
  lines.push(``);

  lines.push(`// Health check`);
  lines.push(`app.get('/health', (req, res) => {`);
  lines.push(`  res.json({ status: 'ok', nodes: ${nodes.length}, apis: ${apiNodes.length}, services: ${serviceNodes.length}, timestamp: Date.now() });`);
  lines.push(`});`);

  lines.push(`app.listen(${port}, () => {`);
  lines.push(`  console.log('[Atlas] Server running on http://localhost:${port}');`);
  lines.push(`  console.log('[Atlas] APIs Docs: http://localhost:${port}/api-docs');`);
  lines.push(`  console.log('[Atlas] Health check: http://localhost:${port}/health');`);
  lines.push(`});`);

  return lines.join('\n');
}

// Generate default API code that references connected services
function getDefaultApiCode(node: NodeData, edges: EdgeData[], allNodes: NodeData[], serviceNodes: NodeData[], functionNodes: NodeData[]): string {
  // Find downstream connections from this API node
  const downstreamEdges = edges.filter(e => e.sourceId === node.id);
  const downstreamNodes = downstreamEdges.map(e => allNodes.find(n => n.id === e.targetId)).filter(Boolean) as NodeData[];

  const codeLines: string[] = [];

  for (const downstream of downstreamNodes) {
    const varName = downstream.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (downstream.type === 'FUNCTION') {
      codeLines.push(`const ${varName}_result = await ${varName}(input);`);
    } else if (downstream.type === 'SQL_DATABASE') {
      const method = (node.config as any).method || 'GET';
      const sqlConfig = downstream.config as any;

      // Determine table name: defaults to 'items', or picks first table from schema
      let tableName = 'items';
      if (sqlConfig.schema) {
        const firstTable = sqlConfig.schema.split('(')[0].trim();
        if (firstTable) tableName = firstTable;
      }

      codeLines.push(`// Query ${downstream.label}: ${method} on ${tableName}`);
      codeLines.push(`const ${varName}_result = await new Promise((resolve, reject) => {`);

      if (method === 'POST') {
        codeLines.push(`  // INSERT logic`);
        codeLines.push(`  const keys = Object.keys(input).filter(k => k !== 'id');`);
        codeLines.push(`  if (keys.length === 0) {`);
        codeLines.push(`    return reject(new Error('No data provided for insertion'));`);
        codeLines.push(`  }`);
        codeLines.push(`  const placeholders = keys.map(() => '?').join(',');`);
        codeLines.push(`  const sql = \`INSERT INTO ${tableName} (\${keys.join(',')}) VALUES (\${placeholders})\`;`);
        codeLines.push(`  const values = keys.map(k => input[k]);`);
        codeLines.push(`  ${varName}.run(sql, values, function(err) {`);
        codeLines.push(`    if (err) reject(err);`);
        codeLines.push(`    else resolve({ id: this.lastID, ...input });`);
        codeLines.push(`  });`);
      } else if (method === 'DELETE') {
        codeLines.push(`  // DELETE logic (assumes input.id or query.id)`);
        codeLines.push(`  const id = input.id;`);
        codeLines.push(`  if (!id) return reject(new Error('ID required for deletion'));`);
        codeLines.push(`  ${varName}.run("DELETE FROM ${tableName} WHERE id = ?", [id], function(err) {`);
        codeLines.push(`    if (err) reject(err);`);
        codeLines.push(`    else resolve({ success: true, deleted: this.changes });`);
        codeLines.push(`  });`);
      } else {
        codeLines.push(`  // SELECT logic`);
        codeLines.push(`  ${varName}.all("SELECT * FROM ${tableName}", (err, rows) => err ? reject(err) : resolve(rows));`);
      }
      codeLines.push(`});`);
    } else if (['SUPABASE', 'FIREBASE', 'NOSQL_DATABASE'].includes(downstream.type)) {
      codeLines.push(`// Fetch from ${downstream.label} - placeholder`);
      codeLines.push(`const ${varName}_result = { items: [] };`);
    }
  }

  if (codeLines.length > 0) {
    codeLines.push(`res.json({ success: true, results: { ${downstreamNodes.map(n => n.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_result').join(', ')} } });`);
  } else {
    codeLines.push(`res.json({ node: '${node.label}', type: '${node.type}', data: input, timestamp: Date.now() });`);
  }

  return codeLines.join('\n');
}

function getRoutePath(node: NodeData): string {
  // If the node has a specific path configured (e.g. REST_API), use it
  if (['REST_API', 'GRAPHQL_API'].includes(node.type)) {
    const config = node.config as any;
    if (config.path) return config.path;
  }

  const slug = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  switch (node.type) {
    case 'REST_API': return `/api/${slug}`;
    case 'GRAPHQL_API': return `/graphql`;
    case 'REDIS_CACHE': return `/cache/${slug}`;
    case 'SQL_DATABASE':
    case 'NOSQL_DATABASE': return `/db/${slug}`;
    case 'OBJECT_STORAGE': return `/storage/${slug}`;
    case 'SUPABASE': return `/supabase/${slug}`;
    case 'FIREBASE': return `/firebase/${slug}`;
    case 'GITHUB': return `/github/${slug}`;
    case 'FUNCTION': return `/fn/${slug}`;
    default: return `/${slug}`;
  }
}

// Inject Scalar API docs route if the code doesn't already have one
function injectApiDocsIfMissing(code: string, port: number): string {
  // Check if code already has /api-docs
  if (code.includes('/api-docs') || code.includes('apiReference') || code.includes('@scalar/express-api-reference')) {
    return code; // Already has API docs
  }

  // Find routes in the code to build a simple OpenAPI spec
  const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  const routes: { method: string; path: string }[] = [];
  let match;
  while ((match = routeRegex.exec(code)) !== null) {
    routes.push({ method: match[1].toLowerCase(), path: match[2] });
  }

  // Build OpenAPI paths object
  const paths: Record<string, Record<string, any>> = {};
  for (const route of routes) {
    if (!paths[route.path]) paths[route.path] = {};
    paths[route.path][route.method] = {
      summary: `${route.method.toUpperCase()} ${route.path}`,
      responses: {
        '200': { description: 'Success' },
        '400': { description: 'Bad Request' },
        '500': { description: 'Server Error' }
      }
    };
  }

  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Atlas Live Server API',
      version: '1.0.0',
      description: 'Auto-generated API documentation'
    },
    servers: [{ url: `http://localhost:${port}` }],
    paths: paths
  };

  // Inject the Scalar setup
  const scalarSetup = `
// --- Atlas API Documentation (Auto-Injected) ---
const { apiReference } = require('@scalar/express-api-reference');
const atlasOpenApiSpec = ${JSON.stringify(openApiSpec, null, 2)};
app.use('/api-docs', apiReference({ 
  spec: { content: atlasOpenApiSpec },
  theme: 'purple',
  showSidebar: true
}));
// --- End Atlas API Documentation ---

`;

  // Find where to inject: after app.use(express.json()) or after app = express()
  const jsonMiddlewareMatch = code.match(/app\.use\s*\(\s*express\.json\s*\(\s*\)\s*\)\s*;?/);
  if (jsonMiddlewareMatch && jsonMiddlewareMatch.index !== undefined) {
    const insertPos = jsonMiddlewareMatch.index + jsonMiddlewareMatch[0].length;
    return code.slice(0, insertPos) + '\n' + scalarSetup + code.slice(insertPos);
  }

  // Fallback: after const app = express()
  const appMatch = code.match(/const\s+app\s*=\s*express\s*\(\s*\)\s*;?/);
  if (appMatch && appMatch.index !== undefined) {
    const insertPos = appMatch.index + appMatch[0].length;
    return code.slice(0, insertPos) + '\n' + scalarSetup + code.slice(insertPos);
  }

  // Last resort: prepend after first line
  const firstNewline = code.indexOf('\n');
  if (firstNewline > 0) {
    return code.slice(0, firstNewline + 1) + scalarSetup + code.slice(firstNewline + 1);
  }

  return scalarSetup + code;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Security Gate
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== ATLAS_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid Bearer token' }, { status: 401 });
    }

    const reqBody = await req.json();
    const { graph } = reqBody;

    if (!graph) {
      return NextResponse.json({ success: false, error: 'Missing graph' }, { status: 400 });
    }

    const port = getAvailablePort();
    const serverDir = join(tmpdir(), `atlas-server-${Date.now()}`);
    mkdirSync(serverDir, { recursive: true });

    // Generate JavaScript code
    let code = reqBody.code;

    // If no code provided, generate it (legacy/fallback)
    if (!code) {
      code = generateServerCode(graph as GraphState, port);
    }

    // Inject Scalar API docs if missing (ensures /api-docs always works)
    code = injectApiDocsIfMissing(code, port);

    const serverFile = join(serverDir, 'server.js');
    writeFileSync(serverFile, code);

    // Write package.json
    const packageJson = {
      name: 'atlas-live-server',
      version: '1.0.0',
      main: 'server.js',
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        '@scalar/express-api-reference': '^0.4.153',
        'jsonwebtoken': '^9.0.0',
        'bcrypt': '^5.1.0',
        'sqlite3': '^5.1.6',
        'pg': '^8.11.3',
        'mysql2': '^3.6.5',
        ...((graph as GraphState).nodes.some(n => n.type === 'SUPABASE') ? { '@supabase/supabase-js': '^2.39.0' } : {}),
        ...((graph as GraphState).nodes.some(n => n.type === 'FIREBASE') ? { 'firebase': '^10.7.0' } : {}),
        ...((graph as GraphState).nodes.some(n => n.type === 'GITHUB') ? { '@octokit/rest': '^20.0.0' } : {}),
      },
    };
    writeFileSync(join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Install dependencies
    console.log('[Atlas] Installing dependencies in', serverDir);
    try {
      // Use --no-audit --no-fund for speed 
      // Remove --silent to see errors in server logs if it fails
      execSync('npm install --no-audit --no-fund', { cwd: serverDir, stdio: 'inherit' });
    } catch (installErr: any) {
      console.error('[Atlas] npm install failed:', installErr.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to install dependencies: ' + installErr.message
      }, { status: 500 });
    }

    // Spawn the server
    console.log('[Atlas] Starting server on port', port);

    // Use external runner to avoid Turbopack analysis of 'spawn' with dynamic paths
    const { spawnServerProcess } = await import('@/core/server/runner');
    const serverProcess = spawnServerProcess(serverDir, port);

    const pid = serverProcess.pid || Date.now();
    runningServers.set(pid, { process: serverProcess, port, workDir: serverDir });

    let stdout = '';
    let stderr = '';

    serverProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Atlas Server ${port}]`, data.toString().trim());
    });

    serverProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.error(`[Atlas Server ${port} ERR]`, data.toString().trim());
    });

    serverProcess.on('close', (code) => {
      console.log(`[Atlas Server ${port}] Exited with code ${code}`);
      runningServers.delete(pid);
    });

    serverProcess.on('error', (err) => {
      console.error(`[Atlas Server ${port}] Process error:`, err.message);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if process is still running
    if (serverProcess.exitCode !== null) {
      return NextResponse.json({
        success: false,
        error: `Server exited immediately with code ${serverProcess.exitCode}. stderr: ${stderr}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      port,
      pid,
      serverDir,
      healthUrl: `http://localhost:${port}/health`,
      message: `Server started on port ${port}`,
    });

  } catch (err: any) {
    console.error('Server start error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


