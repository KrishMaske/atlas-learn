import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess, execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GraphState, NodeData, EdgeData } from '@/core/types';

// Store running server processes
const runningServers: Map<number, { process: ChildProcess; port: number }> = new Map();

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
  
  lines.push(`const express = require('express');`);
  lines.push(`const cors = require('cors');`);
  lines.push(`const app = express();`);
  lines.push(`app.use(cors());`);
  lines.push(`app.use(express.json());`);
  lines.push(``);
  lines.push(`// Health check`);
  lines.push(`app.get('/health', (req, res) => {`);
  lines.push(`  res.json({ status: 'ok', nodes: ${nodes.length}, timestamp: Date.now() });`);
  lines.push(`});`);
  lines.push(``);

  // Generate routes for each node
  for (const node of nodes) {
    const slug = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const routePath = getRoutePath(node);
    const userCode = node.config.customCode || getDefaultCode(node, edges, nodes);
    
    // Determine HTTP method
    let method = 'post';
    if (['REST_API', 'API', 'API_GATEWAY'].includes(node.type)) {
       const config = node.config as any;
       if (config.method) method = config.method.toLowerCase();
    }
    
    // If it's a GET request, we shouldn't try to read req.body for input usually, 
    // but Express handles it fine. For browser testing, GET is essential.
    
    lines.push(`// Node: ${node.label} (${node.type})`);
    lines.push(`app.${method}('${routePath}', async (req, res) => {`);
    lines.push(`  try {`);
    lines.push(`    const input = req.method === 'GET' ? req.query : (req.body || {});`);
    lines.push(`    console.log('[${node.label}] Received (${method.toUpperCase()}):', JSON.stringify(input).slice(0, 100));`);
    
    // Add user code with proper indentation
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

  lines.push(`app.listen(${port}, () => {`);
  lines.push(`  console.log('[Atlas] Server running on http://localhost:${port}');`);
  lines.push(`  console.log('[Atlas] Health check: http://localhost:${port}/health');`);
  lines.push(`});`);

  return lines.join('\n');
}

function getRoutePath(node: NodeData): string {
  const slug = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  switch (node.type) {
    case 'CLIENT': return `/client/${slug}`;
    case 'API_GATEWAY': return `/gateway`;
    case 'LOAD_BALANCER': return `/lb`;
    case 'REST_API':
    case 'API': return `/api/${slug}`;
    case 'GRAPHQL_API': return `/graphql`;
    case 'AUTH_SERVICE': return `/auth`;
    case 'CACHE':
    case 'REDIS_CACHE': return `/cache/${slug}`;
    case 'DATABASE':
    case 'SQL_DATABASE':
    case 'NOSQL_DATABASE': return `/db/${slug}`;
    case 'QUEUE': return `/queue/${slug}`;
    case 'WORKER': return `/worker/${slug}`;
    default: return `/${slug}`;
  }
}

function getDefaultCode(node: NodeData, edges: EdgeData[], allNodes: NodeData[]): string {
  return `res.json({ node: '${node.label}', type: '${node.type}', data: input, timestamp: Date.now() });`;
}

export async function POST(req: NextRequest) {
  try {
    const { graph } = await req.json();
    
    if (!graph) {
      return NextResponse.json({ success: false, error: 'Missing graph' }, { status: 400 });
    }

    const port = getAvailablePort();
    const serverDir = join(tmpdir(), `atlas-server-${Date.now()}`);
    mkdirSync(serverDir, { recursive: true });

    // Generate JavaScript code
    const code = generateServerCode(graph as GraphState, port);
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
      },
    };
    writeFileSync(join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Install dependencies
    console.log('[Atlas] Installing dependencies in', serverDir);
    try {
      execSync('npm install --silent', { cwd: serverDir, stdio: 'pipe' });
    } catch (installErr: any) {
      console.error('[Atlas] npm install failed:', installErr.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to install dependencies: ' + installErr.message 
      }, { status: 500 });
    }

    // Spawn the server
    console.log('[Atlas] Starting server on port', port);
    const serverProcess = spawn('node', ['server.js'], {
      cwd: serverDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    const pid = serverProcess.pid || Date.now();
    runningServers.set(pid, { process: serverProcess, port });

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

export { runningServers };
