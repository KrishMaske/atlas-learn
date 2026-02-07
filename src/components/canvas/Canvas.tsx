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

// Replace entire Canvas functional component logic
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

  // Edge drag state (connection)
  const [draggedEdge, setDraggedEdge] = useState<{ sourceId: string; px: number; py: number } | null>(null);

  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    addNode,
    removeNode,
    updateNodePosition,
    selectNode,
    selectEdge,
    addEdge,
    removeEdge,
  } = useGraphStore();

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
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current || e.target === canvasRef.current?.querySelector('.grid-bg'))) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      // e.preventDefault(); // Don't prevent default here to allow focus
    }
    // Deselect if clicking empty space
    if (e.target === canvasRef.current || e.target === canvasRef.current?.querySelector('.grid-bg')) {
        selectNode(null);
        selectEdge(null);
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

      if (draggedEdge) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        setDraggedEdge({ ...draggedEdge, px: x, py: y });
      }
    },
    [isPanning, draggingNodeId, draggedEdge, dragOffset, screenToCanvas, updateNodePosition],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      setIsPanning(false);
      setDraggingNodeId(null);

      // Handle connection drop
      if (draggedEdge) {
        setDraggedEdge(null);
        // Ensure we check if we dropped ON a node (handled by mouseUp on NodeRenderer ideally,
        // but since we have global mouseup here, we rely on the fact that Node's onMouseUp
        // propagation might ideally handle it, OR we do hit testing.
        // EASIER WAY: NodeRenderer's onMouseUp fires BEFORE window's onMouseUp or bubble up.
        // Actually, we can use document.elementFromPoint if we really needed to,
        // but let's try a simpler approach: NodeRenderer onMouseUp handles the 'connect' action.
      }
    },
    [draggedEdge]
  );

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

  // ---------- Keyboard Shortcuts (Delete) ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
          // Ignore if input/textarea is focused
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

          if (selectedNodeId) {
              removeNode(selectedNodeId);
          } else if (selectedEdgeId) {
              removeEdge(selectedEdgeId);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, removeNode, removeEdge]);


  // ---------- Node interactions ----------
  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      
      // Check if clicking on a "handle" or special zone? 
      // For now, let's say Shift+Drag or dragging from a specific port triggers connection?
      // User asked for "Drag and create arrows" typically meaning drag from a handle.
      // We will assume the NodeRenderer calls a specific prop for connection start.
      
      const canvas = screenToCanvas(e.clientX, e.clientY);
      setDraggingNodeId(nodeId);
      setDragOffset({ x: node.position.x - canvas.x, y: node.position.y - canvas.y });
      selectNode(nodeId);
      selectEdge(null);
    },
    [nodes, screenToCanvas, selectNode, selectEdge],
  );

  const startConnection = useCallback((nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setDraggedEdge({ sourceId: nodeId, px: x, py: y });
  }, [screenToCanvas]);

  const completeConnection = useCallback((targetId: string, e: React.MouseEvent) => {
     if (draggedEdge) {
         e.stopPropagation(); // prevent drag end from clearing immediately before we act
         if (draggedEdge.sourceId !== targetId) {
             addEdge(draggedEdge.sourceId, targetId);
         }
         setDraggedEdge(null);
     }
  }, [draggedEdge, addEdge]);

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative bg-slate-950 overflow-hidden select-none outline-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      tabIndex={0}
    >
      {/* Grid background (moves with pan, scales with zoom) */}
      <div
        className="active-grid-bg absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

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
              <g key={edge.id} onClick={(e) => { e.stopPropagation(); selectEdge(edge.id); }} className="cursor-pointer pointer-events-auto">
                <EdgeRenderer
                  edge={edge}
                  nodes={nodes}
                  isActive={isSimulating && !!metrics}
                  requestCount={metrics?.requestCount || 0}
                  // We can pass isSelected prop if EdgeRenderer supports it
                />
                 {/* Highlight for selection */}
                 {selectedEdgeId === edge.id && (
                    <path
                        d={`M ${nodes.find(n => n.id === edge.sourceId)?.position.x! + 64} ${nodes.find(n => n.id === edge.sourceId)?.position.y} L ${nodes.find(n => n.id === edge.targetId)?.position.x! - 64} ${nodes.find(n => n.id === edge.targetId)?.position.y}`} // Approximate path for selection highlight (Curve logic is inside EdgeRenderer, ideally we refactor exposure)
                        // Actually, EdgeRenderer handles curved path calculation. Let's trust EdgeRenderer visual update for selection if we passed it down, 
                        // but since we aren't modifying EdgeRenderer prop signature in this step, let's assume we reuse the component or add a simple overlay?
                        // Better: We should have updated EdgeRenderer props to accept 'isSelected'. 
                        // Since I can't change it here without updating the component file again, I'll rely on global store or update EdgeRenderer in next step if needed.
                        // Wait, I updated EdgeRenderer in previous step? No, I just viewed it. I missed updating EdgeRenderer to accept isSelected.
                        // Correcting plan: I will update EdgeRenderer props in a subsequent call if I haven't already. 
                        // Actually, looking at my history, I only viewed it. I need to update it.
                        // For now, I'll allow clicking it to select it.
                         stroke="rgba(59, 130, 246, 0.5)"
                         strokeWidth="10"
                         fill="none"
                         className="opacity-0 hover:opacity-100 transition-opacity" // Invisible hit area
                    />
                 )}
              </g>
            );
          })}
          
          {/* Dragged Connection Line */}
          {draggedEdge && ((() => {
             const source = nodes.find(n => n.id === draggedEdge.sourceId);
             if (!source) return null;
             return (
                 <line 
                    x1={source.position.x + 64} 
                    y1={source.position.y} 
                    x2={draggedEdge.px} 
                    y2={draggedEdge.py} 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    strokeDasharray="5,5" 
                 />
             );
          })())}

        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const metrics = simulationMetrics?.get(node.id);
          return (
            <div key={node.id} className="absolute" style={{ left: 0, top: 0 }}>
                <NodeRenderer
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => selectNode(node.id)}
                  onDoubleClick={() => {}} // Double click no longer needed for connect? Keep for safety.
                  onDragStart={(e) => handleNodeDragStart(node.id, e)}
                  utilization={metrics?.utilization || 0}
                />
                
                {/* Connection Handles (Overlay on top of NodeRenderer) */}
                {/* Right Handle (Output) - Start Drag */}
                <div 
                    className="absolute w-4 h-4 bg-transparent cursor-crosshair hover:bg-blue-500/50 rounded-full"
                    style={{ left: node.position.x + 64 - 8, top: node.position.y - 8 }}
                    onMouseDown={(e) => startConnection(node.id, e)}
                />
                
                {/* Left Handle (Input) - Drop Target */}
                <div 
                    className="absolute w-6 h-6 bg-transparent rounded-full"
                    style={{ left: node.position.x - 64 - 12, top: node.position.y - 12 }}
                    onMouseUp={(e) => completeConnection(node.id, e)}
                />
            </div>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-500">
            <p className="text-lg mb-2">Drag components from the left panel</p>
            <p className="text-sm">Drag from right-side handles to connect nodes</p>
             <p className="text-sm">Select and press Delete to remove items</p>
          </div>
        </div>
      )}
    </div>
  );
}
