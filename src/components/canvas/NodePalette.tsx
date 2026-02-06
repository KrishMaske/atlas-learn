'use client';

import { useState } from 'react';
import { NodeType, NodeCategory, NODE_LABELS, NODE_VISUALS, NODE_CATEGORIES } from '@/core/types';

// =============================================================================
// Node Palette — grouped by category with collapsible sections
// =============================================================================

interface PaletteItemProps {
  type: NodeType;
  onDragStart: (type: NodeType) => void;
}

function PaletteItem({ type, onDragStart }: PaletteItemProps) {
  const visual = NODE_VISUALS[type];
  return (
    <div
      draggable
      onDragStart={() => onDragStart(type)}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
        bg-gradient-to-br ${visual.colorClass} border
        hover:scale-[1.03] transition-all duration-150
        select-none text-sm
      `}
    >
      <span className="text-lg leading-none">{visual.icon}</span>
      <span className="font-medium text-white/90 truncate">{NODE_LABELS[type]}</span>
    </div>
  );
}

// Category section with collapsible list
function CategorySection({
  category,
  types,
  onDragStart,
  defaultOpen = true,
}: {
  category: NodeCategory;
  types: NodeType[];
  onDragStart: (type: NodeType) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 py-1.5 hover:text-slate-300 transition-colors"
      >
        <span>{category}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-1.5 pl-0.5">
          {types.map((type) => (
            <PaletteItem key={type} type={type} onDragStart={onDragStart} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main palette component
interface NodePaletteProps {
  onDragStart: (type: NodeType) => void;
}

const CATEGORY_ORDER: NodeCategory[] = [
  'Traffic',
  'Networking',
  'APIs',
  'Caching',
  'Storage',
  'Compute',
  'Big Data',
  'Custom',
];

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-56 bg-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      <div className="p-3 border-b border-slate-700/50">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Components
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {CATEGORY_ORDER.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            types={NODE_CATEGORIES[cat]}
            onDragStart={onDragStart}
            defaultOpen={['Traffic', 'Networking', 'APIs'].includes(cat)}
          />
        ))}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Drag onto canvas &middot; Double-click to connect
        </p>
      </div>
    </div>
  );
}
