'use client';

import { NodeData, EdgeData } from '@/core/types';

// -----------------------------------------------------------------------------
// Edge Renderer
// -----------------------------------------------------------------------------

interface EdgeRendererProps {
  edge: EdgeData;
  nodes: NodeData[];
  isActive?: boolean; // Show animation during simulation
  requestCount?: number; // Number of requests flowing through
}

export default function EdgeRenderer({
  edge,
  nodes,
  isActive = false,
  requestCount = 0,
  isSelected = false,
}: EdgeRendererProps & { isSelected?: boolean }) {
  const sourceNode = nodes.find((n) => n.id === edge.sourceId);
  const targetNode = nodes.find((n) => n.id === edge.targetId);

  if (!sourceNode || !targetNode) return null;

  // Calculate edge positions (from right side of source to left side of target)
  const x1 = sourceNode.position.x + 64; // Half width of node (64px)
  const y1 = sourceNode.position.y;
  const x2 = targetNode.position.x - 64;
  const y2 = targetNode.position.y;

  // Control points for curved line
  const midX = (x1 + x2) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  const strokeColor = isSelected ? '#3b82f6' : (isActive ? '#22c55e' : '#64748b');
  const strokeWidth = isSelected ? 4 : (isActive ? 3 : 2); // thicker when selected

  return (
    <g>
      {/* Main edge line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={isActive ? 'transition-all duration-300' : ''}
      />

      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${x2 - 10},${y2 - 5} ${x2 - 10},${y2 + 5}`}
        fill={isActive ? '#22c55e' : '#64748b'}
      />

      {/* Animated dots for active edges */}
      {isActive && (
        <>
          <circle r="4" fill="#22c55e">
            <animateMotion
              dur="1s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
          {requestCount > 1 && (
            <circle r="4" fill="#22c55e">
              <animateMotion
                dur="1s"
                repeatCount="indefinite"
                path={path}
                begin="0.33s"
              />
            </circle>
          )}
          {requestCount > 2 && (
            <circle r="4" fill="#22c55e">
              <animateMotion
                dur="1s"
                repeatCount="indefinite"
                path={path}
                begin="0.66s"
              />
            </circle>
          )}
        </>
      )}

      {/* Request count badge */}
      {requestCount > 0 && (
        <g transform={`translate(${midX}, ${(y1 + y2) / 2 - 15})`}>
          <rect
            x="-12"
            y="-10"
            width="24"
            height="20"
            rx="4"
            fill="#1e293b"
            stroke="#475569"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
          >
            {requestCount}
          </text>
        </g>
      )}
    </g>
  );
}
