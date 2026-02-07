import { GraphState, NodeData, NodeType } from '@/core/types';

export interface ExecutionContext {
  graph: GraphState;
  logs: string[];
  trace: { nodeId: string; status: 'pending' | 'success' | 'error'; output?: any; duration: number }[];
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs: string[];
  trace: ExecutionContext['trace'];
}

export class ExecutionEngine {
  private context: ExecutionContext;

  constructor(graph: GraphState) {
    this.context = {
      graph,
      logs: [],
      trace: [],
    };
  }

  private log(message: string) {
    this.context.logs.push(`[${new Date().toISOString()}] ${message}`);
  }

  private async executeNode(nodeId: string, input: any): Promise<any> {
    const node = this.context.graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const startTime = performance.now();
    this.log(`Executing node: ${node.label} (${node.type})`);

    try {
      // 1. Execute logic based on type
      let output = input;

      if (node.config.customCode) {
        // SECURITY: Disable arbitrary code execution using new Function
        // In a real environment, this should be run in a sandboxed isolation (e.g., vm2, isolated-vm)
        // or disabled entirely. For this local tool, we disable it to be safe per user request.
        this.log(`[WARN] Custom code execution is disabled for node ${node.label}`);
        output = { ...input, _warning: 'Custom code execution is disabled for security' };
      } else {
          // Default behaviors if no custom code
          switch (node.type) {
            case 'API_GATEWAY':
            case 'REST_API':
                // Pass through
                break;
            case 'CUSTOM_LOGIC':
                // Should have had custom code, but if not:
                output = { ...input, processedBy: node.id };
                break;
            default:
                output = { ...input, processedBy: node.id };
          }
      }

      // 2. Route to downstream
      const edges = this.context.graph.edges.filter(e => e.sourceId === nodeId);
      if (edges.length > 0) {
          // Concurrent execution for branching? Or race?
          // For now, let's take the first one or execute all side-effects but return first?
          // Simple model: Single path or parallel. Let's do parallel execution for all outputs
          // But return value is... complex. Let's return array of results if multiple.
          
          if (edges.length === 1) {
              const targetId = edges[0].targetId;
              output = await this.executeNode(targetId, output);
          } else {
               // Branching
               const results = await Promise.all(edges.map(e => this.executeNode(e.targetId, output)));
               output = results; // Aggregate
          }
      }

      const duration = performance.now() - startTime;
      this.context.trace.push({ nodeId, status: 'success', output, duration });
      return output;

    } catch (err: any) {
      const duration = performance.now() - startTime;
      this.context.trace.push({ nodeId, status: 'error', error: err.message, duration } as any);
      this.log(`Error in ${node.label}: ${err.message}`);
      throw err;
    }
  }

  async run(entryNodeId: string, payload: any): Promise<ExecutionResult> {
    try {
      const data = await this.executeNode(entryNodeId, payload);
      return {
        success: true,
        data,
        logs: this.context.logs,
        trace: this.context.trace,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        logs: this.context.logs,
        trace: this.context.trace,
      };
    }
  }
}
