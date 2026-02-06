'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { NodeType } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';
import NodeRenderer from './NodeRenderer';
import EdgeRenderer from './EdgeRenderer';

// =============================================================================
// Canvas — pan + zoom + snap-to-grid SVG/HTML canvas
// =============================================================================

const GRID_SIZE = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

interface CanvasProps {
  draggedNodeType: NodeType | null;
  simulationMetrics?: Map<string, { utilization: number; requestCount: number }>;
  isSimulating?: boolean;
}

export default function Canvas({
  draggedNodeType,
  simulationMetrics,
  isSimulating = false,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Pan + zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Node drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Edge creation state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const { nodes, edges, selectedNodeId, addNode, updateNodePosition, selectNode, addEdge } =
    useGraphStore();

  // Convert screen coords to canvas coords (accounting for pan + zoom)
  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: sx, y: sy };
      return {
        x: (sx - rect.left - pan.x) / zoom,
        y: (sy - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  // ---------- Drop new node from palette ----------
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    addNode(draggedNodeType, { x: snapToGrid(x), y: snapToGrid(y) });
  };

  // ---------- Pan ----------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start pan on middle-click or when clicking the background
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current?.firstChild)) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
        return;
      }

      if (draggingNodeId) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        updateNodePosition(draggingNodeId, {
          x: snapToGrid(x + dragOffset.x),
          y: snapToGrid(y + dragOffset.y),
        });
      }
    },
    [isPanning, draggingNodeId, dragOffset, screenToCanvas, updateNodePosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // ---------- Zoom (scroll wheel) ----------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---------- Node interactions ----------
  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const canvas = screenToCanvas(e.clientX, e.clientY);
      setDraggingNodeId(nodeId);
      setDragOffset({ x: node.position.x - canvas.x, y: node.position.y - canvas.y });
    },
    [nodes, screenToCanvas],
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      if (connectingFrom === null) {
        setConnectingFrom(nodeId);
      } else if (connectingFrom !== nodeId) {
        addEdge(connectingFrom, nodeId);
        setConnectingFrom(null);
      } else {
        setConnectingFrom(null);
      }
    },
    [connectingFrom, addEdge],
  );

  const handleCanvasClick = () => {
    selectNode(null);
    setConnectingFrom(null);
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative bg-slate-950 overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Grid background (moves with pan, scales with zoom) */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Connection mode indicator */}
      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/80 text-white px-4 py-2 rounded-full text-sm z-50">
          Click another node to connect &middot; ESC to cancel
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-400">
        <button
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(MIN_ZOOM, z - 0.1)); }}
          className="hover:text-white transition-colors"
        >
          −
        </button>
        <span className="font-mono w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
        <button
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(MAX_ZOOM, z + 0.1)); }}
          className="hover:text-white transition-colors"
        >
          +
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="ml-1 hover:text-white transition-colors"
          title="Reset view"
        >
          ⌂
        </button>
      </div>

      {/* Transformed layer — apply pan + zoom */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG layer for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {edges.map((edge) => {
            const metrics = simulationMetrics?.get(edge.sourceId);
            return (
              <EdgeRenderer
                key={edge.id}
                edge={edge}
                nodes={nodes}
                isActive={isSimulating && !!metrics}
                requestCount={metrics?.requestCount || 0}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const metrics = simulationMetrics?.get(node.id);
          return (
            <NodeRenderer
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id || connectingFrom === node.id}
              onSelect={() => {
                if (connectingFrom !== null) {
                  handleNodeDoubleClick(node.id);
                } else {
                  selectNode(node.id);
                }
              }}
              onDoubleClick={() => handleNodeDoubleClick(node.id)}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              utilization={metrics?.utilization || 0}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-500">
            <p className="text-lg mb-2">Drag components from the left panel</p>
            <p className="text-sm">Double-click nodes to connect them</p>
            <p className="text-xs mt-2 text-slate-600">Scroll to zoom &middot; Middle-click to pan</p>
          </div>
        </div>
      )}
    </div>
  );
}
