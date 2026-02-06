// =============================================================================
// Atlas Learn - Tutorial Level Definitions
// =============================================================================

import { TutorialLevel, GraphState, NodeData, EdgeData } from '@/core/types';

// -----------------------------------------------------------------------------
// Helper: Create Node
// -----------------------------------------------------------------------------

function createNode(
  id: string,
  type: NodeData['type'],
  x: number,
  y: number,
  label: string,
  config: NodeData['config']
): NodeData {
  return { id, type, position: { x, y }, label, config };
}

function createEdge(id: string, sourceId: string, targetId: string): EdgeData {
  return { id, sourceId, targetId };
}

// -----------------------------------------------------------------------------
// Level 1: The Bottleneck
// -----------------------------------------------------------------------------

const level1Graph: GraphState = {
  nodes: [
    createNode('client1', 'CLIENT', 150, 200, 'Users', { rps: 150, burstMultiplier: 1 }),
    createNode('api1', 'API', 400, 200, 'API Server', { capacity: 200, baseLatency: 10, errorRate: 0.01 }),
    createNode('db1', 'DATABASE', 650, 200, 'Database', { capacity: 80, baseLatency: 50, maxConnections: 50 }),
  ],
  edges: [
    createEdge('e1', 'client1', 'api1'),
    createEdge('e2', 'api1', 'db1'),
  ],
  selectedNodeId: null,
};

const level1: TutorialLevel = {
  id: 'level-1-bottleneck',
  title: 'The Bottleneck',
  description: 'Your app slows down during peak hours. Find and fix the bottleneck.',
  scenario: `Your startup launched and users are flooding in! But customers are complaining about slow response times.

The current architecture is simple: Client → API → Database

Your database can only handle 80 requests per second, but your API is receiving 150 RPS from users.

**Your Goal:** Reduce p95 latency below 300ms at 150 RPS.`,
  starterGraph: level1Graph,
  objectives: [
    { metric: 'p95', operator: '<', value: 300 },
    { metric: 'errorRate', operator: '<', value: 0.05 },
  ],
  hints: [
    'Look at the Database node. Is it overwhelmed?',
    'Try adding a Cache between the API and Database',
    'Alternatively, you could increase the Database capacity',
  ],
  explanation: `**What you learned:**

When a node receives more requests than it can process, a queue builds up. This queue adds latency to every request.

**Key concept: Little's Law**
Queue Length = Arrival Rate × Wait Time

When utilization approaches 100%, queue times grow exponentially. This is why your p95 latency spiked.

**Solutions:**
1. **Add a Cache** - Reduces load on the database by serving repeated queries from memory
2. **Scale the Database** - More capacity = lower utilization = shorter queues
3. **Add a Queue + Workers** - Decouple the API from slow database operations`,
};

// -----------------------------------------------------------------------------
// Level 2: Cache (and its limits)
// -----------------------------------------------------------------------------

const level2Graph: GraphState = {
  nodes: [
    createNode('client1', 'CLIENT', 150, 200, 'Users', { rps: 300, burstMultiplier: 1 }),
    createNode('api1', 'API', 400, 200, 'API Server', { capacity: 400, baseLatency: 10, errorRate: 0.01 }),
    createNode('db1', 'DATABASE', 650, 200, 'Database', { capacity: 100, baseLatency: 50, maxConnections: 50 }),
  ],
  edges: [
    createEdge('e1', 'client1', 'api1'),
    createEdge('e2', 'api1', 'db1'),
  ],
  selectedNodeId: null,
};

const level2: TutorialLevel = {
  id: 'level-2-cache',
  title: 'Cache Saves You (Sometimes)',
  description: 'Use caching to handle a read-heavy workload.',
  scenario: `Your product is growing! Traffic increased to 300 RPS.

Most requests are reads (product listings, user profiles). These are perfect candidates for caching.

**Your Goal:** Support 300 RPS with p95 latency under 200ms.`,
  starterGraph: level2Graph,
  objectives: [
    { metric: 'p95', operator: '<', value: 200 },
    { metric: 'throughput', operator: '>', value: 250 },
  ],
  hints: [
    'Add a Cache node between API and Database',
    'Increase the cache hit rate for better performance',
    'A hit rate of 80%+ can dramatically reduce DB load',
  ],
  explanation: `**What you learned:**

Caching is one of the most powerful tools for scaling read-heavy workloads.

**Key metrics:**
- **Hit Rate**: % of requests served from cache
- **Miss Penalty**: Extra latency when cache misses

**Diminishing Returns:**
Going from 0% → 80% hit rate = 5x reduction in DB load
Going from 80% → 90% hit rate = 2x reduction
Going from 90% → 95% hit rate = 2x reduction

**Watch out for:**
- Cache invalidation (stale data)
- Write-heavy workloads (cache doesn't help writes)
- Cold start (empty cache on restart)`,
};

// -----------------------------------------------------------------------------
// Level 3: Bursts & Async
// -----------------------------------------------------------------------------

const level3Graph: GraphState = {
  nodes: [
    createNode('client1', 'CLIENT', 150, 200, 'Users', { rps: 100, burstMultiplier: 3 }),
    createNode('api1', 'API', 400, 200, 'API Server', { capacity: 200, baseLatency: 10, errorRate: 0.01 }),
    createNode('db1', 'DATABASE', 650, 200, 'Database', { capacity: 100, baseLatency: 100, maxConnections: 50 }),
  ],
  edges: [
    createEdge('e1', 'client1', 'api1'),
    createEdge('e2', 'api1', 'db1'),
  ],
  selectedNodeId: null,
};

const level3: TutorialLevel = {
  id: 'level-3-async',
  title: 'Bursts & Async Processing',
  description: 'Handle traffic spikes without dropping requests.',
  scenario: `You just launched a marketing campaign. Traffic is spiking 3x normal!

Your current synchronous architecture can't handle the burst. Users are seeing errors.

**Your Goal:** Keep API p95 latency under 200ms and error rate below 1% during the spike.`,
  starterGraph: level3Graph,
  objectives: [
    { metric: 'p95', operator: '<', value: 200 },
    { metric: 'errorRate', operator: '<', value: 0.01 },
  ],
  hints: [
    'Add a Queue after the API to buffer requests',
    'Add Workers to process queued requests',
    'The API can respond quickly while workers handle the slow DB operations',
  ],
  explanation: `**What you learned:**

Asynchronous processing decouples fast components from slow ones.

**Pattern: API → Queue → Workers → Database**

**Benefits:**
1. **API responds fast** - Just enqueues work and returns
2. **Absorbs bursts** - Queue buffers traffic spikes
3. **Backpressure** - Workers process at their own pace

**Key tradeoffs:**
- **Latency**: End-to-end latency increases (queue wait time)
- **Complexity**: Need to handle async responses (webhooks, polling)
- **Ordering**: Requests may complete out of order

**Queue sizing:**
- Too small = drops during bursts
- Too large = stale requests, high memory`,
};

// -----------------------------------------------------------------------------
// Export All Levels
// -----------------------------------------------------------------------------

export const TUTORIAL_LEVELS: TutorialLevel[] = [level1, level2, level3];

export function getLevel(id: string): TutorialLevel | undefined {
  return TUTORIAL_LEVELS.find((l) => l.id === id);
}
