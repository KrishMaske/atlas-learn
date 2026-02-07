// =============================================================================
// Atlas — Graph to Code Generator
// =============================================================================
// Generates a single runnable Express TypeScript file from the graph.
// This is designed for live preview/execution, not full project export.
// =============================================================================

import { GraphState, NodeData, EdgeData, NodeType } from '@/core/types';

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

  // --- Health Check ---
  lines.push(`// Health check`);
  lines.push(`app.get('/health', (_req, res) => {`);
  lines.push(`  res.json({ status: 'ok', nodes: ${nodes.length} });`);
  lines.push(`});`);
  lines.push(``);

  // --- Node Handlers ---
  for (const node of nodes) {
    lines.push(generateNodeBlock(node, edges, nodes));
    lines.push(``);
  }

  // --- Server Start ---
  lines.push(`const PORT = process.env.PORT || 3001;`);
  lines.push(`app.listen(PORT, () => {`);
  lines.push(`  console.log(\`[Atlas Server] Running on http://localhost:\${PORT}\`);`);
  lines.push(`});`);

  return lines.join('\n');
}

function generateNodeBlock(node: NodeData, edges: EdgeData[], allNodes: NodeData[]): string {
  const downstreamEdges = edges.filter(e => e.sourceId === node.id);
  const downstreamNodes = downstreamEdges
    .map(e => allNodes.find(n => n.id === e.targetId))
    .filter(Boolean) as NodeData[];

  const routePath = getRoutePath(node);
  const httpMethod = getHttpMethod(node);

  const defaultCode = getDefaultNodeCode(node, downstreamNodes);
  const userCode = node.config.customCode || defaultCode;

  const lines: string[] = [];
  lines.push(`// --- NODE: ${node.id} (${node.type}) ---`);
  lines.push(`// Label: ${node.label}`);
  lines.push(`app.${httpMethod}('${routePath}', async (req, res) => {`);
  lines.push(`  try {`);
  lines.push(`    const input = req.body || {};`);
  lines.push(`    // --- USER CODE START ---`);
  
  // Indent user code
  const userCodeLines = userCode.split('\n');
  for (const line of userCodeLines) {
    lines.push(`    ${line}`);
  }
  
  lines.push(`    // --- USER CODE END ---`);
  lines.push(`  } catch (err: any) {`);
  lines.push(`    res.status(500).json({ error: err.message });`);
  lines.push(`  }`);
  lines.push(`});`);
  lines.push(`// --- END NODE: ${node.id} ---`);

  return lines.join('\n');
}

function getRoutePath(node: NodeData): string {
  // Generate a route path based on node type and label
  const slug = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  switch (node.type) {
    case 'CLIENT':
      return `/client/${slug}`;
    case 'API_GATEWAY':
      return `/gateway`;
    case 'LOAD_BALANCER':
      return `/lb`;
    case 'REST_API':
    case 'API':
      return `/api/${slug}`;
    case 'GRAPHQL_API':
      return `/graphql`;
    case 'AUTH_SERVICE':
      return `/auth`;
    case 'CACHE':
    case 'REDIS_CACHE':
      return `/cache/${slug}`;
    case 'DATABASE':
    case 'SQL_DATABASE':
    case 'NOSQL_DATABASE':
      return `/db/${slug}`;
    case 'QUEUE':
      return `/queue/${slug}`;
    case 'WORKER':
      return `/worker/${slug}`;
    default:
      return `/${slug}`;
  }
}

function getHttpMethod(node: NodeData): string {
  // Most nodes use POST for data processing, APIs use their configured method
  if (node.type === 'REST_API' || node.type === 'API') {
    const config = node.config as any;
    return (config.method || 'get').toLowerCase();
  }
  return 'post';
}

function getDefaultNodeCode(node: NodeData, downstreamNodes: NodeData[]): string {
  const lines: string[] = [];
  
  lines.push(`console.log('[${node.label}] Processing request');`);
  
  if (downstreamNodes.length > 0) {
    lines.push(``);
    lines.push(`// Call downstream services`);
    for (const ds of downstreamNodes) {
      const dsPath = getRoutePath(ds);
      lines.push(`const ${sanitizeVarName(ds.label)}Result = await fetch(\`http://localhost:\${PORT}${dsPath}\`, {`);
      lines.push(`  method: 'POST',`);
      lines.push(`  headers: { 'Content-Type': 'application/json' },`);
      lines.push(`  body: JSON.stringify(input),`);
      lines.push(`}).then(r => r.json());`);
    }
    lines.push(``);
    lines.push(`res.json({`);
    lines.push(`  node: '${node.label}',`);
    for (const ds of downstreamNodes) {
      lines.push(`  ${sanitizeVarName(ds.label)}: ${sanitizeVarName(ds.label)}Result,`);
    }
    lines.push(`});`);
  } else {
    lines.push(`res.json({ node: '${node.label}', data: input, timestamp: Date.now() });`);
  }

  return lines.join('\n');
}

function sanitizeVarName(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}
