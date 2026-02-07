import { NextRequest, NextResponse } from 'next/server';
import { ExecutionEngine } from '@/core/execution/engine';
import { GraphState } from '@/core/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await req.json();
    const { payload, graph } = body;

    if (!graph || !nodeId) {
      return NextResponse.json(
        { error: 'Missing graph or nodeId' },
        { status: 400 }
      );
    }

    // Initialize engine with the provided graph state
    const engine = new ExecutionEngine(graph as GraphState);
    
    // Execute
    const result = await engine.run(nodeId, payload || {});

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, success: false },
      { status: 500 }
    );
  }
}
