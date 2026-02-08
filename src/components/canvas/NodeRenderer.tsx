'use client';

import { NodeData, NODE_VISUALS } from '@/core/types';

// =============================================================================
// Node Renderer — renders a single node on the canvas
// =============================================================================

interface NodeRendererProps {
  node: NodeData;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function NodeRenderer({
  node,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
}: NodeRendererProps) {
  const visual = NODE_VISUALS[node.type] ?? NODE_VISUALS.REST_API;

  return (
    <div
      className={`
        absolute w-32 h-24 rounded-xl cursor-move
        ${visual.bgClass} border-2 ${visual.borderClass}
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
      <span className="text-2xl">{visual.icon}</span>

      <span className="text-xs font-semibold text-foreground text-center px-2 truncate w-full">
        {node.label}
      </span>

      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 w-3 h-3 bg-slate-600 border border-slate-400 rounded-full transform -translate-y-1/2" />
      <div className="absolute -right-2 top-1/2 w-3 h-3 bg-slate-600 border border-slate-400 rounded-full transform -translate-y-1/2" />
    </div>
  );
}
