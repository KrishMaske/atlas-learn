// =============================================================================
// Atlas — Intermediate Representation (IR)
// =============================================================================
// The IR is a compiler-style intermediate step between the visual graph and the
// generated backend code.  It normalises the graph into a set of "service"
// descriptors that the codegen layer can iterate over deterministically.
//
// Graph  →  IR  →  Generated Code
// =============================================================================

import {
  NodeData,
  EdgeData,
  GraphState,
  NodeType,
  AnyNodeConfig,
} from '@/core/types';
import { getNodeDefinition } from '@/core/nodes/registry';

// -----------------------------------------------------------------------------
// IR Types
// -----------------------------------------------------------------------------

/** One logical service in the generated backend. */
export interface IRService {
  /** Stable identifier derived from the graph node id. */
  id: string;
  /** Human-friendly name for the service (used in filenames & comments). */
  name: string;
  /** The Atlas node type that produced this service. */
  nodeType: NodeType;
  /** camelCase slug safe for variable / file names. */
  slug: string;
  /** Full configuration from the graph node. */
  config: AnyNodeConfig;
  /** IDs of downstream services this service sends requests to. */
  downstreamIds: string[];
  /** IDs of upstream services that send requests to this service. */
  upstreamIds: string[];
  /** NPM packages this service requires. */
  packages: string[];
  /** Port number to expose (auto-assigned). */
  port: number;
}

/** A connection between two services. */
export interface IRConnection {
  sourceId: string;
  targetId: string;
  /** HTTP / queue / stream – determines how the codegen wires them. */
  protocol: 'http' | 'queue' | 'stream' | 'direct';
}

/** The complete IR for a graph. */
export interface IR {
  projectName: string;
  services: IRService[];
  connections: IRConnection[];
  /** Deduplicated list of all packages across services. */
  allPackages: string[];
}

// -----------------------------------------------------------------------------
// IR Compiler
// -----------------------------------------------------------------------------

/**
 * Compile a GraphState into an IR.  This is a pure function — no side effects.
 */
export function compileGraphToIR(
  graph: GraphState,
  projectName: string = 'atlas-backend',
): IR {
  const { nodes, edges } = graph;

  // Build adjacency maps
  const downstreamMap = new Map<string, string[]>();
  const upstreamMap = new Map<string, string[]>();
  for (const node of nodes) {
    downstreamMap.set(node.id, []);
    upstreamMap.set(node.id, []);
  }
  for (const edge of edges) {
    downstreamMap.get(edge.sourceId)?.push(edge.targetId);
    upstreamMap.get(edge.targetId)?.push(edge.sourceId);
  }

  // Assign ports starting from 3000
  let portCounter = 3000;

  // Build services
  const services: IRService[] = nodes
    .filter((n) => n.type !== 'CLIENT') // Clients are traffic sources, not backend services
    .map((node) => {
      const def = getNodeDefinition(node.type);
      return {
        id: node.id,
        name: node.label,
        nodeType: node.type,
        slug: def?.codegenSlug ?? toSlug(node.label),
        config: node.config,
        downstreamIds: downstreamMap.get(node.id) ?? [],
        upstreamIds: upstreamMap.get(node.id) ?? [],
        packages: def?.codegenPackages ?? [],
        port: portCounter++,
      };
    });

  // Build connections
  const connections: IRConnection[] = edges
    .filter((e) => nodes.find((n) => n.id === e.sourceId)?.type !== 'CLIENT')
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.sourceId);
      return {
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        protocol: inferProtocol(sourceNode, nodes.find((n) => n.id === edge.targetId)),
      };
    });

  // Also add connections from CLIENT → first downstream as HTTP connections
  for (const edge of edges) {
    const src = nodes.find((n) => n.id === edge.sourceId);
    if (src?.type === 'CLIENT') {
      connections.push({
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        protocol: 'http',
      });
    }
  }

  // Collect all packages
  const pkgSet = new Set<string>();
  for (const svc of services) {
    for (const pkg of svc.packages) {
      pkgSet.add(pkg);
    }
  }
  // Always include express + typescript
  pkgSet.add('express');
  pkgSet.add('typescript');
  pkgSet.add('ts-node');
  pkgSet.add('@types/express');
  pkgSet.add('@types/node');

  return {
    projectName,
    services,
    connections,
    allPackages: Array.from(pkgSet).sort(),
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferProtocol(
  source: NodeData | undefined,
  target: NodeData | undefined,
): IRConnection['protocol'] {
  if (!source || !target) return 'http';

  const queueTypes: NodeType[] = ['QUEUE'];
  const streamTypes: NodeType[] = ['STREAM_PROCESSOR', 'BATCH_PROCESSOR'];

  if (queueTypes.includes(source.type) || queueTypes.includes(target.type)) {
    return 'queue';
  }
  if (streamTypes.includes(source.type) || streamTypes.includes(target.type)) {
    return 'stream';
  }
  return 'http';
}
