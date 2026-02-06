// =============================================================================
// Atlas — Node Definition Registry
// =============================================================================
// Central registry mapping each NodeType to its metadata: description,
// simulation behaviour hints, and code-generation mapping.
// This is the single source of truth consumed by palette, inspector, sim, and
// codegen layers.
// =============================================================================

import {
  NodeType,
  NodeCategory,
  NODE_CATEGORIES,
  NODE_LABELS,
  NODE_VISUALS,
  DEFAULT_CONFIGS,
  AnyNodeConfig,
  NodeVisual,
} from '@/core/types';

// -----------------------------------------------------------------------------
// Node Definition
// -----------------------------------------------------------------------------

export interface NodeDefinition {
  type: NodeType;
  label: string;
  category: NodeCategory;
  description: string;
  visual: NodeVisual;
  defaultConfig: AnyNodeConfig;
  /** NPM packages required when generating code for this node. */
  codegenPackages: string[];
  /** Short identifier used in generated filenames / variable names. */
  codegenSlug: string;
}

// -----------------------------------------------------------------------------
// Build Registry
// -----------------------------------------------------------------------------

function categoryOf(type: NodeType): NodeCategory {
  for (const [cat, types] of Object.entries(NODE_CATEGORIES)) {
    if (types.includes(type)) return cat as NodeCategory;
  }
  return 'Custom';
}

const DESCRIPTIONS: Record<NodeType, string> = {
  CLIENT: 'Generates traffic — represents end users or external systems sending requests.',
  LOAD_BALANCER: 'Distributes incoming requests across multiple downstream services.',
  API_GATEWAY: 'Single entry point handling auth, rate limiting, and routing.',
  RATE_LIMITER: 'Throttles requests to protect downstream services from overload.',
  REST_API: 'HTTP REST endpoint — handles CRUD operations.',
  GRAPHQL_API: 'GraphQL server — flexible query API with depth/complexity limits.',
  AUTH_SERVICE: 'Handles authentication and token generation (JWT / OAuth2).',
  API: 'Generic API server that processes requests.',
  CACHE: 'In-memory cache with configurable hit rate and TTL.',
  REDIS_CACHE: 'Redis-backed cache with eviction policies and memory limits.',
  DATABASE: 'Generic relational database with connection pooling.',
  SQL_DATABASE: 'SQL database (Postgres / MySQL) with connection pool.',
  NOSQL_DATABASE: 'Document / key-value store (MongoDB / DynamoDB).',
  OBJECT_STORAGE: 'Blob / object storage (S3-compatible).',
  QUEUE: 'Message queue that buffers requests between producers and consumers.',
  WORKER: 'Background worker that consumes from a queue.',
  STREAM_PROCESSOR: 'Real-time stream processing with partitions.',
  BATCH_PROCESSOR: 'Scheduled batch processing jobs.',
  ANALYTICS_SINK: 'Collects and flushes analytics / telemetry events.',
  CUSTOM_LOGIC: 'User-defined processing logic.',
};

const CODEGEN_PACKAGES: Record<NodeType, string[]> = {
  CLIENT: [],
  LOAD_BALANCER: ['http-proxy-middleware'],
  API_GATEWAY: ['express', 'cors', 'helmet', 'express-rate-limit'],
  RATE_LIMITER: ['express-rate-limit'],
  REST_API: ['express'],
  GRAPHQL_API: ['@apollo/server', 'graphql'],
  AUTH_SERVICE: ['jsonwebtoken', 'bcryptjs'],
  API: ['express'],
  CACHE: ['node-cache'],
  REDIS_CACHE: ['ioredis'],
  DATABASE: ['pg'],
  SQL_DATABASE: ['pg', '@prisma/client'],
  NOSQL_DATABASE: ['mongodb'],
  OBJECT_STORAGE: ['@aws-sdk/client-s3'],
  QUEUE: ['bullmq', 'ioredis'],
  WORKER: ['bullmq', 'ioredis'],
  STREAM_PROCESSOR: ['kafkajs'],
  BATCH_PROCESSOR: ['node-cron'],
  ANALYTICS_SINK: [],
  CUSTOM_LOGIC: [],
};

const CODEGEN_SLUGS: Record<NodeType, string> = {
  CLIENT: 'client',
  LOAD_BALANCER: 'loadBalancer',
  API_GATEWAY: 'gateway',
  RATE_LIMITER: 'rateLimiter',
  REST_API: 'restApi',
  GRAPHQL_API: 'graphqlApi',
  AUTH_SERVICE: 'authService',
  API: 'apiServer',
  CACHE: 'cache',
  REDIS_CACHE: 'redisCache',
  DATABASE: 'database',
  SQL_DATABASE: 'sqlDatabase',
  NOSQL_DATABASE: 'nosqlDatabase',
  OBJECT_STORAGE: 'objectStorage',
  QUEUE: 'queue',
  WORKER: 'worker',
  STREAM_PROCESSOR: 'streamProcessor',
  BATCH_PROCESSOR: 'batchProcessor',
  ANALYTICS_SINK: 'analyticsSink',
  CUSTOM_LOGIC: 'customLogic',
};

// Pre-built registry — built once at module load.
const REGISTRY: Map<NodeType, NodeDefinition> = new Map();

for (const [cat, types] of Object.entries(NODE_CATEGORIES)) {
  for (const type of types) {
    REGISTRY.set(type, {
      type,
      label: NODE_LABELS[type],
      category: cat as NodeCategory,
      description: DESCRIPTIONS[type],
      visual: NODE_VISUALS[type],
      defaultConfig: DEFAULT_CONFIGS[type],
      codegenPackages: CODEGEN_PACKAGES[type],
      codegenSlug: CODEGEN_SLUGS[type],
    });
  }
}

// Also register legacy types not in NODE_CATEGORIES
for (const legacyType of ['API', 'CACHE', 'DATABASE'] as NodeType[]) {
  if (!REGISTRY.has(legacyType)) {
    REGISTRY.set(legacyType, {
      type: legacyType,
      label: NODE_LABELS[legacyType],
      category: categoryOf(legacyType),
      description: DESCRIPTIONS[legacyType],
      visual: NODE_VISUALS[legacyType],
      defaultConfig: DEFAULT_CONFIGS[legacyType],
      codegenPackages: CODEGEN_PACKAGES[legacyType],
      codegenSlug: CODEGEN_SLUGS[legacyType],
    });
  }
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function getNodeDefinition(type: NodeType): NodeDefinition | undefined {
  return REGISTRY.get(type);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
  return Array.from(REGISTRY.values());
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return (NODE_CATEGORIES[category] || [])
    .map((t) => REGISTRY.get(t))
    .filter(Boolean) as NodeDefinition[];
}

export function getAllCategories(): NodeCategory[] {
  return Object.keys(NODE_CATEGORIES) as NodeCategory[];
}
