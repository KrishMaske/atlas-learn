'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGraphStore } from '@/core/graph/graphStore';
import { compileGraphToIR } from '@/core/generator/ir';
import { generateCode, GeneratedFile } from '@/core/generator/codegen';

// =============================================================================
// CodePreview — tabbed code viewer for generated backend output
// =============================================================================

function FileTree({
  files,
  selected,
  onSelect,
}: {
  files: GeneratedFile[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  // Group files by top-level directory
  const tree = useMemo(() => {
    const dirs: Record<string, GeneratedFile[]> = {};
    const root: GeneratedFile[] = [];
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        const dir = parts[0];
        (dirs[dir] ??= []).push(f);
      } else {
        root.push(f);
      }
    }
    return { dirs, root };
  }, [files]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="w-52 flex-shrink-0 bg-slate-900/60 border-r border-slate-700/50 overflow-y-auto text-xs">
      {/* Root files */}
      {tree.root.map((f) => (
        <button
          key={f.path}
          onClick={() => onSelect(f.path)}
          className={`block w-full text-left px-3 py-1.5 truncate ${
            selected === f.path
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          📄 {f.path}
        </button>
      ))}

      {/* Directories */}
      {Object.entries(tree.dirs).map(([dir, dirFiles]) => (
        <div key={dir}>
          <button
            onClick={() =>
              setCollapsed((p) => ({ ...p, [dir]: !p[dir] }))
            }
            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800/60 flex items-center gap-1"
          >
            <span className="text-[10px]">{collapsed[dir] ? '▶' : '▼'}</span>
            📁 {dir}
          </button>
          {!collapsed[dir] &&
            dirFiles.map((f) => (
              <button
                key={f.path}
                onClick={() => onSelect(f.path)}
                className={`block w-full text-left pl-6 pr-3 py-1.5 truncate ${
                  selected === f.path
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                📄 {f.path.split('/').pop()}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

function CodeView({ file }: { file: GeneratedFile | undefined }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = file.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        No file selected
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/40 border-b border-slate-700/50">
        <span className="text-xs text-slate-400 font-mono">{file.path}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
        <pre className="text-xs font-mono text-slate-300 leading-5 whitespace-pre">
          {file.content}
        </pre>
      </div>
    </div>
  );
}

export default function CodePreview() {
  const { nodes, edges } = useGraphStore();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [projectName, setProjectName] = useState('my-backend');

  const generated = useMemo(() => {
    if (nodes.length === 0) return [];
    try {
      const graph = { nodes, edges, selectedNodeId: null, selectedEdgeId: null };
      const ir = compileGraphToIR(graph, projectName);
      return generateCode(ir);
    } catch {
      return [];
    }
  }, [nodes, edges, projectName]);

  // Auto-select first file when generated changes
  const selectedFile = generated.find((f) => f.path === selectedPath) ?? generated[0];

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-500">
        <p className="text-lg mb-2">No nodes on canvas</p>
        <p className="text-sm">Add nodes and connect them to generate code</p>
      </div>
    );
  }

  if (generated.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-500">
        <p className="text-lg mb-2">Cannot generate code</p>
        <p className="text-sm">
          Ensure your graph has at least one service node (not just clients)
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Generated Code
        </h2>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.replace(/[^a-z0-9-]/g, ''))}
          className="bg-slate-800 text-white text-xs font-mono px-2 py-1 rounded border border-slate-600 w-40"
          placeholder="project-name"
        />
        <span className="text-[10px] text-slate-500 ml-auto">
          {generated.length} files
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <FileTree
          files={generated}
          selected={selectedFile?.path ?? ''}
          onSelect={setSelectedPath}
        />
        <CodeView file={selectedFile} />
      </div>
    </div>
  );
}
