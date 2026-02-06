# Atlas Learn: AI Context & Instructions

## Project Overview
**Atlas Learn** is an educational system-design laboratory. It allows students to visually build system architectures (using a node-based editor), simulate traffic/load, and view real-time metrics (latency, throughput, error rates) to understand concepts like bottlenecks, caching, and queuing.

**Core Philosophy:** "Cause -> Effect -> Fix". Visualizing trade-offs and building systems intuition.

## Product Modes
1.  **Sandbox Mode:** Free-form building. Drag/drop nodes, connect them, tweak parameters (RPS, capacity), and run simulations.
2.  **Tutorial Mode:** Structured levels with specific goals, constraints, and feedback.
    *   **Level 1: The Bottleneck:** Identify and fix a DB saturation issue.
    *   **Level 2: Caching:** Use caching to handle read-heavy loads.
    *   **Level 3: Bursts & Async:** Use queues and workers to handle traffic spikes.

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** React Context / Zustand (implied for graph state)
*   **Canvas:** Custom SVG/HTML-based canvas (or React Flow if decided later, but currently custom assumption based on "n8n-like" requirements).

## Directory Structure
*   `src/components/canvas`: Visual components for the graph editor (Nodes, Edges, Palette).
*   `src/components/inspector`: Configuration panel for selected nodes.
*   `src/components/sim`: Simulation controls (Run/Pause/Step) and charts.
*   `src/components/tutorial`: UI for instructional overlays, hints, and objectives.
*   `src/core/types`: Shared TypeScript interfaces.
*   `src/core/sim`: The simulation engine logic (discrete time/tick based).
*   `src/core/graph`: Graph operations (add/remove node, cycles, validation).

## Core Data Models
**Node Types:**
*   `Client`: Generates traffic (RPS, bursts).
*   `API`: Processes requests, has capacity and base latency.
*   `Database`: Stores data, limited IOPS/connections.
*   `Cache`: Returns data fast if hit, forwards to source if miss.
*   `Queue`: Buffers requests, processes sequentially.
*   `Worker`: Consumes from queue.
*   _(Stretch): Load Balancer, CDN, Rate Limiter._

**Simulation Engine:**
*   **Tick-based:** The engine advances in discrete "ticks" (e.g., 100ms or 1s steps).
*   **Metrics:** Per-node Throughput, Error Rate, p50/p95 Latency, Queue Depth.

## AI Development Rules
1.  **Strict Typing:** Always use the types defined in `src/core/types`.
2.  **Component Modularity:** Keep components small. Separate logic (simulation engine) from UI (React components).
3.  **Educational Focus:** When implementing features, prioritize clarity and "teachability" over raw performance or complex realism. The simulation should *feel* right and show the intended concepts clearly.
4.  **Aesthetics:** Follow the "System Design Lab" aesthetic: dark mode, clean lines, technical but accessible (inspired by n8n, CircuitLab).

## Context for "AI Tutor" features
When implementing AI tutor logic:
*   Feed it the **simulation result summary**: Bottleneck node ID, max utilization, error reasons.
*   Prompt it to explain **"Why did it fail?"** and **"What is the fix?"**.
*   Do NOT allow generic chat. Keep it grounded in the immediate simulation context.
