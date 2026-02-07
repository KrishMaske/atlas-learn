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

interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
}

interface GraphCodeViewProps {
  serverState: ServerState;
  isStarting: boolean;
  onStartServer: () => void;
  onStopServer: () => void;
}

export default function GraphCodeView({ serverState, isStarting, onStartServer, onStopServer }: GraphCodeViewProps) {
  const { nodes, edges, updateNodeConfig } = useGraphStore();
  const [code, setCode] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const lastGeneratedCodeRef = useRef<string>('');

  // File Explorer State
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState(false);

  // Fetch file list when server is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (serverState.running && serverState.pid) {
      const fetchFiles = async () => {
        try {
          const res = await fetch(`/api/v1/server/files?pid=${serverState.pid}`);
          const data = await res.json();
          if (data.success) {
            setFiles(data.files);
          }
        } catch (err) {
          console.error('Failed to fetch files:', err);
        }
      };
      
      fetchFiles(); // Initial fetch
      interval = setInterval(fetchFiles, 3000); // Poll every 3s
    } else {
      setFiles([]);
      setViewingFile(false);
      setSelectedFile(null);
    }
    return () => clearInterval(interval);
  }, [serverState.running, serverState.pid]);

  // Load a specific file
  const handleFileClick = async (filename: string) => {
    if (!serverState.pid) return;
    
    setSelectedFile(filename);
    setViewingFile(true);

    try {
      const res = await fetch(`/api/v1/server/files?pid=${serverState.pid}&path=${filename}`);
      const data = await res.json();
      if (data.success) {
        setCode(data.content);
      } else {
        setCode(`// Failed to load file: ${data.error}`);
      }
    } catch (err) {
      setCode(`// Network error loading file`);
    }
  };

  const handleBackToGenerated = () => {
    setViewingFile(false);
    setSelectedFile(null);
    setCode(lastGeneratedCodeRef.current);
  };

  // Regenerate code when graph changes (only if not dirty and NOT viewing a file)
  useEffect(() => {
    if (!isDirty && !viewingFile) {
      const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
      const generated = graphToCode(graph);
      setCode(generated);
      lastGeneratedCodeRef.current = generated;
    }
  }, [nodes, edges, isDirty, viewingFile]);

  // Handle editor changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (viewingFile || !value) return; // Read-only when viewing server files
    setCode(value);
    
    // Check if the code differs from the last generated code
    if (value !== lastGeneratedCodeRef.current) {
      setIsDirty(true);
    }
  }, [viewingFile]);

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

  return (
    <div className="flex-1 flex flex-row bg-slate-900 h-full overflow-hidden">
      {/* Sidebar - File Explorer (only when server is running) */}
      {(serverState.running || files.length > 0) && (
        <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col">
          <div className="p-3 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Server Files
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             <button
                onClick={handleBackToGenerated}
                className={`w-full text-left px-2 py-1.5 rounded text-xs truncate transition-colors flex items-center gap-2 ${
                  !viewingFile ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                📝 generated.js
              </button>
            {files.map(file => (
              <button
                key={file.name}
                onClick={() => handleFileClick(file.name)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs truncate transition-colors flex items-center gap-2 ${
                  selectedFile === file.name ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>{file.type === 'directory' ? 'xB' : '📄'}</span>
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">
              {viewingFile ? `Viewing: ${selectedFile}` : 'Generated Server Code'}
            </span>
            {isDirty && !viewingFile && (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                Modified
              </span>
            )}
            {viewingFile && (
               <span className="text-xs px-2 py-0.5 bg-slate-500/20 text-slate-400 rounded">
                Read Only
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!viewingFile && isDirty && (
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
                onClick={onStartServer}
                disabled={isStarting || nodes.length === 0}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
              >
                {isStarting ? 'Starting...' : '▶ Run Server'}
              </button>
            ) : (
              <button
                onClick={onStopServer}
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
            <a
              href={`http://localhost:${serverState.port}/api-docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 ml-2"
            >
              Swagger UI ↗
            </a>
            <span className="text-xs text-green-400/50 ml-auto font-mono">
              PID: {serverState.pid}
            </span>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              readOnly: viewingFile,
            }}
          />
        </div>

        {/* Console / Logs (if server is running) */}
        <div className="h-48 bg-black border-t border-slate-700 flex flex-col">
            <div className="px-3 py-1 bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 flex justify-between">
              <span>Terminal Output</span>
              {serverState.logs.length > 0 && (
                <span className="text-slate-500">{serverState.logs.length} lines</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-slate-300">
              {serverState.logs.length === 0 ? (
                <span className="text-slate-600 italic">No output yet...</span>
              ) : (
                serverState.logs.map((log, i) => (
                  <div key={i} className="mb-0.5 whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
