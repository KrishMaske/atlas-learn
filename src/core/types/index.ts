
export type NodeType = 'CLIENT' | 'API' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'WORKER';

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  config: Record<string, any>; // Flexible config based on type
}

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface GraphState {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface SimulationMetrics {
  timestamp: number;
  p95: number;
  throughput: number;
  errorRate: number;
}
