'use client';

import { create } from 'zustand';
import { NodeData, EdgeData, GraphState, NodeType, DEFAULT_CONFIGS, NODE_LABELS } from '@/core/types';

// -----------------------------------------------------------------------------
// Utility: Generate unique IDs
// -----------------------------------------------------------------------------

let nodeCounter = 0;
let edgeCounter = 0;

const generateNodeId = () => `node_${++nodeCounter}`;
const generateEdgeId = () => `edge_${++edgeCounter}`;

// -----------------------------------------------------------------------------
// Graph Store Interface
// -----------------------------------------------------------------------------

interface GraphStore extends GraphState {
  // Node actions
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, config: Partial<NodeData['config']>) => void;
  selectNode: (id: string | null) => void;

  // Edge actions
  addEdge: (sourceId: string, targetId: string) => string | null;
  removeEdge: (id: string) => void;

  // Graph actions
  clearGraph: () => void;
  loadGraph: (graph: GraphState) => void;
  getNode: (id: string) => NodeData | undefined;
}

// -----------------------------------------------------------------------------
// Graph Store Implementation
// -----------------------------------------------------------------------------

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // -------------------------------------------------------------------------
  // Node Actions
  // -------------------------------------------------------------------------

  addNode: (type, position) => {
    const id = generateNodeId();
    const newNode: NodeData = {
      id,
      type,
      position,
      label: NODE_LABELS[type],
      config: { ...DEFAULT_CONFIGS[type] },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));

    return id;
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position } : n
      ),
    }));
  },

  updateNodeConfig: (id, config) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, config: { ...n.config, ...config } } : n
      ),
    }));
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  // -------------------------------------------------------------------------
  // Edge Actions
  // -------------------------------------------------------------------------

  addEdge: (sourceId, targetId) => {
    const state = get();

    // Validate: no self-loops
    if (sourceId === targetId) return null;

    // Validate: no duplicate edges
    const exists = state.edges.some(
      (e) => e.sourceId === sourceId && e.targetId === targetId
    );
    if (exists) return null;

    // Validate: nodes exist
    const sourceExists = state.nodes.some((n) => n.id === sourceId);
    const targetExists = state.nodes.some((n) => n.id === targetId);
    if (!sourceExists || !targetExists) return null;

    const id = generateEdgeId();
    const newEdge: EdgeData = { id, sourceId, targetId };

    set((state) => ({
      edges: [...state.edges, newEdge],
    }));

    return id;
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }));
  },

  // -------------------------------------------------------------------------
  // Graph Actions
  // -------------------------------------------------------------------------

  clearGraph: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
    nodeCounter = 0;
    edgeCounter = 0;
  },

  loadGraph: (graph) => {
    set({
      nodes: graph.nodes,
      edges: graph.edges,
      selectedNodeId: null,
    });
    // Update counters to avoid ID collisions
    nodeCounter = graph.nodes.length;
    edgeCounter = graph.edges.length;
  },

  getNode: (id) => {
    return get().nodes.find((n) => n.id === id);
  },
}));
