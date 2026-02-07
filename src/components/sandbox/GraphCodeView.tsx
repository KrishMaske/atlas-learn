'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useGraphStore } from '@/core/graph/graphStore';
import { graphToCode } from '@/core/generator/graphToCode';
import { parseCodeToNodeUpdates, isCodeStructureValid } from '@/core/generator/codeToGraph';

interface ServerState {
  running: boolean;
  port: number | null;
  pid: number | null;
  logs: string[];
}

export default function GraphCodeView() {
  const { nodes, edges, updateNodeConfig } = useGraphStore();
  const [code, setCode] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [serverState, setServerState] = useState<ServerState>({
    running: false,
    port: null,
    pid: null,
    logs: [],
  });
  const [isStarting, setIsStarting] = useState(false);

  const lastGeneratedCodeRef = useRef<string>('');

  // Regenerate code when graph changes (only if not dirty)
  useEffect(() => {
    if (!isDirty) {
      const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
      const generated = graphToCode(graph);
      setCode(generated);
      lastGeneratedCodeRef.current = generated;
    }
  }, [nodes, edges, isDirty]);

  // Handle editor changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value) return;
    setCode(value);
    
    // Check if the code differs from the last generated code
    if (value !== lastGeneratedCodeRef.current) {
      setIsDirty(true);
    }
  }, []);

  // Apply code changes back to graph
  const handleApplyChanges = useCallback(() => {
    if (!isCodeStructureValid(code)) {
      alert('Code structure is invalid. Ensure node markers are preserved.');
      return;
    }

    const updates = parseCodeToNodeUpdates(code);
    for (const update of updates) {
      updateNodeConfig(update.nodeId, { customCode: update.customCode });
    }
    
    // Regenerate code to ensure consistency
    const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
    const generated = graphToCode(graph);
    setCode(generated);
    lastGeneratedCodeRef.current = generated;
    setIsDirty(false);
  }, [code, nodes, edges, updateNodeConfig]);

  // Discard changes and regenerate
  const handleDiscardChanges = useCallback(() => {
    const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
    const generated = graphToCode(graph);
    setCode(generated);
    lastGeneratedCodeRef.current = generated;
    setIsDirty(false);
  }, [nodes, edges]);

  // Start the live server
  const handleStartServer = useCallback(async () => {
    setIsStarting(true);
    try {
      const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
      const res = await fetch('/api/v1/server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph }),
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
      setIsStarting(false);
    }
  }, [nodes, edges]);

  // Stop the live server
  const handleStopServer = useCallback(async () => {
    if (!serverState.pid) return;
    
    try {
      await fetch('/api/v1/server/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }, [serverState]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {/* Header */}
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-200">Generated Server Code</span>
          {isDirty && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
              Modified
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <button
                onClick={handleApplyChanges}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded"
              >
                Apply to Graph
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded"
              >
                Discard
              </button>
            </>
          )}
          
          {!serverState.running ? (
            <button
              onClick={handleStartServer}
              disabled={isStarting || nodes.length === 0}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
            >
              {isStarting ? 'Starting...' : '▶ Run Server'}
            </button>
          ) : (
            <button
              onClick={handleStopServer}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>

      {/* Server Status Bar */}
      {serverState.running && (
        <div className="px-4 py-2 bg-green-900/30 border-b border-green-800/50 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-300">
            Server running at{' '}
            <a
              href={`http://localhost:${serverState.port}/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-mono"
            >
              http://localhost:{serverState.port}
            </a>
          </span>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: false,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Logs Panel */}
      {serverState.logs.length > 0 && (
        <div className="h-24 border-t border-slate-700 bg-slate-950 overflow-auto">
          <div className="px-2 py-1 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 sticky top-0">
            Server Logs
          </div>
          <div className="p-2">
            {serverState.logs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-slate-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
