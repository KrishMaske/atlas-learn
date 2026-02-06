// =============================================================================
// Atlas — Core Type Definitions
// =============================================================================
// Every node type, config interface, and shared data structure lives here.
// Node behavior models, simulation, and code generation all depend on these.
// =============================================================================

// -----------------------------------------------------------------------------
// Node Types — organised by architectural category
// -----------------------------------------------------------------------------

export type NodeType =
  // Traffic source
  | 'CLIENT'
  // Networking
  | 'LOAD_BALANCER'
  | 'API_GATEWAY'
  | 'RATE_LIMITER'
  // APIs
  | 'REST_API'
  | 'GRAPHQL_API'
  | 'AUTH_SERVICE'
  | 'API' // kept for tutorial backward-compat
  // Caching
  | 'CACHE' // kept for tutorial backward-compat
  | 'REDIS_CACHE'
  // Storage
  | 'DATABASE' // kept for tutorial backward-compat
  | 'SQL_DATABASE'
  | 'NOSQL_DATABASE'
  | 'OBJECT_STORAGE'
  // Compute / Async
  | 'QUEUE'
  | 'WORKER'
  // Big Data
  | 'STREAM_PROCESSOR'
  | 'BATCH_PROCESSOR'
  | 'ANALYTICS_SINK'
  // Custom
  | 'CUSTOM_LOGIC';

/** Palette category used for sidebar grouping. */
export type NodeCategory =
  | 'Traffic'
  | 'Networking'
  | 'APIs'
  | 'Caching'
  | 'Storage'
  | 'Compute'
  | 'Big Data'
  | 'Custom';

export const NODE_CATEGORIES: Record<NodeCategory, NodeType[]> = {
  Traffic: ['CLIENT'],
  Networking: ['LOAD_BALANCER', 'API_GATEWAY', 'RATE_LIMITER'],
  APIs: ['REST_API', 'GRAPHQL_API', 'AUTH_SERVICE'],
  Caching: ['REDIS_CACHE'],
  Storage: ['SQL_DATABASE', 'NOSQL_DATABASE', 'OBJECT_STORAGE'],
  Compute: ['QUEUE', 'WORKER'],
  'Big Data': ['STREAM_PROCESSOR', 'BATCH_PROCESSOR', 'ANALYTICS_SINK'],
  Custom: ['CUSTOM_LOGIC'],
};

// -----------------------------------------------------------------------------
// Position
// -----------------------------------------------------------------------------

export interface Position {
  x: number;
  y: number;
}

// -----------------------------------------------------------------------------
// Node Configuration Interfaces
// -----------------------------------------------------------------------------

// Common base for nodes that process requests
interface BaseNodeConfig {
  capacity: number; // max requests per second
  baseLatency: number; // processing time in ms
}

// --- Traffic -----------------------------------------------------------

export interface ClientConfig {
  rps: number;
  burstMultiplier: number;
}

// --- Networking --------------------------------------------------------

export interface LoadBalancerConfig extends BaseNodeConfig {
  algorithm: 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'RANDOM' | 'IP_HASH';
  healthCheckIntervalMs: number;
}

export interface ApiGatewayConfig extends BaseNodeConfig {
  authEnabled: boolean;
  rateLimitEnabled: boolean;
  corsEnabled: boolean;
  errorRate: number;
}

export interface RateLimiterConfig {
  maxRequests: number; // requests per window
  windowMs: number; // time window in ms
  capacity: number;
  baseLatency: number;
}

// --- APIs --------------------------------------------------------------

export interface RestApiConfig extends BaseNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  errorRate: number;
}

export interface GraphqlApiConfig extends BaseNodeConfig {
  maxDepth: number;
  maxComplexity: number;
  errorRate: number;
}

export interface AuthServiceConfig extends BaseNodeConfig {
  tokenTTL: number; // seconds
  algorithm: 'JWT' | 'OAuth2';
  errorRate: number;
}

// Legacy API (tutorials)
export interface ApiConfig extends BaseNodeConfig {
  errorRate: number;
}

// --- Caching -----------------------------------------------------------

export interface CacheConfig extends BaseNodeConfig {
  hitRate: number; // 0-1
  ttl: number; // seconds
}

export interface RedisCacheConfig extends BaseNodeConfig {
  hitRate: number;
  ttl: number;
  maxMemoryMB: number;
  evictionPolicy: 'LRU' | 'LFU' | 'RANDOM' | 'TTL';
}

// --- Storage -----------------------------------------------------------

// Legacy Database (tutorials)
export interface DatabaseConfig extends BaseNodeConfig {
  maxConnections: number;
}

export interface SqlDatabaseConfig extends BaseNodeConfig {
  maxConnections: number;
  poolSize: number;
  engine: 'POSTGRES' | 'MYSQL' | 'SQLITE';
}

export interface NosqlDatabaseConfig extends BaseNodeConfig {
  maxConnections: number;
  replicaCount: number;
  engine: 'MONGODB' | 'DYNAMODB' | 'CASSANDRA';
}

export interface ObjectStorageConfig extends BaseNodeConfig {
  maxObjectSizeMB: number;
  region: string;
}

// --- Compute -----------------------------------------------------------

export interface QueueConfig {
  maxSize: number;
  dropPolicy: 'DROP_OLDEST' | 'REJECT_NEW';
}

export interface WorkerConfig extends BaseNodeConfig {
  concurrency: number;
}

// --- Big Data ----------------------------------------------------------

export interface StreamProcessorConfig extends BaseNodeConfig {
  partitions: number;
  consumerGroup: string;
}

export interface BatchProcessorConfig extends BaseNodeConfig {
  batchSize: number;
  scheduleIntervalMs: number;
}

export interface AnalyticsSinkConfig extends BaseNodeConfig {
  flushIntervalMs: number;
  bufferSize: number;
}

// --- Custom ------------------------------------------------------------

export interface CustomLogicConfig extends BaseNodeConfig {
  code: string; // user-defined logic description
  errorRate: number;
}

// -----------------------------------------------------------------------------
// Union type of all configs (used by NodeData)
// -----------------------------------------------------------------------------

export type AnyNodeConfig =
  | ClientConfig
  | LoadBalancerConfig
  | ApiGatewayConfig
  | RateLimiterConfig
  | RestApiConfig
  | GraphqlApiConfig
  | AuthServiceConfig
  | ApiConfig
  | CacheConfig
  | RedisCacheConfig
  | DatabaseConfig
  | SqlDatabaseConfig
  | NosqlDatabaseConfig
  | ObjectStorageConfig
  | QueueConfig
  | WorkerConfig
  | StreamProcessorConfig
  | BatchProcessorConfig
  | AnalyticsSinkConfig
  | CustomLogicConfig;

// -----------------------------------------------------------------------------
// Graph Data Structures
// -----------------------------------------------------------------------------

export interface NodeData {
  id: string;
  type: NodeType;
  position: Position;
  label: string;
  config: AnyNodeConfig;
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
  throughput: number;
  queueDepth: number;
  utilization: number; // 0-1
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
// Default Configurations — one per NodeType
// -----------------------------------------------------------------------------

export const DEFAULT_CONFIGS: Record<NodeType, AnyNodeConfig> = {
  // Traffic
  CLIENT: { rps: 100, burstMultiplier: 1 } as ClientConfig,
  // Networking
  LOAD_BALANCER: { capacity: 1000, baseLatency: 2, algorithm: 'ROUND_ROBIN', healthCheckIntervalMs: 5000 } as LoadBalancerConfig,
  API_GATEWAY: { capacity: 500, baseLatency: 5, authEnabled: true, rateLimitEnabled: true, corsEnabled: true, errorRate: 0.005 } as ApiGatewayConfig,
  RATE_LIMITER: { maxRequests: 100, windowMs: 60000, capacity: 1000, baseLatency: 1 } as RateLimiterConfig,
  // APIs
  REST_API: { capacity: 200, baseLatency: 15, method: 'GET', path: '/api/resource', errorRate: 0.01 } as RestApiConfig,
  GRAPHQL_API: { capacity: 150, baseLatency: 20, maxDepth: 5, maxComplexity: 100, errorRate: 0.01 } as GraphqlApiConfig,
  AUTH_SERVICE: { capacity: 300, baseLatency: 25, tokenTTL: 3600, algorithm: 'JWT', errorRate: 0.005 } as AuthServiceConfig,
  API: { capacity: 200, baseLatency: 10, errorRate: 0.01 } as ApiConfig,
  // Caching
  CACHE: { capacity: 500, baseLatency: 5, hitRate: 0.8, ttl: 300 } as CacheConfig,
  REDIS_CACHE: { capacity: 1000, baseLatency: 2, hitRate: 0.85, ttl: 300, maxMemoryMB: 256, evictionPolicy: 'LRU' } as RedisCacheConfig,
  // Storage
  DATABASE: { capacity: 100, baseLatency: 50, maxConnections: 50 } as DatabaseConfig,
  SQL_DATABASE: { capacity: 100, baseLatency: 40, maxConnections: 50, poolSize: 20, engine: 'POSTGRES' } as SqlDatabaseConfig,
  NOSQL_DATABASE: { capacity: 200, baseLatency: 15, maxConnections: 100, replicaCount: 3, engine: 'MONGODB' } as NosqlDatabaseConfig,
  OBJECT_STORAGE: { capacity: 500, baseLatency: 80, maxObjectSizeMB: 100, region: 'us-east-1' } as ObjectStorageConfig,
  // Compute
  QUEUE: { maxSize: 1000, dropPolicy: 'REJECT_NEW' } as QueueConfig,
  WORKER: { capacity: 50, baseLatency: 100, concurrency: 4 } as WorkerConfig,
  // Big Data
  STREAM_PROCESSOR: { capacity: 500, baseLatency: 10, partitions: 4, consumerGroup: 'default' } as StreamProcessorConfig,
  BATCH_PROCESSOR: { capacity: 100, baseLatency: 200, batchSize: 50, scheduleIntervalMs: 60000 } as BatchProcessorConfig,
  ANALYTICS_SINK: { capacity: 1000, baseLatency: 5, flushIntervalMs: 5000, bufferSize: 500 } as AnalyticsSinkConfig,
  // Custom
  CUSTOM_LOGIC: { capacity: 100, baseLatency: 50, code: '// Custom logic here', errorRate: 0 } as CustomLogicConfig,
};

// -----------------------------------------------------------------------------
// Human-readable labels
// -----------------------------------------------------------------------------

export const NODE_LABELS: Record<NodeType, string> = {
  CLIENT: 'Client',
  LOAD_BALANCER: 'Load Balancer',
  API_GATEWAY: 'API Gateway',
  RATE_LIMITER: 'Rate Limiter',
  REST_API: 'REST API',
  GRAPHQL_API: 'GraphQL API',
  AUTH_SERVICE: 'Auth Service',
  API: 'API Server',
  CACHE: 'Cache',
  REDIS_CACHE: 'Redis Cache',
  DATABASE: 'Database',
  SQL_DATABASE: 'SQL Database',
  NOSQL_DATABASE: 'NoSQL Database',
  OBJECT_STORAGE: 'Object Storage',
  QUEUE: 'Queue',
  WORKER: 'Worker',
  STREAM_PROCESSOR: 'Stream Processor',
  BATCH_PROCESSOR: 'Batch Processor',
  ANALYTICS_SINK: 'Analytics Sink',
  CUSTOM_LOGIC: 'Custom Logic',
};

// -----------------------------------------------------------------------------
// Node visual metadata — icon + color per type
// -----------------------------------------------------------------------------

export interface NodeVisual {
  icon: string;
  colorClass: string; // Tailwind gradient + border classes
  bgClass: string;
  borderClass: string;
}

export const NODE_VISUALS: Record<NodeType, NodeVisual> = {
  CLIENT:           { icon: '👤', colorClass: 'from-blue-500/20 to-blue-600/20 border-blue-500/50', bgClass: 'bg-blue-500/20', borderClass: 'border-blue-500' },
  LOAD_BALANCER:    { icon: '⚖️', colorClass: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/50', bgClass: 'bg-cyan-500/20', borderClass: 'border-cyan-500' },
  API_GATEWAY:      { icon: '🚪', colorClass: 'from-teal-500/20 to-teal-600/20 border-teal-500/50', bgClass: 'bg-teal-500/20', borderClass: 'border-teal-500' },
  RATE_LIMITER:     { icon: '🛑', colorClass: 'from-rose-500/20 to-rose-600/20 border-rose-500/50', bgClass: 'bg-rose-500/20', borderClass: 'border-rose-500' },
  REST_API:         { icon: '🔀', colorClass: 'from-green-500/20 to-green-600/20 border-green-500/50', bgClass: 'bg-green-500/20', borderClass: 'border-green-500' },
  GRAPHQL_API:      { icon: '◈',  colorClass: 'from-pink-500/20 to-pink-600/20 border-pink-500/50', bgClass: 'bg-pink-500/20', borderClass: 'border-pink-500' },
  AUTH_SERVICE:     { icon: '🔐', colorClass: 'from-amber-500/20 to-amber-600/20 border-amber-500/50', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500' },
  API:              { icon: '🔀', colorClass: 'from-green-500/20 to-green-600/20 border-green-500/50', bgClass: 'bg-green-500/20', borderClass: 'border-green-500' },
  CACHE:            { icon: '⚡', colorClass: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50', bgClass: 'bg-yellow-500/20', borderClass: 'border-yellow-500' },
  REDIS_CACHE:      { icon: '⚡', colorClass: 'from-red-500/20 to-red-600/20 border-red-500/50', bgClass: 'bg-red-500/20', borderClass: 'border-red-500' },
  DATABASE:         { icon: '🗄️', colorClass: 'from-purple-500/20 to-purple-600/20 border-purple-500/50', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500' },
  SQL_DATABASE:     { icon: '🗄️', colorClass: 'from-purple-500/20 to-purple-600/20 border-purple-500/50', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500' },
  NOSQL_DATABASE:   { icon: '📦', colorClass: 'from-violet-500/20 to-violet-600/20 border-violet-500/50', bgClass: 'bg-violet-500/20', borderClass: 'border-violet-500' },
  OBJECT_STORAGE:   { icon: '☁️', colorClass: 'from-sky-500/20 to-sky-600/20 border-sky-500/50', bgClass: 'bg-sky-500/20', borderClass: 'border-sky-500' },
  QUEUE:            { icon: '📋', colorClass: 'from-orange-500/20 to-orange-600/20 border-orange-500/50', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500' },
  WORKER:           { icon: '⚙️', colorClass: 'from-red-500/20 to-red-600/20 border-red-400/50', bgClass: 'bg-red-500/20', borderClass: 'border-red-400' },
  STREAM_PROCESSOR: { icon: '🌊', colorClass: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/50', bgClass: 'bg-indigo-500/20', borderClass: 'border-indigo-500' },
  BATCH_PROCESSOR:  { icon: '📊', colorClass: 'from-lime-500/20 to-lime-600/20 border-lime-500/50', bgClass: 'bg-lime-500/20', borderClass: 'border-lime-500' },
  ANALYTICS_SINK:   { icon: '📈', colorClass: 'from-fuchsia-500/20 to-fuchsia-600/20 border-fuchsia-500/50', bgClass: 'bg-fuchsia-500/20', borderClass: 'border-fuchsia-500' },
  CUSTOM_LOGIC:     { icon: '🧩', colorClass: 'from-slate-400/20 to-slate-500/20 border-slate-400/50', bgClass: 'bg-slate-400/20', borderClass: 'border-slate-400' },
};
