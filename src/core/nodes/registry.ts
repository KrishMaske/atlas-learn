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
  return 'Logic';
}

const DESCRIPTIONS: Record<NodeType, string> = {
  CONTEXT: 'Provides context and prompts for the AI code generation.',
  REST_API: 'HTTP REST endpoint — handles CRUD operations.',
  GRAPHQL_API: 'GraphQL server — flexible query API with depth/complexity limits.',
  REDIS_CACHE: 'Redis-backed cache with eviction policies and memory limits.',

  SQL_DATABASE: 'SQL database (Postgres / MySQL) with connection pool.',
  NOSQL_DATABASE: 'Document / key-value store (MongoDB / DynamoDB).',
  OBJECT_STORAGE: 'Blob / object storage (S3-compatible).',

  SUPABASE: 'Supabase integration (Auth, DB, Storage).',
  FIREBASE: 'Firebase integration (Auth, Firestore, Storage).',
  GITHUB: 'GitHub integration (Actions, Webhooks).',

  FUNCTION: 'Serverless function / custom logic block.',
};

const CODEGEN_PACKAGES: Record<NodeType, string[]> = {
  CONTEXT: [],
  REST_API: ['express'],
  GRAPHQL_API: ['@apollo/server', 'graphql'],
  REDIS_CACHE: ['ioredis'],

  SQL_DATABASE: ['pg', '@prisma/client'],
  NOSQL_DATABASE: ['mongodb'],
  OBJECT_STORAGE: ['@aws-sdk/client-s3'],

  SUPABASE: ['@supabase/supabase-js'],
  FIREBASE: ['firebase-admin'],
  GITHUB: ['@octokit/rest'],

  FUNCTION: [],
};

const CODEGEN_SLUGS: Record<NodeType, string> = {
  CONTEXT: 'context',
  REST_API: 'restApi',
  GRAPHQL_API: 'graphqlApi',
  REDIS_CACHE: 'redisCache',

  SQL_DATABASE: 'sqlDatabase',
  NOSQL_DATABASE: 'nosqlDatabase',
  OBJECT_STORAGE: 'objectStorage',

  SUPABASE: 'supabase',
  FIREBASE: 'firebase',
  GITHUB: 'github',

  FUNCTION: 'function',
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
