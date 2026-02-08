'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { NodeType } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';
import { useFileStore } from '@/core/ide/fileStore';
import NodePalette from '@/components/canvas/NodePalette';
import Canvas from '@/components/canvas/Canvas';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import CodePreview from '@/components/generator/CodePreview';
import ExportDialog from '@/components/generator/ExportDialog';
import GraphCodeView from '@/components/sandbox/GraphCodeView';
import TestRunnerModal from '@/components/debug/TestRunnerModal';
import FileExplorer from '@/components/ide/FileExplorer';
import IDEHeader from '@/components/ide/IDEHeader';

// =============================================================================
// Sandbox Page — visual builder + code generation
// =============================================================================

type RightPanel = 'inspector' | 'code';

export default function SandboxPage() {
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('inspector');
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [exportOpen, setExportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBackendCode, setGeneratedBackendCode] = useState<string | null>(null);

  const [userCode, setUserCode] = useState<string | null>(null);

  // Initialize file store
  const { createFile, files, activeFileId, selectFile } = useFileStore();
  
  // Ensure we have at least one file on mount if none exist
  useEffect(() => {
    // Small delay to ensure client-side hydration doesn't mismatch? 
    // Actually zustand persists in memory, so if empty, create one.
    if (useFileStore.getState().files.length === 0) {
      createFile('New Architecture');
    }
  }, []); // Only on mount

  // ... (Server state logic logic preserved below or simplified?) ...
  // Since GraphCodeView handles server logic, I will keep the state here ONLY if it needs to be shared.
  // Previous validation: GraphCodeView took serverState as props.
  // I will keep the server logic here for now to avoid breaking GraphCodeView integration.

  const [serverState, setServerState] = useState<{
    running: boolean;
    port: number | null;
    pid: number | null;
    logs: string[];
  }>({
    running: false,
    port: null,
    pid: null,
    logs: [],
  });
  const [isStartingServer, setIsStartingServer] = useState(false);

  // Start the live server
  const handleStartServer = useCallback(async (codeOverride?: string) => {
    setIsStartingServer(true);
    try {
      // Use current graph state
      const { nodes, edges } = useGraphStore.getState(); // Destructure nodes and edges
      
      // Determine effective code directly here
      // Priority: Code passed from Editor (GraphCodeView run button) > User Edits (Header run button) > AI Generated > Custom Node Code
      // This fixes the "Schema Drift" issue where Header run button was ignoring user edits
      const effectiveCode = typeof codeOverride === 'string' 
        ? codeOverride 
        : (userCode || generatedBackendCode || (nodes.find(n => n.type === 'REST_API' || n.type === 'GRAPHQL_API')?.config as any)?.customCode);

      const res = await fetch('/api/v1/server/start', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ATLAS_SECRET || 'atlas-local-dev-secret'}`
        },
        // Send the visible code to the server to ensure execution matches editor
        body: JSON.stringify({ 
          graph: { nodes, edges },
          code: effectiveCode
        }),
      });
      const result = await res.json();
      
      if (result.success) {
        setServerState({
          running: true,
          port: result.port,
          pid: result.pid,
          logs: [`Server started on port ${result.port}`],
        });
      } else {
        setServerState(prev => ({
          ...prev,
          logs: [...prev.logs, `Error: ${result.error}`],
        }));
      }
    } catch (err: any) {
      setServerState(prev => ({
        ...prev,
        logs: [...prev.logs, `Error: ${err.message}`],
      }));
    } finally {
      setIsStartingServer(false);
    }
  }, [userCode, generatedBackendCode]); // Depend on userCode and generatedBackendCode

  // Stop the live server
  const handleStopServer = useCallback(async () => {
    if (!serverState.pid) return;
    
    try {
      await fetch('/api/v1/server/stop', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer atlas-local-dev-secret'
        },
        body: JSON.stringify({ pid: serverState.pid }),
      });
      
      setServerState({
        running: false,
        port: null,
        pid: null,
        logs: [...serverState.logs, 'Server stopped'],
      });
    } catch (err: any) {
      setServerState(prev => ({
        ...prev,
        logs: [...prev.logs, `Error stopping: ${err.message}`],
      }));
    }
  }, [serverState.pid, serverState.logs]);

  // Generate complete backend from graph using AI
  const handleGenerateBackend = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { nodes, edges } = useGraphStore.getState();
      
      // Extract global context from CONTEXT nodes
      const contextNodes = nodes.filter(n => n.type === 'CONTEXT');
      const globalContext = contextNodes
        .map(n => (n.config as any).context || (n.config as any).prompt || '')
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/v1/ai/generate-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, globalContext }),
      });

      const result = await res.json();

      if (result.success && result.code) {
        setGeneratedBackendCode(result.code);
        // Reset user edits when new code is generated, or keep them?
        // Usually better to start fresh from the new generation.
        setUserCode(null); 
        setViewMode('code'); // Switch to code view to show result
        console.log('[Generate Backend] Generated', result.code.length, 'chars for', result.nodeCount, 'nodes');
      } else {
        console.error('[Generate Backend] Error:', result.error);
        alert('Failed to generate backend: ' + (result.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('[Generate Backend] Error:', err);
      alert('Failed to generate backend: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  
  return (
    <div className="h-full flex flex-row bg-background/50 relative overflow-hidden">
      {/* Sidebar: File Explorer */}
      <FileExplorer />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <IDEHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={() => setExportOpen(true)}
          onTest={() => setTestOpen(true)}
          onGenerateBackend={handleGenerateBackend}
          isGenerating={isGenerating}
          onStartServer={() => handleStartServer()} // Header calls without args, uses state
          onStopServer={handleStopServer}
          isServerRunning={serverState.running}
          isStartingServer={isStartingServer}
        />

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {viewMode === 'visual' ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Node Palette (Canvas Palette) */}
              <NodePalette onDragStart={setDraggedNodeType} />

              {/* Center: Canvas */}
              <Canvas 
                draggedNodeType={draggedNodeType} 
                isServerRunning={serverState.running}
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
            <GraphCodeView 
              serverState={serverState}
              isStarting={isStartingServer}
              onStartServer={handleStartServer}
              onStopServer={handleStopServer}
              aiGeneratedCode={generatedBackendCode}
              userCode={userCode}
              setUserCode={setUserCode}
            />
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Test Runner Modal */}
      {testOpen && <TestRunnerModal onClose={() => setTestOpen(false)} />}
    </div>
  );
}
