'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import { useGraphStore } from '@/core/graph/graphStore';
import { AnyNodeConfig } from '@/core/types';

export default function NodeCodeEditor() {
  const { selectedNodeId, nodes, edges, updateNodeConfig } = useGraphStore();
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-900">
        <p>Select a node to edit its logic</p>
      </div>
    );
  }

  const [output, setOutput] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);


  const handleRun = async () => {
    if (!selectedNode) return;
    setIsRunning(true);
    setOutput(null);
    try {
        const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
        const res = await fetch(`/api/v1/invoke/${selectedNode.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                graph,
                payload: { message: 'Hello from Editor', timestamp: Date.now() } // Default payload
            })
        });
        const result = await res.json();
        setOutput(JSON.stringify(result, null, 2));
    } catch (err: any) {
        setOutput('Error: ' + err.message);
    } finally {
        setIsRunning(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    // If it's a FUNCTION node, update 'code'. Otherwise try 'customCode' or fallback.
    // Ideally we should check the node type or config shape.
    if ((selectedNode.config as any).code !== undefined || selectedNode.type === 'FUNCTION') {
        updateNodeConfig(selectedNode.id, { code: value || '' });
    } else {
        updateNodeConfig(selectedNode.id, { customCode: value || '' });
    }
  };

  // Default execution template
  const defaultCode = `// Node: ${selectedNode.label} (${selectedNode.type})
// Input: 'input' variable contains the data from upstream
// Output: Return the data to send downstream
// A 'console' object is available for logging

// Example:
// console.log('Processing:', input);
// return { ...input, processed: true, timestamp: Date.now() };

return { ...input, processed: true };
`;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border-l border-slate-700 h-full">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-400">{selectedNode.type}</span>
            <span className="text-sm font-medium text-slate-200">{selectedNode.label}</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleRun}
                disabled={isRunning}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
            >
                {isRunning ? 'Running...' : '▶ Run'}
            </button>
            <div className="text-[10px] text-slate-500 font-mono">
                ID: {selectedNode.id}
            </div>
        </div>
      </div>
      
       /* Description / Job Spec Prompt */
       {(selectedNode.config as any).jobSpec && (
           <div className="px-4 py-2 bg-blue-900/10 border-b border-blue-900/30">
               <p className="text-xs text-blue-300 font-medium mb-1">Job Description:</p>
               <p className="text-xs text-slate-400 italic">{(selectedNode.config as any).jobSpec}</p>
           </div>
       )}
 
       <div className="flex-1 overflow-hidden relative flex flex-col">
         <div className="flex-1 min-h-[200px]">
             <Editor
             height="100%"
             defaultLanguage="javascript"
             theme="vs-dark"
             value={(selectedNode.config as any).code || (selectedNode.config as any).customCode || defaultCode}
            onChange={handleEditorChange}
            options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
            }}
            />
        </div>
        
        {/* Output Panel */}
        {output && (
            <div className="h-1/3 border-t border-slate-700 bg-slate-950 flex flex-col">
                <div className="px-2 py-1 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                    Output
                </div>
                <div className="flex-1 overflow-auto p-2">
                    <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">{output}</pre>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
