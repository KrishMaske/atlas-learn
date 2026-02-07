'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { NodeType } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';
import { SimulationEngine, SimulationSnapshot } from '@/core/sim/engine';
import { Metrics } from '@/core/sim/metrics';
import { TUTORIAL_LEVELS, getLevel } from '@/core/tutorial/levels';
import { evaluateLevel, EvaluationResult } from '@/core/tutorial/evaluator';
import NodePalette from '@/components/canvas/NodePalette';
import Canvas from '@/components/canvas/Canvas';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import RunControls from '@/components/sim/RunControls';
import MetricsPanel from '@/components/sim/MetricsPanel';
import TutorialShell from '@/components/tutorial/TutorialShell';
import Link from 'next/link';

// =============================================================================
// Tutorial Page
// =============================================================================

export default function TutorialPage() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tick, setTick] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [simulationMetrics, setSimulationMetrics] = useState<Map<string, { utilization: number; requestCount: number }>>(new Map());

  const engineRef = useRef<SimulationEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { nodes, edges, loadGraph, clearGraph } = useGraphStore();

  const currentLevel = selectedLevelId ? getLevel(selectedLevelId) : null;

  // Load level
  const handleSelectLevel = useCallback((levelId: string) => {
    const level = getLevel(levelId);
    if (level) {
      setSelectedLevelId(levelId);
      loadGraph(level.starterGraph);
      setEvaluation(null);
      setMetrics(null);
      setTick(0);
      engineRef.current = null;
    }
  }, [loadGraph]);

  // Handle simulation updates
  const handleSimulationUpdate = useCallback((snapshot: SimulationSnapshot) => {
    setTick(snapshot.tick);
    setMetrics(snapshot.metrics);

    // Evaluate objectives
    if (currentLevel && snapshot.tick > 50) {
      const result = evaluateLevel(currentLevel, snapshot.metrics);
      setEvaluation(result);
    }

    // Convert node metrics for canvas visualization
    const nodeViz = new Map<string, { utilization: number; requestCount: number }>();
    for (const [nodeId, m] of snapshot.nodeMetrics) {
      nodeViz.set(nodeId, {
        utilization: m.utilization,
        requestCount: m.throughput,
      });
    }
    setSimulationMetrics(nodeViz);
  }, [currentLevel]);

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
    setEvaluation(null);
    setSimulationMetrics(new Map());

    // Reload level graph
    if (currentLevel) {
      loadGraph(currentLevel.starterGraph);
    }
  }, [currentLevel, loadGraph]);

  // Complete level
  const handleComplete = useCallback(() => {
    setSelectedLevelId(null);
    clearGraph();
    setEvaluation(null);
    setMetrics(null);
    handleReset();
  }, [clearGraph, handleReset]);

  // Exit tutorial
  const handleExit = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Level Selection Screen
  if (!selectedLevelId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header */}
        <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center px-4">
          <Link href="/" className="text-lg font-bold text-white">
            Atlas Learn
          </Link>
          <span className="text-slate-500 mx-4">|</span>
          <span className="text-slate-400">Tutorials</span>
        </header>

        {/* Level Grid */}
        <main className="max-w-4xl mx-auto py-16 px-4">
          <h1 className="text-4xl font-bold mb-4">Tutorial Levels</h1>
          <p className="text-slate-400 mb-12">
            Learn system design concepts through hands-on challenges.
          </p>

          <div className="grid gap-6">
            {TUTORIAL_LEVELS.map((level, index) => (
              <button
                key={level.id}
                onClick={() => handleSelectLevel(level.id)}
                className="text-left bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl font-bold text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">{level.title}</h2>
                    <p className="text-slate-400">{level.description}</p>
                    <div className="mt-3 flex gap-2">
                      {level.objectives.map((obj, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">
                          {obj.metric} {obj.operator} {obj.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Educational Resources */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">📚</span> Engineering Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                   📺 Recommended Channels
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="https://www.youtube.com/@ByteByteGo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      ByteByteGo (Alex Xu)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youtube.com/@hnasr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      Hussein Nasser (Backend Engineering)
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                   📖 Written Guides
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="https://github.com/donnemartin/system-design-primer" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <span className="text-xl">🐙</span> The System Design Primer
                    </a>
                  </li>
                  <li>
                    <a href="https://roadmap.sh/backend" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <span className="text-xl">🗺️</span> Backend Developer Roadmap
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/sandbox"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Or try the free-form Sandbox →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Tutorial Editor Screen
  return (
    <div className="h-screen flex flex-col bg-slate-950 relative">
      {/* Top Bar */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-white">
            Atlas Learn
          </Link>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Tutorial</span>
        </div>

        <RunControls
          isRunning={isSimulating && !isPaused}
          isPaused={isPaused}
          onStart={handleStart}
          onPause={handlePause}
          onStep={handleStep}
          onReset={handleReset}
        />

        <div className="w-32" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Node Palette */}
        <NodePalette onDragStart={setDraggedNodeType} />

        {/* Center: Canvas */}
        <Canvas
          draggedNodeType={draggedNodeType}
          simulationMetrics={simulationMetrics}
          isSimulating={isSimulating && !isPaused}
        />

        {/* Right: Inspector */}
        <InspectorPanel />

        {/* Tutorial Overlay */}
        {currentLevel && (
          <TutorialShell
            level={currentLevel}
            evaluation={evaluation}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        )}
      </div>

      {/* Bottom: Metrics */}
      <MetricsPanel metrics={metrics} tick={tick} />
    </div>
  );
}
