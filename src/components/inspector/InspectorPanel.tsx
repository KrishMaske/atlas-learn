'use client';

import { useGraphStore } from '@/core/graph/graphStore';
import { NodeType, ClientConfig, ApiConfig, DatabaseConfig, CacheConfig, QueueConfig, WorkerConfig } from '@/core/types';

// -----------------------------------------------------------------------------
// Slider Component
// -----------------------------------------------------------------------------

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange }: SliderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Config Forms per Node Type
// -----------------------------------------------------------------------------

function ClientConfigForm({ config, onChange }: { config: ClientConfig; onChange: (c: Partial<ClientConfig>) => void }) {
  return (
    <>
      <Slider label="Requests/sec" value={config.rps} min={10} max={1000} step={10} unit=" RPS" onChange={(v) => onChange({ rps: v })} />
      <Slider label="Burst Multiplier" value={config.burstMultiplier} min={1} max={5} step={0.5} unit="x" onChange={(v) => onChange({ burstMultiplier: v })} />
    </>
  );
}

function ApiConfigForm({ config, onChange }: { config: ApiConfig; onChange: (c: Partial<ApiConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={100} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={10} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
    </>
  );
}

function DatabaseConfigForm({ config, onChange }: { config: DatabaseConfig; onChange: (c: Partial<DatabaseConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={20} max={200} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={10} max={200} step={5} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Connections" value={config.maxConnections} min={10} max={100} step={5} onChange={(v) => onChange({ maxConnections: v })} />
    </>
  );
}

function CacheConfigForm({ config, onChange }: { config: CacheConfig; onChange: (c: Partial<CacheConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={1000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Hit Rate" value={config.hitRate * 100} min={0} max={100} step={5} unit="%" onChange={(v) => onChange({ hitRate: v / 100 })} />
      <Slider label="TTL" value={config.ttl} min={30} max={600} step={30} unit="s" onChange={(v) => onChange({ ttl: v })} />
    </>
  );
}

function QueueConfigForm({ config, onChange }: { config: QueueConfig; onChange: (c: Partial<QueueConfig>) => void }) {
  return (
    <>
      <Slider label="Max Size" value={config.maxSize} min={100} max={5000} step={100} onChange={(v) => onChange({ maxSize: v })} />
      <div className="mb-4">
        <label className="text-slate-400 text-sm block mb-2">Drop Policy</label>
        <select
          value={config.dropPolicy}
          onChange={(e) => onChange({ dropPolicy: e.target.value as QueueConfig['dropPolicy'] })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="REJECT_NEW">Reject New</option>
          <option value="DROP_OLDEST">Drop Oldest</option>
        </select>
      </div>
    </>
  );
}

function WorkerConfigForm({ config, onChange }: { config: WorkerConfig; onChange: (c: Partial<WorkerConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={10} max={200} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Processing Time" value={config.baseLatency} min={50} max={500} step={10} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Concurrency" value={config.concurrency} min={1} max={16} step={1} onChange={(v) => onChange({ concurrency: v })} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Inspector Panel
// -----------------------------------------------------------------------------

export default function InspectorPanel() {
  const { selectedNodeId, nodes, updateNodeConfig, removeNode } = useGraphStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-72 bg-slate-900/80 backdrop-blur-sm border-l border-slate-700/50 p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Inspector
        </h2>
        <p className="text-slate-500 text-sm">Select a node to configure</p>
      </div>
    );
  }

  const handleConfigChange = (config: Partial<typeof selectedNode.config>) => {
    updateNodeConfig(selectedNode.id, config);
  };

  const renderConfigForm = () => {
    switch (selectedNode.type as NodeType) {
      case 'CLIENT':
        return <ClientConfigForm config={selectedNode.config as ClientConfig} onChange={handleConfigChange} />;
      case 'API':
        return <ApiConfigForm config={selectedNode.config as ApiConfig} onChange={handleConfigChange} />;
      case 'DATABASE':
        return <DatabaseConfigForm config={selectedNode.config as DatabaseConfig} onChange={handleConfigChange} />;
      case 'CACHE':
        return <CacheConfigForm config={selectedNode.config as CacheConfig} onChange={handleConfigChange} />;
      case 'QUEUE':
        return <QueueConfigForm config={selectedNode.config as QueueConfig} onChange={handleConfigChange} />;
      case 'WORKER':
        return <WorkerConfigForm config={selectedNode.config as WorkerConfig} onChange={handleConfigChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-72 bg-slate-900/80 backdrop-blur-sm border-l border-slate-700/50 p-4 flex flex-col">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Inspector
      </h2>

      {/* Node Info */}
      <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
        <h3 className="text-white font-medium mb-1">{selectedNode.label}</h3>
        <p className="text-slate-400 text-xs font-mono">{selectedNode.id}</p>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto">
        {renderConfigForm()}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => removeNode(selectedNode.id)}
        className="mt-4 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
      >
        Delete Node
      </button>
    </div>
  );
}
