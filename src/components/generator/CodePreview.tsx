'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGraphStore } from '@/core/graph/graphStore';
import { compileGraphToIR } from '@/core/generator/ir';
import { generateCode, GeneratedFile } from '@/core/generator/codegen';

// =============================================================================
// CodePreview — tabbed code viewer for generated backend output
// =============================================================================

// Helper to build tree from paths
type TreeNode = {
  name: string;
  path?: string; // Only files have a path
  children: Record<string, TreeNode>;
};

function buildTree(files: GeneratedFile[]): TreeNode {
  const root: TreeNode = { name: 'root', children: {} };
  
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: isFile ? file.path : undefined,
          children: {}
        };
      }
      current = current.children[part];
    }
  }
  return root;
}

function FileTreeNode({ 
  node, 
  depth, 
  selected, 
  onSelect 
}: { 
  node: TreeNode; 
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isFile = !!node.path;
  const sortedChildren = useMemo(() => {
     return Object.values(node.children).sort((a, b) => {
         // Folders first, then files
         const aIsFolder = !a.path;
         const bIsFolder = !b.path;
         if (aIsFolder && !bIsFolder) return -1;
         if (!aIsFolder && bIsFolder) return 1;
         return a.name.localeCompare(b.name);
     });
  }, [node.children]);

  if (isFile) {
    return (
      <button
        onClick={() => onSelect(node.path!)}
        className={`block w-full text-left px-3 py-1 truncate flex items-center gap-2 hover:bg-slate-800/60 ${
          selected === node.path ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <span>📄</span>
        <span>{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left px-3 py-1 text-slate-300 hover:bg-slate-800/60 flex items-center gap-1"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <span className="text-[10px] w-3 scale-75 inline-block">{collapsed ? '▶' : '▼'}</span>
        <span className="text-yellow-500/80">📁</span>
        <span>{node.name}</span>
      </button>
      {!collapsed && (
        <div>
          {sortedChildren.map(child => (
            <FileTreeNode 
              key={child.name} 
              node={child} 
              depth={depth + 1} 
              selected={selected} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileTree({
  files,
  selected,
  onSelect,
}: {
  files: GeneratedFile[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  const root = useMemo(() => buildTree(files), [files]);
  const children = useMemo(() => Object.values(root.children).sort((a, b) => {
       const aIsFolder = !a.path;
       const bIsFolder = !b.path;
       if (aIsFolder && !bIsFolder) return -1;
       if (!aIsFolder && bIsFolder) return 1;
       return a.name.localeCompare(b.name);
  }), [root]);

  return (
    <div className="w-52 flex-shrink-0 bg-slate-900/60 border-r border-slate-700/50 overflow-y-auto text-xs py-2">
      {children.map(child => (
        <FileTreeNode 
          key={child.name} 
          node={child} 
          depth={0} 
          selected={selected} 
          onSelect={onSelect} 
        />
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
