'use client';

import { NodeData } from '@/core/types';

// -----------------------------------------------------------------------------
// Node Renderer
// -----------------------------------------------------------------------------

const nodeColors: Record<string, { bg: string; border: string; icon: string }> = {
  CLIENT: { bg: 'bg-blue-500/20', border: 'border-blue-500', icon: '👤' },
  API: { bg: 'bg-green-500/20', border: 'border-green-500', icon: '🔀' },
  DATABASE: { bg: 'bg-purple-500/20', border: 'border-purple-500', icon: '🗄️' },
  CACHE: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', icon: '⚡' },
  QUEUE: { bg: 'bg-orange-500/20', border: 'border-orange-500', icon: '📋' },
  WORKER: { bg: 'bg-red-500/20', border: 'border-red-500', icon: '⚙️' },
};

interface NodeRendererProps {
  node: NodeData;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  utilization?: number; // 0-1 for visual feedback during simulation
}

export default function NodeRenderer({
  node,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
  utilization = 0,
}: NodeRendererProps) {
  const colors = nodeColors[node.type] || nodeColors.API;
  
  // Utilization color (green -> yellow -> red)
  const utilizationColor = 
    utilization < 0.5 ? 'bg-green-500' :
    utilization < 0.8 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      className={`
        absolute w-32 h-24 rounded-xl cursor-move
        ${colors.bg} border-2 ${colors.border}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
        backdrop-blur-sm shadow-lg
        transition-shadow duration-200
        hover:shadow-xl
        flex flex-col items-center justify-center gap-1
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseDown={onDragStart}
    >
      {/* Node Icon */}
      <span className="text-2xl">{colors.icon}</span>
      
      {/* Node Label */}
      <span className="text-xs font-medium text-white/90 text-center px-2">
        {node.label}
      </span>
      
      {/* Utilization Bar (only show during simulation) */}
      {utilization > 0 && (
        <div className="absolute bottom-1 left-2 right-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${utilizationColor} transition-all duration-300`}
            style={{ width: `${utilization * 100}%` }}
          />
        </div>
      )}
      
      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 w-3 h-3 bg-slate-600 border border-slate-400 rounded-full transform -translate-y-1/2" />
      <div className="absolute -right-2 top-1/2 w-3 h-3 bg-slate-600 border border-slate-400 rounded-full transform -translate-y-1/2" />
    </div>
  );
}
