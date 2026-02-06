// =============================================================================
// Atlas Learn - Node Behavior Models
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
// Node Behavior Functions
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

// Process requests through a node for one tick
export function processNode(
  node: NodeData,
  state: NodeState,
  incomingRequests: SimRequest[],
  tick: number
): { state: NodeState; outgoing: SimRequest[] } {
  const newState = { ...state };
  const outgoing: SimRequest[] = [];

  // Add incoming requests to queue
  newState.queue = [...state.queue, ...incomingRequests];

  // Get node config
  const config = node.config;
  let capacity = 0;
  let baseLatency = 0;
  let errorRate = 0;

  switch (node.type as NodeType) {
    case 'CLIENT':
      // Clients generate requests, don't process them
      return { state: newState, outgoing: generateClientRequests(config as ClientConfig, tick) };

    case 'API':
      capacity = (config as ApiConfig).capacity;
      baseLatency = (config as ApiConfig).baseLatency;
      errorRate = (config as ApiConfig).errorRate;
      break;

    case 'DATABASE':
      capacity = (config as DatabaseConfig).capacity;
      baseLatency = (config as DatabaseConfig).baseLatency;
      break;

    case 'CACHE': {
      const cacheConfig = config as CacheConfig;
      capacity = cacheConfig.capacity;
      baseLatency = cacheConfig.baseLatency;
      // Cache hit: return immediately; miss: forward to next node
      const hits: SimRequest[] = [];
      const misses: SimRequest[] = [];
      for (const req of newState.queue) {
        if (Math.random() < cacheConfig.hitRate) {
          hits.push({ ...req, latency: req.latency + baseLatency, status: 'SUCCESS' });
        } else {
          misses.push(req);
        }
      }
      newState.completed = [...newState.completed, ...hits];
      newState.queue = misses;
      // Misses go to next node
      return processNodeQueue(newState, misses, capacity, baseLatency, errorRate, outgoing);
    }

    case 'QUEUE': {
      const queueConfig = config as QueueConfig;
      // Queue just buffers, doesn't process
      if (newState.queue.length > queueConfig.maxSize) {
        if (queueConfig.dropPolicy === 'DROP_OLDEST') {
          const dropped = newState.queue.splice(0, newState.queue.length - queueConfig.maxSize);
          dropped.forEach((r) => (r.status = 'DROPPED'));
          newState.completed = [...newState.completed, ...dropped];
        } else {
          const dropped = newState.queue.splice(queueConfig.maxSize);
          dropped.forEach((r) => (r.status = 'DROPPED'));
          newState.completed = [...newState.completed, ...dropped];
        }
      }
      // Pass all queued to next node
      const toPass = newState.queue.splice(0, Math.min(100, newState.queue.length)); // Drain up to 100 per tick
      return { state: newState, outgoing: toPass };
    }

    case 'WORKER': {
      const workerConfig = config as WorkerConfig;
      capacity = workerConfig.capacity * workerConfig.concurrency;
      baseLatency = workerConfig.baseLatency;
      break;
    }
  }

  return processNodeQueue(newState, newState.queue, capacity, baseLatency, errorRate, outgoing);
}

// Helper: Process queue with capacity limit
function processNodeQueue(
  state: NodeState,
  queue: SimRequest[],
  capacity: number,
  baseLatency: number,
  errorRate: number,
  outgoing: SimRequest[]
): { state: NodeState; outgoing: SimRequest[] } {
  const newState = { ...state };
  const toProcess = Math.min(queue.length, capacity);
  const processed = queue.splice(0, toProcess);
  const remaining = queue;

  for (const req of processed) {
    req.latency += baseLatency;
    
    // Add queueing delay based on utilization
    const queueDelay = (remaining.length / capacity) * baseLatency;
    req.latency += queueDelay;

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
  newState.utilization = queue.length > 0 ? Math.min(1, queue.length / capacity) : toProcess / capacity;
  newState.throughput = toProcess;

  return { state: newState, outgoing };
}

// Generate requests from client node
function generateClientRequests(config: ClientConfig, tick: number): SimRequest[] {
  const requests: SimRequest[] = [];
  const rps = config.rps * config.burstMultiplier;
  
  // Generate requests for this tick (assuming 1 tick = 100ms = 0.1s)
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
