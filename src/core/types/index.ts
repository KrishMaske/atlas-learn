// =============================================================================
// Atlas Learn - Core Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Node Types
// -----------------------------------------------------------------------------

export type NodeType = 'CLIENT' | 'API' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'WORKER';

export interface Position {
  x: number;
  y: number;
}

// Base node configuration (all nodes have these)
interface BaseNodeConfig {
  capacity: number;      // requests per second
  baseLatency: number;   // ms
}

// Specific configs per node type
export interface ClientConfig {
  rps: number;           // requests per second to generate
  burstMultiplier: number; // for spike scenarios
}

export interface ApiConfig extends BaseNodeConfig {
  errorRate: number;     // 0-1 probability of error
}

export interface DatabaseConfig extends BaseNodeConfig {
  maxConnections: number;
}

export interface CacheConfig extends BaseNodeConfig {
  hitRate: number;       // 0-1 probability of cache hit
  ttl: number;           // time to live in seconds
}

export interface QueueConfig {
  maxSize: number;       // max queue depth
  dropPolicy: 'DROP_OLDEST' | 'REJECT_NEW';
}

export interface WorkerConfig extends BaseNodeConfig {
  concurrency: number;   // number of parallel workers
}

export type NodeConfig = 
  | { type: 'CLIENT'; config: ClientConfig }
  | { type: 'API'; config: ApiConfig }
  | { type: 'DATABASE'; config: DatabaseConfig }
  | { type: 'CACHE'; config: CacheConfig }
  | { type: 'QUEUE'; config: QueueConfig }
  | { type: 'WORKER'; config: WorkerConfig };

// -----------------------------------------------------------------------------
// Graph Data Structures
// -----------------------------------------------------------------------------

export interface NodeData {
  id: string;
  type: NodeType;
  position: Position;
  label: string;
  config: ClientConfig | ApiConfig | DatabaseConfig | CacheConfig | QueueConfig | WorkerConfig;
}

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface GraphState {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNodeId: string | null;
}

// -----------------------------------------------------------------------------
// Simulation Types
// -----------------------------------------------------------------------------

export interface RequestEvent {
  id: string;
  originNodeId: string;
  currentNodeId: string;
  startTime: number;
  latencySoFar: number;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'DROPPED';
}

export interface NodeMetrics {
  nodeId: string;
  throughput: number;      // requests/sec processed
  queueDepth: number;      // current queue size
  utilization: number;     // 0-1 how busy
  errorCount: number;
  latencySum: number;
  requestCount: number;
}

export interface SimulationState {
  tick: number;
  isRunning: boolean;
  isPaused: boolean;
  requests: RequestEvent[];
  nodeMetrics: Map<string, NodeMetrics>;
}

export interface GlobalMetrics {
  throughput: number;
  errorRate: number;
  p50Latency: number;
  p95Latency: number;
  completedRequests: number[];
}

// -----------------------------------------------------------------------------
// Tutorial Types
// -----------------------------------------------------------------------------

export interface LevelObjective {
  metric: 'p95' | 'throughput' | 'errorRate';
  operator: '<' | '>' | '<=';
  value: number;
}

export interface TutorialLevel {
  id: string;
  title: string;
  description: string;
  scenario: string;
  starterGraph: GraphState;
  objectives: LevelObjective[];
  hints: string[];
  explanation: string;
}

// -----------------------------------------------------------------------------
// Default Configurations
// -----------------------------------------------------------------------------

export const DEFAULT_CONFIGS: Record<NodeType, NodeData['config']> = {
  CLIENT: { rps: 100, burstMultiplier: 1 },
  API: { capacity: 200, baseLatency: 10, errorRate: 0.01 },
  DATABASE: { capacity: 100, baseLatency: 50, maxConnections: 50 },
  CACHE: { capacity: 500, baseLatency: 5, hitRate: 0.8, ttl: 300 },
  QUEUE: { maxSize: 1000, dropPolicy: 'REJECT_NEW' },
  WORKER: { capacity: 50, baseLatency: 100, concurrency: 4 },
};

export const NODE_LABELS: Record<NodeType, string> = {
  CLIENT: 'Client',
  API: 'API Server',
  DATABASE: 'Database',
  CACHE: 'Cache',
  QUEUE: 'Queue',
  WORKER: 'Worker',
};
