# Atlas: Visual Backend Architecture Platform

## Project Overview
**Atlas** is a production-grade visual backend architecture designer, simulator, and code generator. It allows developers to:
1. **Visually build** backend architectures using 20+ node types (load balancers, APIs, databases, caches, queues, workers, stream processors, etc.)
2. **Simulate** traffic through the system in real-time to identify bottlenecks, visualize latency, and test scaling behaviors
3. **Generate real code** — compile the visual architecture to TypeScript + Express + Docker, ready to deploy

**Core Philosophy:** "Design → Simulate → Generate → Deploy". Reduce the gap between architectural diagrams and actual working systems.

## Product Modes
1. **Sandbox Mode:** Free-form designing and simulation
   - Drag/drop nodes from 8 categorized palettes
   - Connect nodes with configurable edges
   - Adjust per-node parameters (capacity, latency, algorithms, etc.) via Inspector
   - Run live simulations with real-time metrics (throughput, utilization, p50/p95 latency)
   - Toggle between Inspector panel and Code Preview panel
   - Export generated backend project

2. **Tutorial Mode:** Structured learning (preserved from original Atlas Learn)
   - Level 1: The Bottleneck — identify and fix DB saturation
   - Level 2: Caching — reduce latency with intelligent caching
   - Level 3: Bursts & Async — handle traffic spikes with queues/workers
   - Guided feedback and hints

3. **Code Generation & Export:**
   - Real-time code preview (tab-based file viewer)
   - Download as bundle (single file with separators) or individual files
   - Includes: service implementations, shared utilities, Docker Compose, package.json, tsconfig, README

## Tech Stack
- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **UI Framework:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand 5.0.11
- **Canvas:** Custom SVG/HTML (no external lib, built from scratch)
- **Code Generation:** Custom IR compiler + code generator (produces real TypeScript/Express/BullMQ/Redis/Kafka code)

## Directory Structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (Atlas branding)
│   ├── layout.tsx            # Root layout with metadata
│   ├── globals.css           # Global styles
│   ├── sandbox/              # Sandbox mode page
│   │   └── page.tsx          # Main builder + simulator interface
│   └── tutorial/             # Tutorial mode pages
│       └── page.tsx          # Tutorial shell
├── components/
│   ├── canvas/               # Visual editor components
│   │   ├── Canvas.tsx        # Main canvas (pan, zoom, snap-to-grid)
│   │   ├── NodeRenderer.tsx  # Renders individual nodes
│   │   ├── EdgeRenderer.tsx  # Renders edges/connections
│   │   └── NodePalette.tsx   # Left sidebar with categorized node types
│   ├── inspector/            # Configuration panel
│   │   └── InspectorPanel.tsx # Per-node config forms (20+ node types)
│   ├── sim/                  # Simulation UI
│   │   ├── RunControls.tsx   # Play/pause/step/reset buttons
│   │   └── MetricsPanel.tsx  # Bottom metrics display
│   ├── generator/            # Code generation UI
│   │   ├── CodePreview.tsx   # File tree + syntax viewer
│   │   └── ExportDialog.tsx  # Export modal (download options)
│   └── tutorial/             # Tutorial UI
│       └── TutorialShell.tsx # Tutorial overlay & feedback
├── core/
│   ├── types/
│   │   └── index.ts          # All TypeScript interfaces (20 node types, configs, visuals)
│   ├── nodes/
│   │   └── registry.ts       # Node definitions: descriptions, codegen packages, slugs
│   ├── graph/
│   │   └── graphStore.ts     # Zustand store (nodes, edges, selection, actions)
│   ├── sim/
│   │   ├── engine.ts         # Tick-based simulation orchestrator
│   │   ├── models.ts         # Per-node tick behaviors (processNode function)
│   │   └── metrics.ts        # Metrics calculation and aggregation
│   ├── generator/            # NEW: Code generation system
│   │   ├── ir.ts             # Intermediate representation compiler (graph → IR)
│   │   └── codegen.ts        # Code generator (IR → TypeScript files)
│   └── tutorial/
│       ├── levels.ts         # Tutorial level definitions
│       └── evaluator.ts      # Level success/failure logic
└── public/                   # Static assets
```

## Core Data Models & Architecture

### Node Types (20 total across 8 categories)

#### Traffic Category
- **CLIENT**: Generates inbound traffic (RPS, burst multiplier)
  - Not a backend service; represents external traffic sources
  - Filtered out during IR compilation

#### Networking Category
- **LOAD_BALANCER**: Routes traffic to downstream services
  - Algorithms: ROUND_ROBIN, LEAST_CONNECTIONS, RANDOM, IP_HASH
  - Capacity, base latency, health check interval
- **API_GATEWAY**: Entry point with auth, rate limiting, CORS
  - Auth enabled/disabled, rate limiting toggle, CORS toggle
  - Error rate simulation
- **RATE_LIMITER**: Throttles traffic (token bucket pattern)
  - Max requests, window size, capacity

#### APIs Category
- **REST_API**: HTTP endpoints (GET/POST/PUT/DELETE/PATCH)
  - Path, method, capacity, base latency, error rate
- **GRAPHQL_API**: GraphQL server with depth/complexity limits
  - Max depth, max complexity, capacity, base latency, error rate
- **AUTH_SERVICE**: JWT or OAuth2 token issuance/verification
  - Algorithm choice, token TTL, capacity, base latency
- **API** (legacy): Generic API node for backward compatibility

#### Caching Category
- **CACHE** (legacy): In-memory cache (hit rate, TTL)
- **REDIS_CACHE**: Redis-like distributed cache
  - Base latency, max memory, eviction policy (LRU/LFU/RANDOM/TTL)
  - Hit rate, TTL, capacity

#### Storage Category
- **SQL_DATABASE**: Relational database (PostgreSQL/MySQL/SQLite)
  - Pool size, max connections, capacity, base latency
  - Engine choice
- **NOSQL_DATABASE**: Document/KV store (MongoDB/DynamoDB/Cassandra)
  - Replica count, max connections, capacity, base latency
  - Engine choice
- **OBJECT_STORAGE**: S3-like blob storage
  - Max object size, region, capacity, base latency

#### Compute Category
- **WORKER**: Async job processor (consumes from queue)
  - Concurrency, capacity, processing time
- **BATCH_PROCESSOR**: Cron-like scheduled batch processor
  - Batch size, schedule interval, capacity, processing time
- **STREAM_PROCESSOR**: Event stream consumer (Kafka-like)
  - Partitions, consumer group, capacity, base latency

#### Big Data Category
- **ANALYTICS_SINK**: Buffered analytics/logging destination
  - Flush interval, buffer size, capacity
- **QUEUE**: Message queue (buffers requests)
  - Max size, drop policy (REJECT_NEW or DROP_OLDEST)

#### Custom Category
- **CUSTOM_LOGIC**: Placeholder for user-defined logic
  - Code buffer, capacity, latency, error rate

### Type System (src/core/types/index.ts)

**Key Interfaces:**
```typescript
type NodeType = 'CLIENT' | 'LOAD_BALANCER' | 'API_GATEWAY' | ... (20 total union)
type NodeCategory = 'Traffic' | 'Networking' | 'APIs' | 'Caching' | 'Storage' | 'Compute' | 'Big Data' | 'Custom'

// Per-type config interfaces (ClientConfig, LoadBalancerConfig, ApiGatewayConfig, etc.)
// Each has RPS/capacity/latency/algorithm/engine-specific fields

type AnyNodeConfig = ClientConfig | LoadBalancerConfig | ApiGatewayConfig | ... (union of all)

interface NodeData {
  id: string
  type: NodeType
  label: string
  position: Position
  config: AnyNodeConfig
}

interface EdgeData {
  sourceId: string
  targetId: string
  protocol?: 'http' | 'queue' | 'stream' | 'direct'  // inferred during IR compilation
}

interface NodeVisual {
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
}

// Registry of visuals per NodeType
const NODE_VISUALS: Record<NodeType, NodeVisual>
```

### Graph State Management (src/core/graph/graphStore.ts)

**Zustand Store:**
```typescript
interface GraphState {
  nodes: NodeData[]
  edges: EdgeData[]
  selectedNodeId: string | null
  
  // Actions
  addNode(type: NodeType, position: Position): NodeData
  removeNode(id: string): void
  updateNodePosition(id: string, position: Position): void
  updateNodeConfig(id: string, config: Partial<AnyNodeConfig>): void
  selectNode(id: string): void
  
  addEdge(sourceId: string, targetId: string): EdgeData | null
  removeEdge(sourceId: string, targetId: string): void
}
```

### Simulation System (src/core/sim/)

**Tick-based Discrete Event Simulator:**

1. **Engine** (engine.ts):
   - Maintains graph state + node states (queue depth, utilization, etc.)
   - Advances time in 100ms ticks (configurable)
   - Calls `processNode()` for each node per tick
   - Calculates metrics at each step
   - Returns `SimulationSnapshot` with tick, metrics, node metrics

2. **Models** (models.ts):
   - `processNode(node, incomingLoad, dependencies)` — deterministic per-node behavior
   - CLIENT: generates fixed RPS + probabilistic bursts
   - LOAD_BALANCER: passthrough (uses algorithm to distribute)
   - API_GATEWAY: adds base latency + error rate + rate limiting
   - RATE_LIMITER: drops excess traffic
   - CACHE/REDIS_CACHE: hit/miss split based on hitRate param
   - SQL_DATABASE: pool bottleneck (connections)
   - NOSQL_DATABASE: replication factor affects latency
   - QUEUE: drop or queue based on capacity (maxSize)
   - WORKER: multiplies capacity based on concurrency
   - STREAM_PROCESSOR: partitions split load
   - BATCH_PROCESSOR: interval-based processing (batches)
   - ANALYTICS_SINK: buffered flush
   - CUSTOM_LOGIC: template behavior

3. **Metrics** (metrics.ts):
   - Per-tick per-node: throughput, utilization, latency (p50/p95/p99)
   - System-wide: error rate, queue depths, cache hit rate

**Key Behaviors:**
- Upstream nodes fill downstream capacity; excess is either dropped or queued
- Latency compounds through the chain + queue wait times
- Cache hits reduce latency; misses forward to source
- Error rates propagate through the chain
- Utilization = (demand / capacity) — shows if bottlenecked

### Code Generation System (src/core/generator/)

**NEW: Three-layer compilation pipeline**

1. **Intermediate Representation Compiler** (ir.ts):
   - Input: `GraphState` (nodes + edges)
   - Output: `IR` (architecture as services + connections)
   - Process:
     - Filter out CLIENT nodes (traffic sources, not services)
     - Assign ports (3000, 3001, 3002, ... starting from CLIENT's target)
     - Infer protocol per edge (http/queue/stream/direct based on node types)
     - Build upstreams/downstreams for each service
     - Collect all npm packages needed

2. **Code Generator** (codegen.ts):
   - Input: `IR`
   - Output: `GeneratedFile[]` — full TypeScript project
   - Files produced:
     - `package.json` — with all dependencies (express, pg, mongoose, ioredis, bullmq, kafkajs, aws-sdk, etc.)
     - `tsconfig.json` — strict mode
     - `src/shared/types.ts` — shared request/response types
     - `src/shared/logger.ts` — structured logging
     - `src/services/<ServiceName>/index.ts` — per-service implementation
     - `src/index.ts` — entry point (starts all services)
     - `docker-compose.yml` — dev environment (PostgreSQL, MongoDB, Redis, Kafka, localstack, etc.)
     - `README.md` — setup and deployment instructions
   
   - Per-service generators:
     - `genLoadBalancer()` — round-robin/least-conn/random/IP-hash proxy server
     - `genApiGateway()` — Express with cors/rate-limit/auth middleware
     - `genRateLimiter()` — rate-limit middleware
     - `genRestApi()` — Express routes, calls downstreams
     - `genGraphqlApi()` — Apollo Server with resolvers
     - `genAuthService()` — JWT/OAuth2 token server
     - `genCacheService()` — ioredis or node-cache abstraction
     - `genSqlDatabase()` — pg Pool wrapper with mock queries
     - `genNosqlDatabase()` — MongoDB client with mock collections
     - `genObjectStorage()` — S3 SDK wrapper
     - `genQueue()` — BullMQ Queue creation
     - `genWorker()` — BullMQ Worker with concurrency
     - `genStreamProcessor()` — KafkaJS consumer
     - `genBatchProcessor()` — node-cron scheduler
     - `genAnalyticsSink()` — buffered event flusher
     - `genCustomLogic()` — template with TODO comments

**Code Quality:**
- Full TypeScript, strict mode
- Proper error handling and logging
- Environment variables for config (ports, connection strings, etc.)
- Docker Compose for local dev (PostgreSQL, MongoDB, Redis, Kafka, LocalStack)
- Production-ready patterns (connection pooling, graceful shutdown, etc.)

## Canvas & UI

### Canvas (Canvas.tsx)
- **Pan**: Middle-mouse-click-and-drag or background drag to move viewport
- **Zoom**: Scroll wheel (25% to 200%), buttons in bottom-right corner
- **Snap-to-Grid**: 40px grid, nodes snap when placed
- **Drag-and-Drop**: Drag nodes from palette onto canvas
- **Node Selection**: Click node to select (shows in Inspector)
- **Edge Creation**: Drag from node port to another node port (visual feedback TBD or implicit)
- **Visualization**: Real-time metrics (utilization color gradient on nodes during simulation)

### Node Palette (NodePalette.tsx)
- **8 Collapsible Categories**: Traffic, Networking, APIs, Caching, Storage, Compute, Big Data, Custom
- **Drag-to-Canvas**: Drag node type onto canvas to instantiate
- **Default Open**: Traffic, Networking, APIs (others collapsed for space)
- **Visual Icons**: Per-node icons from `NODE_VISUALS`

### Inspector Panel (InspectorPanel.tsx)
- **20 Config Forms**: One form per node type
- **Controls**:
  - Sliders: Capacity, latency, concurrency, RPS, etc. (with units: RPS, ms, MB, s)
  - Toggles: Auth enabled, rate limiting, CORS, etc.
  - Selects: Algorithm (ROUND_ROBIN/LEAST_CONNECTIONS/RANDOM/IP_HASH), engine (POSTGRES/MYSQL/MONGODB/DYNAMODB), etc.
  - Text inputs: Path, region, consumer group, custom code
  - Textarea: Custom logic code editor
- **Delete Button**: Remove selected node
- **Node Info**: Shows icon, label, and node ID

### Code Preview (CodePreview.tsx)
- **File Tree**: Left sidebar with collapsible directories (shared/, services/<Name>/, root files)
- **Code View**: Right side with syntax highlighting (light monospace font on dark bg)
- **File Tabs**: Click files to view them
- **Copy Button**: Copy current file to clipboard
- **Project Name Input**: Editable, regenerates code on change
- **File Count**: Shows total files generated
- **Graceful Fallback**: Explains if no code can be generated (no service nodes)

### Export Dialog (ExportDialog.tsx)
- **Modal**: Centered dialog with project name input
- **Export Options**:
  - "Download Bundle": Single .txt file with all files separated by headers (easy to manually split)
  - "Download Files": Individual .txt files (with path separators converted to underscores) + setup shell script
- **Summary**: Shows file count, total lines of code, included components
- **Status**: Shows "Exporting..." during download
- **Validation**: Disables buttons if no service nodes exist

## Simulation Metrics

**Per-Node Metrics (per tick):**
- **Throughput**: Requests processed per tick
- **Utilization**: (Demand / Capacity) * 100, shown as % and used for visualization
- **Latency**: p50, p95, p99 in milliseconds
- **Queue Depth**: For queues specifically
- **Error Rate**: % of requests that failed

**System Metrics (aggregated):**
- **Total Throughput**: Sum of all node throughputs
- **Peak Latency**: Max p99 across all nodes
- **Error Rate**: % of all requests that failed
- **Queue Depths**: Depth of each queue node

**Simulation State:**
- **Tick Count**: Current simulation step (incremented per 100ms real time or on manual step)
- **Running/Paused/Stopped**: Simulation state
- **Wall-clock Time**: Total elapsed wall-clock time (e.g., 10 ticks = 1 second simulated time)

## Files: Updated & Created

### UPDATED FILES
1. **src/core/types/index.ts** — Complete rewrite (20 node types, 8 categories, 15+ config interfaces, AnyNodeConfig union, NODE_VISUALS, DEFAULT_CONFIGS)
2. **src/core/sim/models.ts** — Updated processNode() for all 20 types
3. **src/core/sim/engine.ts** — Bug fix (tickInterval parameter reference)
4. **src/core/graph/graphStore.ts** — Import AnyNodeConfig, type cast in updateNodeConfig
5. **src/components/canvas/Canvas.tsx** — Complete rewrite (pan, zoom, snap-to-grid)
6. **src/components/canvas/NodePalette.tsx** — Complete rewrite (8 collapsible categories)
7. **src/components/canvas/NodeRenderer.tsx** — Updated to use NODE_VISUALS
8. **src/components/inspector/InspectorPanel.tsx** — Complete rewrite (20 config forms)
9. **src/app/sandbox/page.tsx** — Wired CodePreview + ExportDialog, panel toggle, export button
10. **src/app/page.tsx** — Rebranded from "Atlas Learn" to "Atlas"
11. **src/app/layout.tsx** — Updated metadata title and description

### NEW FILES
1. **src/core/nodes/registry.ts** — Node definitions, descriptions, codegen packages
2. **src/core/generator/ir.ts** — IR types and compileGraphToIR() function
3. **src/core/generator/codegen.ts** — Full code generator (~700 lines)
4. **src/components/generator/CodePreview.tsx** — Code viewer with file tree
5. **src/components/generator/ExportDialog.tsx** — Export modal

### UNCHANGED FILES (Backward Compat Maintained)
- src/components/canvas/EdgeRenderer.tsx
- src/components/sim/MetricsPanel.tsx
- src/components/sim/RunControls.tsx
- src/components/tutorial/TutorialShell.tsx
- src/core/sim/metrics.ts
- src/core/tutorial/levels.ts (uses legacy types CLIENT, API, DATABASE, CACHE, QUEUE, WORKER — all preserved)
- src/core/tutorial/evaluator.ts
- src/app/tutorial/page.tsx

## AI Development Rules

1. **Strict Typing**: 
   - Always use types from `src/core/types/index.ts`
   - Use `AnyNodeConfig` for generic node config handling
   - Cast config to specific type when needed: `(config as RestApiConfig).path`

2. **Graph State Management**:
   - Use `useGraphStore()` from `src/core/graph/graphStore.ts` for all graph mutations
   - Actions: `addNode`, `removeNode`, `updateNodePosition`, `updateNodeConfig`, `addEdge`, `removeEdge`, `selectNode`

3. **Code Generation Context**:
   - Understanding the IR layer: Graph → IR (services + connections) → Code
   - Node filtering: CLIENT nodes are traffic sources, not backend services
   - Protocol inference: REST_API/GRAPHQL_API/AUTH_SERVICE → http, QUEUE/STREAM_PROCESSOR → queue/stream, direct calls → direct
   - Package dependencies: Each node type maps to specific npm packages via CODEGEN_PACKAGES map
   - Port assignment: Services get sequential ports starting from 3000
   - Environment variables: Generated code uses .env for all config (ports, DB connection strings, etc.)

4. **Simulation Engine**:
   - Input: GraphState (nodes + edges)
   - Output: SimulationSnapshot (tick, metrics, nodeMetrics)
   - Tick-based: Each step advances 100ms (configurable)
   - Node processing: `processNode(node, incomingLoad, deps)` returns (outgoing, errors, queued)
   - Metrics are calculated per-node per-tick (throughput, utilization, latency)

5. **UI/UX**:
   - Canvas: Custom SVG/HTML, no external library (React Flow, etc.)
   - Controls: Dark mode (slate-900/950), gradients (blue/purple), technical aesthetic
   - Feedback: Real-time metrics on nodes, live code preview, error highlighting in simulation
   - Accessibility: Keyboard shortcuts (delete, space to play/pause, arrow keys to pan)

6. **Testing & Validation**:
   - TypeScript strict mode enabled (no `any`)
   - Build verification: `next build` must pass with zero errors
   - Component isolation: Test individual forms/panels in the Inspector by toggling node selection
   - Simulation realism: Behaviors should align with real systems (pool bottlenecks, cache hits, queue buildup, latency compounds)

7. **Component Patterns**:
   - **'use client'**: Mark interactive components with 'use client'
   - **Hooks**: Use React hooks (useState, useCallback, useMemo, useEffect) appropriately
   - **Memoization**: Memoize expensive calculations (IR generation, code generation)
   - **Event Handlers**: Use useCallback for event handlers to avoid re-renders
   - **Conditional Rendering**: Use ternary/&&/|| for clean JSX

8. **Code Style**:
   - Use TailwindCSS utilities for all styling (no CSS files)
   - Follow existing naming conventions (camelCase for variables, PascalCase for components)
   - Add comments for non-obvious logic (especially in generator and simulator)
   - Keep functions <100 lines when possible; break complex logic into helper functions

9. **Error Handling**:
   - Simulation should gracefully handle malformed graphs (isolated nodes, cycles, orphans)
   - Code generation should catch errors and show user a message (not throw)
   - Canvas should validate node placement (no overlaps, snap-to-grid)
   - Inspector should validate config values (min/max sliders, no negative values)

10. **Performance**:
    - Canvas rendering: Use React.memo for node/edge components if needed
    - Simulation: Run in ~100ms tick interval (not real-time); can be toggled by user
    - Code generation: Memoize IR/generated code to avoid regeneration unnecessarily
    - Zustand store: Only re-render components that depend on changed state (atoms)

## Export & Deployment Flow

1. **User designs graph** in Sandbox
2. **User toggles to Code panel** to preview generated TypeScript/Express project
3. **User clicks Export** to open export dialog
4. **User chooses**:
   - Download Bundle: Single .txt with all files and separators
   - Download Files: Individual files (with path-as-filename) + setup.sh helper script
5. **User downloads** generated files
6. **User `npm install`** and `docker-compose up -d` for local dev
7. **User `npm run dev`** to start the backend
8. **User deploys** to production (Heroku, AWS, GCP, etc.)

**Generated Project Structure:**
```
my-backend/
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── README.md
├── .env.example
├── src/
│   ├── index.ts                  # Main entry
│   ├── shared/
│   │   ├── types.ts              # Shared request/response types
│   │   └── logger.ts             # Structured logging
│   └── services/
│       ├── LoadBalancer/
│       │   ├── index.ts
│       │   └── routes.ts
│       ├── ApiGateway/
│       │   ├── index.ts
│       │   ├── middleware.ts
│       │   └── routes.ts
│       ├── RestAPI/
│       ├── AuthService/
│       ├── PostgresDB/
│       ├── RedisCache/
│       ├── BullQueue/
│       ├── QueueWorker/
│       ├── KafkaProcessor/
│       ├── BatchProcessor/
│       └── [all other services]
└── dist/ (build output)
```

## Known Limitations & Future Work

**Current Scope (MVP):**
- Single user, no auth, no persistence
- No database schema generation (templates only)
- No Kubernetes manifests (Docker Compose only)
- No service mesh (Istio, Linkerd)
- Simulation is deterministic and simplified (not microsecond-accurate)

**Future Enhancements:**
- **Database schema inference** from data flow
- **OpenAPI/GraphQL schema generation** from API nodes
- **Terraform/Pulumi code generation** for cloud deployment
- **Multi-service debugging UI** (distributed tracing view)
- **Collaborative editing** (real-time multiplayer)
- **CI/CD integration** (GitHub Actions, GitLab CI templates)
- **Performance profiling** (realistic latency distributions, packet loss simulation)
- **Cost estimation** (cloud provider pricing integration)

## Summary

Atlas transforms visual architecture design into deployable code. The pipeline is:

1. **Drag & Drop** nodes on canvas (20 types across 8 categories)
2. **Configure** each node in the Inspector (capacity, algorithm, engine, etc.)
3. **Connect** nodes with edges (implicit protocols)
4. **Simulate** to validate design (real-time metrics, bottleneck visualization)
5. **Preview** generated code in the Code panel (live TypeScript/Express project)
6. **Export** the full project (download, setup, deploy)

**Key Architectural Decisions:**
- IR layer separates graph semantics from code generation (allows future targets: Go, Rust, Python)
- Deterministic simulation avoids randomness bugs, teaches causality
- Code generation is production-grade (logging, error handling, pooling, graceful shutdown)
- Preserved tutorial backward compatibility (legacy node types still work)
- Zustand for lightweight graph state (no Redux overhead)
- Custom canvas (no React Flow) for full control over interactions and visuals

