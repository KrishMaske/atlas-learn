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
  onStartServer: (code?: string) => void;
  onStopServer: () => void;
  aiGeneratedCode?: string | null;
  userCode: string | null;
  setUserCode: (code: string | null) => void;
}

export default function GraphCodeView({ serverState, isStarting, onStartServer, onStopServer, aiGeneratedCode, userCode, setUserCode }: GraphCodeViewProps) {
  const { nodes, edges, updateNodeConfig } = useGraphStore();
  
  // Derived generated code
  const graph = React.useMemo(() => ({ nodes, edges, selectedNodeId: null, selectedEdgeId: null }), [nodes, edges]);
  const generatedCode = React.useMemo(() => graphToCode(graph), [graph]);

  // User overrides & File Viewing state
  // userCode is now passed via props
  const [fileContent, setFileContent] = useState<string | null>(null);

  // File Explorer State
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState(false); // Kept for logic compatibility, but UI removed

  // Computed state
  const isDirty = !viewingFile && userCode !== null && userCode !== generatedCode;
  // Priority: viewing file > AI generated > user override > static generated
  const displayCode = viewingFile 
    ? (fileContent || '') 
    : (aiGeneratedCode || (userCode ?? generatedCode));

  // Fetch file list when server is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (serverState.running && serverState.pid) {
      const fetchFiles = async () => {
        try {
          const res = await fetch(`/api/v1/server/files?pid=${serverState.pid}`, {
            headers: { 'Authorization': 'Bearer atlas-local-dev-secret' }
          });
          const data = await res.json();
          if (data.success) {
            setFiles(data.files);
          }
        } catch (err) {
          // Ignore fetch errors during development/reloads to avoid noise
          console.warn('Failed to fetch files (server might be restarting):', err);
        }
      };
      
      fetchFiles(); // Initial fetch
      interval = setInterval(fetchFiles, 3000); // Poll every 3s
    } else {
      setFiles([]);
      if (viewingFile) {
        setViewingFile(false);
        setSelectedFile(null);
        setFileContent(null);
      }
    }
    return () => clearInterval(interval);
  }, [serverState.running, serverState.pid, viewingFile]);

  // Load a specific file
  const handleFileClick = async (filename: string) => {
    if (!serverState.pid) return;
    
    setSelectedFile(filename);
    setViewingFile(true);

    try {
      const res = await fetch(`/api/v1/server/files?pid=${serverState.pid}&path=${filename}`);
      const data = await res.json();
      if (data.success) {
        setFileContent(data.content);
      } else {
        setFileContent(`// Failed to load file: ${data.error}`);
      }
    } catch (err) {
      setFileContent(`// Network error loading file`);
    }
  };

  const handleBackToGenerated = () => {
    setViewingFile(false);
    setSelectedFile(null);
    setFileContent(null);
  };

  // Handle editor changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (viewingFile || value === undefined) return; // Read-only when viewing server files
    
    // If value matches generated, clear toggle (not dirty)
    if (value === generatedCode) {
        setUserCode(null);
    } else {
        setUserCode(value);
    }
  }, [viewingFile, generatedCode]);

  // Apply code changes back to graph
  const handleApplyChanges = useCallback(() => {
    const codeToApply = userCode ?? generatedCode;
    
    // Check if code has our special markers (only present in static graphToCode output)
    if (!isCodeStructureValid(codeToApply)) {
      // For AI-generated or pasted code, we can't sync back to the graph
      // But we can still run the code! Inform the user.
      const shouldRun = window.confirm(
        'This code was not generated from the graph editor (missing node markers).\n\n' +
        'Graph sync is not possible, but you can:\n' +
        '• Click "Run Server" to execute this code directly\n' +
        '• Use the visual graph editor to create nodes, then modify the generated code\n\n' +
        'Would you like to run this code now?'
      );
      if (shouldRun) {
        onStartServer(codeToApply);
      }
      return;
    }

    const updates = parseCodeToNodeUpdates(codeToApply);
    for (const update of updates) {
      updateNodeConfig(update.nodeId, { customCode: update.customCode });
    }
    
    // After applying, the nodes will update, which updates generatedCode.
    // We want to reset userCode so it matches the new generatedCode.
    setUserCode(null);
  }, [userCode, generatedCode, updateNodeConfig, onStartServer]);

  // Discard changes and regenerate
  const handleDiscardChanges = useCallback(() => {
    setUserCode(null);
  }, []);

  return (
    <div className="flex-1 flex flex-row bg-slate-900 h-full overflow-hidden">
      {/* Sidebar removed */}

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
                onClick={() => onStartServer(displayCode)}
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
              API Docs ↗
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
            value={displayCode}
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

        {/* Console / Logs removed */}
      </div>
    </div>
  );
}
