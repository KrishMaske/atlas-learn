'use client';

import { NodeType, NODE_LABELS } from '@/core/types';

// -----------------------------------------------------------------------------
// Node Palette Item
// -----------------------------------------------------------------------------

interface PaletteItemProps {
  type: NodeType;
  onDragStart: (type: NodeType) => void;
}

const nodeIcons: Record<NodeType, string> = {
  CLIENT: '👤',
  API: '🔀',
  DATABASE: '🗄️',
  CACHE: '⚡',
  QUEUE: '📋',
  WORKER: '⚙️',
};

const nodeColors: Record<NodeType, string> = {
  CLIENT: 'from-blue-500/20 to-blue-600/20 border-blue-500/50',
  API: 'from-green-500/20 to-green-600/20 border-green-500/50',
  DATABASE: 'from-purple-500/20 to-purple-600/20 border-purple-500/50',
  CACHE: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50',
  QUEUE: 'from-orange-500/20 to-orange-600/20 border-orange-500/50',
  WORKER: 'from-red-500/20 to-red-600/20 border-red-500/50',
};

function PaletteItem({ type, onDragStart }: PaletteItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(type)}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing
        bg-gradient-to-br ${nodeColors[type]} border
        hover:scale-105 transition-all duration-200
        select-none
      `}
    >
      <span className="text-2xl">{nodeIcons[type]}</span>
      <span className="text-sm font-medium text-white/90">{NODE_LABELS[type]}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Node Palette
// -----------------------------------------------------------------------------

interface NodePaletteProps {
  onDragStart: (type: NodeType) => void;
}

const nodeTypes: NodeType[] = ['CLIENT', 'API', 'DATABASE', 'CACHE', 'QUEUE', 'WORKER'];

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-56 bg-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 p-4 flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Components
      </h2>
      {nodeTypes.map((type) => (
        <PaletteItem key={type} type={type} onDragStart={onDragStart} />
      ))}
      
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          Drag components onto the canvas to build your system
        </p>
      </div>
    </div>
  );
}
