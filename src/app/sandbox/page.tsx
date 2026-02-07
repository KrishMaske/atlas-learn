'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { NodeType } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';
import { SimulationEngine, SimulationSnapshot } from '@/core/sim/engine';
import { Metrics } from '@/core/sim/metrics';
import NodePalette from '@/components/canvas/NodePalette';
import Canvas from '@/components/canvas/Canvas';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import RunControls from '@/components/sim/RunControls';
import MetricsPanel from '@/components/sim/MetricsPanel';
import CodePreview from '@/components/generator/CodePreview';
import ExportDialog from '@/components/generator/ExportDialog';
import NodeCodeEditor from '@/components/sandbox/NodeCodeEditor';
import GraphCodeView from '@/components/sandbox/GraphCodeView';
import TestRunnerModal from '@/components/debug/TestRunnerModal';
import Link from 'next/link';

// =============================================================================
// Sandbox Page — visual builder + simulation + code generation
// =============================================================================

type RightPanel = 'inspector' | 'code';

export default function SandboxPage() {
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tick, setTick] = useState(0);
  const [simulationMetrics, setSimulationMetrics] = useState<Map<string, { utilization: number; requestCount: number }>>(new Map());
  const [rightPanel, setRightPanel] = useState<RightPanel>('inspector');
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [exportOpen, setExportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const engineRef = useRef<SimulationEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { nodes, edges } = useGraphStore();

  // Handle simulation updates
  const handleSimulationUpdate = useCallback((snapshot: SimulationSnapshot) => {
    setTick(snapshot.tick);
    setMetrics(snapshot.metrics);

    const nodeViz = new Map<string, { utilization: number; requestCount: number }>();
    for (const [nodeId, m] of snapshot.nodeMetrics) {
      nodeViz.set(nodeId, {
        utilization: m.utilization,
        requestCount: m.throughput,
      });
    }
    setSimulationMetrics(nodeViz);
  }, []);

  // Start simulation
  const handleStart = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SimulationEngine({ nodes, edges, selectedNodeId: null, selectedEdgeId: null });
    } else {
      engineRef.current.updateGraph({ nodes, edges, selectedNodeId: null, selectedEdgeId: null });
    }

    setIsSimulating(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      if (engineRef.current) {
        const snapshot = engineRef.current.step();
        handleSimulationUpdate(snapshot);
      }
    }, 100);
  }, [nodes, edges, handleSimulationUpdate]);

  // Pause simulation
  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Step simulation
  const handleStep = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SimulationEngine({ nodes, edges, selectedNodeId: null, selectedEdgeId: null });
    }
    
    const snapshot = engineRef.current.step();
    handleSimulationUpdate(snapshot);
    setIsSimulating(true);
    setIsPaused(true);
  }, [nodes, edges, handleSimulationUpdate]);

  // Reset simulation
  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    engineRef.current = null;
    setIsSimulating(false);
    setIsPaused(false);
    setMetrics(null);
    setTick(0);
    setSimulationMetrics(new Map());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Top Bar */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Atlas
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-sm">Sandbox</span>
        </div>

        <RunControls
          isRunning={isSimulating && !isPaused}
          isPaused={isPaused}
          onStart={handleStart}
          onPause={handlePause}
          onStep={handleStep}
          onReset={handleReset}
        />

        <div className="flex items-center gap-2">
          {/* Test Runner */}
          <button
            onClick={() => setTestOpen(true)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
          >
            <span>🐞</span>
            <span className="hidden sm:inline">Test</span>
          </button>

          {/* Panel toggle */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => {
                setViewMode('visual');
                setRightPanel('inspector');
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'visual'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'code'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Code
            </button>
          </div>

          {/* Export */}
          <button
            onClick={() => setExportOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-medium"
          >
            Export
          </button>

          <Link
            href="/tutorial"
            className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-xs"
          >
            Tutorials
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {viewMode === 'visual' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Node Palette */}
            <NodePalette onDragStart={setDraggedNodeType} />

            {/* Center: Canvas */}
            <Canvas
              draggedNodeType={draggedNodeType}
              simulationMetrics={simulationMetrics}
              isSimulating={isSimulating && !isPaused}
            />

            {/* Right: Inspector or Code Preview */}
            {rightPanel === 'inspector' ? (
              <InspectorPanel />
            ) : (
              <div className="w-[480px] border-l border-slate-700/50">
                <CodePreview />
              </div>
            )}
          </div>
        ) : (
            <GraphCodeView />
        )}

        {/* Bottom Toolbar (Simulation Controls) - only show in visual mode or both? Let's show in both */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl shadow-2xl z-20">
        </div>
      </div>

      {/* Bottom: Metrics */}
      <MetricsPanel metrics={metrics} tick={tick} />

      {/* Export Dialog */}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      
      {/* Test Runner Modal */}
      {testOpen && <TestRunnerModal onClose={() => setTestOpen(false)} />}
    </div>
  );
}
