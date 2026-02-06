// =============================================================================
// Atlas — Node Behavior Models (simulation layer)
// =============================================================================
// Pure functions that define how each node type processes requests in a single
// simulation tick.  No UI or rendering logic — only data in, data out.
// =============================================================================

import {
  NodeData,
  NodeType,
  ClientConfig,
  ApiConfig,
  DatabaseConfig,
  CacheConfig,
  QueueConfig,
  WorkerConfig,
  LoadBalancerConfig,
  ApiGatewayConfig,
  RateLimiterConfig,
  RestApiConfig,
  GraphqlApiConfig,
  AuthServiceConfig,
  RedisCacheConfig,
  SqlDatabaseConfig,
  NosqlDatabaseConfig,
  ObjectStorageConfig,
  StreamProcessorConfig,
  BatchProcessorConfig,
  AnalyticsSinkConfig,
  CustomLogicConfig,
} from '@/core/types';

// -----------------------------------------------------------------------------
// Request Interface
// -----------------------------------------------------------------------------

export interface SimRequest {
  id: string;
  arrivalTick: number;
  latency: number;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'DROPPED';
}

// -----------------------------------------------------------------------------
// Node State (internal simulation state per node)
// -----------------------------------------------------------------------------

export interface NodeState {
  queue: SimRequest[];
  processing: SimRequest[];
  completed: SimRequest[];
  utilization: number;
  throughput: number;
  errorCount: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function createInitialNodeState(): NodeState {
  return {
    queue: [],
    processing: [],
    completed: [],
    utilization: 0,
    throughput: 0,
    errorCount: 0,
  };
}

// Generate requests from client node
function generateClientRequests(config: ClientConfig, tick: number): SimRequest[] {
  const requests: SimRequest[] = [];
  const rps = config.rps * config.burstMultiplier;
  // 1 tick = 100ms → divide rps by 10 to get per-tick count
  const requestsThisTick = Math.floor(rps / 10);

  for (let i = 0; i < requestsThisTick; i++) {
    requests.push({
      id: `req_${tick}_${i}`,
      arrivalTick: tick,
      latency: 0,
      status: 'PENDING',
    });
  }
  return requests;
}

// Process queue with capacity, latency, and error rate
function processNodeQueue(
  state: NodeState,
  queue: SimRequest[],
  capacity: number,
  baseLatency: number,
  errorRate: number,
  outgoing: SimRequest[],
): { state: NodeState; outgoing: SimRequest[] } {
  const newState = { ...state };
  // capacity is per-second; divide by 10 for per-tick
  const perTick = Math.max(1, Math.floor(capacity / 10));
  const toProcess = Math.min(queue.length, perTick);
  const processed = queue.splice(0, toProcess);
  const remaining = queue;

  for (const req of processed) {
    req.latency += baseLatency;

    // Add queueing delay proportional to queue depth
    if (capacity > 0) {
      const queueDelay = (remaining.length / perTick) * baseLatency * 0.5;
      req.latency += queueDelay;
    }

    if (Math.random() < errorRate) {
      req.status = 'ERROR';
      newState.errorCount++;
      newState.completed.push(req);
    } else {
      req.status = 'SUCCESS';
      outgoing.push(req);
    }
  }

  newState.queue = remaining;
  newState.utilization =
    remaining.length > 0
      ? Math.min(1, (remaining.length + toProcess) / perTick)
      : perTick > 0
        ? toProcess / perTick
        : 0;
  newState.throughput = toProcess;

  return { state: newState, outgoing };
}

// -----------------------------------------------------------------------------
// Main dispatch — process a single node for one tick
// -----------------------------------------------------------------------------

export function processNode(
  node: NodeData,
  state: NodeState,
  incomingRequests: SimRequest[],
  tick: number,
): { state: NodeState; outgoing: SimRequest[] } {
  const newState: NodeState = {
    ...state,
    queue: [...state.queue, ...incomingRequests],
    completed: [...state.completed],
  };
  const outgoing: SimRequest[] = [];
  const config = node.config;

  switch (node.type as NodeType) {
    // --- Traffic -----------------------------------------------------------
    case 'CLIENT': {
      return { state: newState, outgoing: generateClientRequests(config as ClientConfig, tick) };
    }

    // --- Networking --------------------------------------------------------
    case 'LOAD_BALANCER': {
      const c = config as LoadBalancerConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, 0, outgoing);
    }

    case 'API_GATEWAY': {
      const c = config as ApiGatewayConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, c.errorRate, outgoing);
    }

    case 'RATE_LIMITER': {
      const c = config as RateLimiterConfig;
      // Simple rate limiter: pass up to maxRequests per window, drop rest
      const perTickLimit = Math.max(1, Math.floor(c.maxRequests / (c.windowMs / 100)));
      const allowed = newState.queue.splice(0, perTickLimit);
      const dropped = newState.queue.splice(0); // everything else
      for (const r of dropped) {
        r.status = 'DROPPED';
        newState.completed.push(r);
      }
      for (const r of allowed) {
        r.latency += c.baseLatency;
        r.status = 'SUCCESS';
        outgoing.push(r);
      }
      newState.queue = [];
      newState.utilization = perTickLimit > 0 ? allowed.length / perTickLimit : 0;
      newState.throughput = allowed.length;
      return { state: newState, outgoing };
    }

    // --- APIs --------------------------------------------------------------
    case 'REST_API': {
      const c = config as RestApiConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, c.errorRate, outgoing);
    }

    case 'GRAPHQL_API': {
      const c = config as GraphqlApiConfig;
      // GraphQL has higher latency due to query complexity
      const adjustedLatency = c.baseLatency * (1 + c.maxDepth * 0.1);
      return processNodeQueue(newState, newState.queue, c.capacity, adjustedLatency, c.errorRate, outgoing);
    }

    case 'AUTH_SERVICE': {
      const c = config as AuthServiceConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, c.errorRate, outgoing);
    }

    case 'API': {
      const c = config as ApiConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, c.errorRate, outgoing);
    }

    // --- Caching -----------------------------------------------------------
    case 'CACHE':
    case 'REDIS_CACHE': {
      const c = config as CacheConfig;
      const hits: SimRequest[] = [];
      const misses: SimRequest[] = [];
      for (const req of newState.queue) {
        if (Math.random() < c.hitRate) {
          hits.push({ ...req, latency: req.latency + c.baseLatency, status: 'SUCCESS' });
        } else {
          misses.push(req);
        }
      }
      newState.completed = [...newState.completed, ...hits];
      newState.queue = misses;
      // Misses flow downstream
      return processNodeQueue(newState, misses, c.capacity, c.baseLatency, 0, outgoing);
    }

    // --- Storage -----------------------------------------------------------
    case 'DATABASE': {
      const c = config as DatabaseConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, 0, outgoing);
    }

    case 'SQL_DATABASE': {
      const c = config as SqlDatabaseConfig;
      // Connection pool bottleneck
      const effectiveCapacity = Math.min(c.capacity, c.poolSize * 10);
      return processNodeQueue(newState, newState.queue, effectiveCapacity, c.baseLatency, 0, outgoing);
    }

    case 'NOSQL_DATABASE': {
      const c = config as NosqlDatabaseConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, 0, outgoing);
    }

    case 'OBJECT_STORAGE': {
      const c = config as ObjectStorageConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, 0, outgoing);
    }

    // --- Compute -----------------------------------------------------------
    case 'QUEUE': {
      const c = config as QueueConfig;
      if (newState.queue.length > c.maxSize) {
        if (c.dropPolicy === 'DROP_OLDEST') {
          const dropped = newState.queue.splice(0, newState.queue.length - c.maxSize);
          dropped.forEach((r) => (r.status = 'DROPPED'));
          newState.completed = [...newState.completed, ...dropped];
        } else {
          const dropped = newState.queue.splice(c.maxSize);
          dropped.forEach((r) => (r.status = 'DROPPED'));
          newState.completed = [...newState.completed, ...dropped];
        }
      }
      const toDrain = newState.queue.splice(0, Math.min(100, newState.queue.length));
      newState.utilization = newState.queue.length > 0 ? Math.min(1, newState.queue.length / c.maxSize) : 0;
      newState.throughput = toDrain.length;
      return { state: newState, outgoing: toDrain };
    }

    case 'WORKER': {
      const c = config as WorkerConfig;
      const effectiveCapacity = c.capacity * c.concurrency;
      return processNodeQueue(newState, newState.queue, effectiveCapacity, c.baseLatency, 0, outgoing);
    }

    // --- Big Data ----------------------------------------------------------
    case 'STREAM_PROCESSOR': {
      const c = config as StreamProcessorConfig;
      const effectiveCapacity = c.capacity * c.partitions;
      return processNodeQueue(newState, newState.queue, effectiveCapacity, c.baseLatency, 0, outgoing);
    }

    case 'BATCH_PROCESSOR': {
      const c = config as BatchProcessorConfig;
      const ticksPerBatch = Math.max(1, Math.floor(c.scheduleIntervalMs / 100));
      if (tick % ticksPerBatch === 0) {
        const batch = newState.queue.splice(0, c.batchSize);
        for (const req of batch) {
          req.latency += c.baseLatency;
          req.status = 'SUCCESS';
          outgoing.push(req);
        }
        newState.throughput = batch.length;
        newState.utilization = batch.length / c.batchSize;
      } else {
        newState.throughput = 0;
        newState.utilization = 0;
      }
      return { state: newState, outgoing };
    }

    case 'ANALYTICS_SINK': {
      const c = config as AnalyticsSinkConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, 0, outgoing);
    }

    // --- Custom ------------------------------------------------------------
    case 'CUSTOM_LOGIC': {
      const c = config as CustomLogicConfig;
      return processNodeQueue(newState, newState.queue, c.capacity, c.baseLatency, c.errorRate, outgoing);
    }

    default:
      return { state: newState, outgoing };
  }
}
