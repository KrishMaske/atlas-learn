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
  // Context
  | 'CONTEXT'
  // APIs
  | 'REST_API'
  | 'GRAPHQL_API'
  // Caching
  | 'REDIS_CACHE'
  // Storage
  | 'SQL_DATABASE'
  | 'NOSQL_DATABASE'
  | 'OBJECT_STORAGE'
  // Services / Integrations
  | 'SUPABASE'
  | 'FIREBASE'
  | 'GITHUB'
  // Logic
  | 'FUNCTION'; // Replaces Custom Logic

/** Palette category used for sidebar grouping. */
export type NodeCategory =
  | 'Context'
  | 'APIs'
  | 'Data'
  | 'Integrations'
  | 'Logic';

export const NODE_CATEGORIES: Record<NodeCategory, NodeType[]> = {
  Context: ['CONTEXT'],
  APIs: ['REST_API', 'GRAPHQL_API'],
  Data: ['REDIS_CACHE', 'SQL_DATABASE', 'NOSQL_DATABASE', 'OBJECT_STORAGE'],
  Integrations: ['SUPABASE', 'FIREBASE', 'GITHUB'],
  Logic: ['FUNCTION'],
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
  jobSpec?: string; // description of the node's responsibility
  customCode?: string; // user-defined implementation logic
  sampleInput?: any; // sample input for Swagger UI example
}

// --- Context -----------------------------------------------------------

export interface ContextConfig {
  context: string; // The system context / prompt for AI
  files?: string[]; // Files to include in context
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



// --- Caching -----------------------------------------------------------

export interface RedisCacheConfig extends BaseNodeConfig {
  hitRate: number;
  ttl: number;
  maxMemoryMB: number;
  evictionPolicy: 'LRU' | 'LFU' | 'RANDOM' | 'TTL';
}

// --- Storage -----------------------------------------------------------



export interface SqlDatabaseConfig extends BaseNodeConfig {
  maxConnections: number;
  poolSize: number;
  engine: 'POSTGRES' | 'MYSQL' | 'SQLITE';
  dbType?: 'sqlite' | 'postgres' | 'mysql'; // Simplified type for code generation
  schema?: string; // Table schema description
  connectionString?: string;
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

// --- Services / Integrations -------------------------------------------

export interface SupabaseConfig extends BaseNodeConfig {
  features: ('AUTH' | 'DB' | 'STORAGE' | 'EDGE')[];
  url?: string;
  key?: string;
}

export interface FirebaseConfig extends BaseNodeConfig {
  features: ('AUTH' | 'FIRESTORE' | 'STORAGE' | 'FUNCTIONS')[];
  projectId?: string;
  apiKey?: string;
}

export interface GithubConfig extends BaseNodeConfig {
  repo: string;
  branch: string;
  actions: boolean;
}

// --- Logic -----------------------------------------------------------

export interface FunctionConfig extends BaseNodeConfig {
  language: 'typescript' | 'python' | 'go';
  code: string;
}



// -----------------------------------------------------------------------------
// Union type of all configs (used by NodeData)
// -----------------------------------------------------------------------------

export type AnyNodeConfig =
  | ContextConfig
  | RestApiConfig
  | GraphqlApiConfig
  | RedisCacheConfig
  | SqlDatabaseConfig
  | NosqlDatabaseConfig
  | ObjectStorageConfig
  | SupabaseConfig
  | FirebaseConfig
  | GithubConfig
  | FunctionConfig;

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
  selectedEdgeId: string | null;
}


// -----------------------------------------------------------------------------
// Default Configurations — one per NodeType
// -----------------------------------------------------------------------------

export const DEFAULT_CONFIGS: Record<NodeType, AnyNodeConfig> = {
  // Context
  CONTEXT: { context: 'Describe your system here...', files: [] } as ContextConfig,
  // APIs
  REST_API: { capacity: 200, baseLatency: 15, method: 'GET', path: '/api/resource', errorRate: 0.01 } as RestApiConfig,
  GRAPHQL_API: { capacity: 150, baseLatency: 20, maxDepth: 5, maxComplexity: 100, errorRate: 0.01 } as GraphqlApiConfig,
  // Data
  REDIS_CACHE: { capacity: 1000, baseLatency: 2, hitRate: 0.85, ttl: 300, maxMemoryMB: 256, evictionPolicy: 'LRU' } as RedisCacheConfig,
  SQL_DATABASE: { capacity: 100, baseLatency: 40, maxConnections: 50, poolSize: 20, engine: 'POSTGRES' } as SqlDatabaseConfig,
  NOSQL_DATABASE: { capacity: 200, baseLatency: 15, maxConnections: 100, replicaCount: 3, engine: 'MONGODB' } as NosqlDatabaseConfig,
  OBJECT_STORAGE: { capacity: 500, baseLatency: 80, maxObjectSizeMB: 100, region: 'us-east-1' } as ObjectStorageConfig,
  // Integrations
  SUPABASE: { capacity: 500, baseLatency: 20, features: ['DB', 'AUTH'] } as SupabaseConfig,
  FIREBASE: { capacity: 500, baseLatency: 20, features: ['FIRESTORE', 'AUTH'] } as FirebaseConfig,
  GITHUB: { capacity: 100, baseLatency: 200, repo: '', branch: 'main', actions: true } as GithubConfig,
  // Logic
  FUNCTION: { capacity: 100, baseLatency: 10, language: 'typescript', code: '// Your code here', errorRate: 0 } as FunctionConfig,
};

// -----------------------------------------------------------------------------
// Human-readable labels
// -----------------------------------------------------------------------------

export const NODE_LABELS: Record<NodeType, string> = {
  CONTEXT: 'Context / Prompt',
  REST_API: 'REST API',
  GRAPHQL_API: 'GraphQL API',
  REDIS_CACHE: 'Redis Cache',
  SQL_DATABASE: 'SQL Database',
  NOSQL_DATABASE: 'NoSQL Database',
  OBJECT_STORAGE: 'Object Storage',
  SUPABASE: 'Supabase',
  FIREBASE: 'Firebase',
  GITHUB: 'GitHub',
  FUNCTION: 'Function',
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
  CONTEXT: { icon: '📝', colorClass: 'from-blue-500/20 to-blue-600/20 border-blue-500/50', bgClass: 'bg-blue-500/20', borderClass: 'border-blue-500' },
  REST_API: { icon: '🔀', colorClass: 'from-green-500/20 to-green-600/20 border-green-500/50', bgClass: 'bg-green-500/20', borderClass: 'border-green-500' },
  GRAPHQL_API: { icon: '◈', colorClass: 'from-pink-500/20 to-pink-600/20 border-pink-500/50', bgClass: 'bg-pink-500/20', borderClass: 'border-pink-500' },
  REDIS_CACHE: { icon: '⚡', colorClass: 'from-red-500/20 to-red-600/20 border-red-500/50', bgClass: 'bg-red-500/20', borderClass: 'border-red-500' },
  SQL_DATABASE: { icon: '🗄️', colorClass: 'from-purple-500/20 to-purple-600/20 border-purple-500/50', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500' },
  NOSQL_DATABASE: { icon: '📦', colorClass: 'from-violet-500/20 to-violet-600/20 border-violet-500/50', bgClass: 'bg-violet-500/20', borderClass: 'border-violet-500' },
  OBJECT_STORAGE: { icon: '☁️', colorClass: 'from-sky-500/20 to-sky-600/20 border-sky-500/50', bgClass: 'bg-sky-500/20', borderClass: 'border-sky-500' },
  SUPABASE: { icon: '🟢', colorClass: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500' },
  FIREBASE: { icon: '🔥', colorClass: 'from-orange-500/20 to-orange-600/20 border-orange-500/50', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500' },
  GITHUB: { icon: '🐙', colorClass: 'from-slate-500/20 to-slate-600/20 border-slate-500/50', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-500' },
  FUNCTION: { icon: 'λ', colorClass: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/50', bgClass: 'bg-indigo-500/20', borderClass: 'border-indigo-500' },
};
