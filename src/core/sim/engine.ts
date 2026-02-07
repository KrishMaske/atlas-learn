// =============================================================================
// Atlas Learn - Simulation Engine
// =============================================================================

import { NodeData, EdgeData, GraphState } from '@/core/types';
import { SimRequest, NodeState, createInitialNodeState, processNode } from './models';
import { Metrics, calculateMetrics, RollingMetrics } from './metrics';

// -----------------------------------------------------------------------------
// Simulation Engine State
// -----------------------------------------------------------------------------

export interface SimulationSnapshot {
  tick: number;
  nodeStates: Map<string, NodeState>;
  metrics: Metrics;
  nodeMetrics: Map<string, { utilization: number; throughput: number; queueDepth: number }>;
}

// -----------------------------------------------------------------------------
// Simulation Engine
// -----------------------------------------------------------------------------

export class SimulationEngine {
  private graph: GraphState;
  private tick: number = 0;
  private nodeStates: Map<string, NodeState> = new Map();
  private allCompletedRequests: SimRequest[] = [];
  private rollingMetrics: RollingMetrics;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate: ((snapshot: SimulationSnapshot) => void) | null = null;

  constructor(graph: GraphState) {
    this.graph = graph;
    this.rollingMetrics = new RollingMetrics(100);
    this.initializeNodeStates();
  }

  private initializeNodeStates() {
    this.nodeStates.clear();
    for (const node of this.graph.nodes) {
      this.nodeStates.set(node.id, createInitialNodeState());
    }
  }

  // -------------------------------------------------------------------------
  // Graph Topology Helpers
  // -------------------------------------------------------------------------

  private getOutgoingEdges(nodeId: string): EdgeData[] {
    return this.graph.edges.filter((e) => e.sourceId === nodeId);
  }

  private getIncomingEdges(nodeId: string): EdgeData[] {
    return this.graph.edges.filter((e) => e.targetId === nodeId);
  }

  private getClientNodes(): NodeData[] {
    return this.graph.nodes.filter((n) => n.type === 'CLIENT');
  }

  private getNode(id: string): NodeData | undefined {
    return this.graph.nodes.find((n) => n.id === id);
  }

  // -------------------------------------------------------------------------
  // Simulation Step
  // -------------------------------------------------------------------------

  step(): SimulationSnapshot {
    this.tick++;

    // Track requests flowing between nodes
    const nodeIncoming: Map<string, SimRequest[]> = new Map();
    for (const node of this.graph.nodes) {
      nodeIncoming.set(node.id, []);
    }

    // Process each node
    for (const node of this.graph.nodes) {
      const state = this.nodeStates.get(node.id) || createInitialNodeState();
      const incoming = nodeIncoming.get(node.id) || [];

      const { state: newState, outgoing } = processNode(node, state, incoming, this.tick);

      this.nodeStates.set(node.id, newState);

      // Route outgoing requests to connected nodes
      const edges = this.getOutgoingEdges(node.id); // Get all outgoing edges

      if (outgoing.length > 0) {
        if (edges.length > 0) {
          
          // Generalized Routing: Default to Round Robin for ALL multi-edge nodes
          // unless specific logic dictates otherwise (e.g., specific broadcast types).
          // For now, we apply Single-Target Round Robin to everything to avoid "duplication".

          let rrIndex = newState.roundRobinIdx || 0;
          
          for (const req of outgoing) {
             // Pick ONE edge based on index
             const edge = edges[rrIndex % edges.length];
             const targetId = edge.targetId;
             const targetIncoming = nodeIncoming.get(targetId) || [];
             
             // Move the request (no cloning needed for single path, but keeping object distinctive is good)
             targetIncoming.push({ ...req }); 
             nodeIncoming.set(targetId, targetIncoming);
             
             rrIndex++;
          }
          
          // Update state with new RR index
          newState.roundRobinIdx = rrIndex;
          this.nodeStates.set(node.id, newState);

        } else {
          // No outgoing edge = request completed
          for (const req of outgoing) {
            req.status = 'SUCCESS';
            this.allCompletedRequests.push(req);
            this.rollingMetrics.addRequest(req);
          }
        }
      }

      // Collect completed requests from node state
      for (const req of newState.completed) {
        this.allCompletedRequests.push(req);
        this.rollingMetrics.addRequest(req);
      }
      newState.completed = []; // Clear after collecting
    }

    return this.getSnapshot();
  }

  // -------------------------------------------------------------------------
  // Control Methods
  // -------------------------------------------------------------------------

  start(onUpdate: (snapshot: SimulationSnapshot) => void, tickIntervalMs: number = 100) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.onUpdate = onUpdate;
    
    this.intervalId = setInterval(() => {
      const snapshot = this.step();
      if (this.onUpdate) {
        this.onUpdate(snapshot);
      }
    }, tickIntervalMs);
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    this.tick = 0;
    this.allCompletedRequests = [];
    this.rollingMetrics.reset();
    this.initializeNodeStates();
  }

  updateGraph(graph: GraphState) {
    this.graph = graph;
    // Keep existing states for nodes that still exist
    const newStates = new Map<string, NodeState>();
    for (const node of graph.nodes) {
      const existing = this.nodeStates.get(node.id);
      newStates.set(node.id, existing || createInitialNodeState());
    }
    this.nodeStates = newStates;
  }

  // -------------------------------------------------------------------------
  // Snapshot
  // -------------------------------------------------------------------------

  getSnapshot(): SimulationSnapshot {
    const nodeMetrics = new Map<string, { utilization: number; throughput: number; queueDepth: number }>();
    
    for (const [nodeId, state] of this.nodeStates) {
      nodeMetrics.set(nodeId, {
        utilization: state.utilization,
        throughput: state.throughput,
        queueDepth: state.queue.length,
      });
    }

    return {
      tick: this.tick,
      nodeStates: new Map(this.nodeStates),
      metrics: calculateMetrics(this.allCompletedRequests, this.tick),
      nodeMetrics,
    };
  }

  get running(): boolean {
    return this.isRunning;
  }
}
