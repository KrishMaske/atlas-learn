'use client';

import { useRef, useState, useCallback } from 'react';
import { NodeType } from '@/core/types';
import { useGraphStore } from '@/core/graph/graphStore';
import NodeRenderer from './NodeRenderer';
import EdgeRenderer from './EdgeRenderer';

// -----------------------------------------------------------------------------
// Canvas Component
// -----------------------------------------------------------------------------

interface CanvasProps {
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, type: NodeType) => void;
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
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const { nodes, edges, selectedNodeId, addNode, updateNodePosition, selectNode, addEdge } = useGraphStore();

  // Handle dropping a new node from palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addNode(draggedNodeType, { x, y });
  };

  // Handle dragging existing nodes
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNodeId) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    updateNodePosition(draggingNodeId, { x: newX, y: newY });
  }, [draggingNodeId, dragOffset, updateNodePosition]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  // Handle edge creation (double-click to start, click another node to connect)
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(nodeId);
    } else if (connectingFrom !== nodeId) {
      addEdge(connectingFrom, nodeId);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
    }
  }, [connectingFrom, addEdge]);

  // Deselect when clicking canvas background
  const handleCanvasClick = () => {
    selectNode(null);
    setConnectingFrom(null);
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative bg-slate-950 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Connection mode indicator */}
      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/80 text-white px-4 py-2 rounded-full text-sm z-50">
          Click another node to connect
        </div>
      )}

      {/* SVG layer for edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
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

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <p className="text-lg mb-2">Drag components from the left panel</p>
            <p className="text-sm">Double-click nodes to connect them</p>
          </div>
        </div>
      )}
    </div>
  );
}
