'use client';

import { useGraphStore } from '@/core/graph/graphStore';
import {
  NodeType,
  ClientConfig,
  ApiConfig,
  DatabaseConfig,
  CacheConfig,
  QueueConfig,
  WorkerConfig,
  LoadBalancerConfig,
  ApiGatewayConfig,
  RateLimiterConfig,
  RestApiConfig,
  GraphqlApiConfig,
  AuthServiceConfig,
  RedisCacheConfig,
  SqlDatabaseConfig,
  NosqlDatabaseConfig,
  ObjectStorageConfig,
  StreamProcessorConfig,
  BatchProcessorConfig,
  AnalyticsSinkConfig,
  CustomLogicConfig,
  NODE_VISUALS,
} from '@/core/types';

// =============================================================================
// Inspector Panel — configures the selected node
// =============================================================================

// --------------- Reusable controls ---------------

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono text-xs">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-slate-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-slate-600'}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transform transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-slate-400 text-sm block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm border border-slate-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-slate-400 text-sm block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm border border-slate-600"
      />
    </div>
  );
}

// --------------- Config forms per node type ---------------

function ClientForm({ config, onChange }: { config: ClientConfig; onChange: (c: Partial<ClientConfig>) => void }) {
  return (
    <>
      <Slider label="Requests/sec" value={config.rps} min={10} max={2000} step={10} unit=" RPS" onChange={(v) => onChange({ rps: v })} />
      <Slider label="Burst Multiplier" value={config.burstMultiplier} min={1} max={10} step={0.5} unit="x" onChange={(v) => onChange({ burstMultiplier: v })} />
    </>
  );
}

function LoadBalancerForm({ config, onChange }: { config: LoadBalancerConfig; onChange: (c: Partial<LoadBalancerConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={5000} step={100} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={50} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <SelectField label="Algorithm" value={config.algorithm} options={[
        { value: 'ROUND_ROBIN', label: 'Round Robin' },
        { value: 'LEAST_CONNECTIONS', label: 'Least Connections' },
        { value: 'RANDOM', label: 'Random' },
        { value: 'IP_HASH', label: 'IP Hash' },
      ]} onChange={(v) => onChange({ algorithm: v })} />
      <Slider label="Health Check" value={config.healthCheckIntervalMs} min={1000} max={30000} step={1000} unit="ms" onChange={(v) => onChange({ healthCheckIntervalMs: v })} />
    </>
  );
}

function ApiGatewayForm({ config, onChange }: { config: ApiGatewayConfig; onChange: (c: Partial<ApiGatewayConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={2000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={50} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Toggle label="Auth Enabled" value={config.authEnabled} onChange={(v) => onChange({ authEnabled: v })} />
      <Toggle label="Rate Limiting" value={config.rateLimitEnabled} onChange={(v) => onChange({ rateLimitEnabled: v })} />
      <Toggle label="CORS" value={config.corsEnabled} onChange={(v) => onChange({ corsEnabled: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={10} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
    </>
  );
}

function RateLimiterForm({ config, onChange }: { config: RateLimiterConfig; onChange: (c: Partial<RateLimiterConfig>) => void }) {
  return (
    <>
      <Slider label="Max Requests" value={config.maxRequests} min={10} max={1000} step={10} onChange={(v) => onChange({ maxRequests: v })} />
      <Slider label="Window" value={config.windowMs / 1000} min={1} max={300} step={1} unit="s" onChange={(v) => onChange({ windowMs: v * 1000 })} />
      <Slider label="Capacity" value={config.capacity} min={100} max={5000} step={100} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
    </>
  );
}

function RestApiForm({ config, onChange }: { config: RestApiConfig; onChange: (c: Partial<RestApiConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={1000} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={200} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <SelectField label="Method" value={config.method} options={[
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ]} onChange={(v) => onChange({ method: v })} />
      <TextInput label="Path" value={config.path} onChange={(v) => onChange({ path: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={20} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
    </>
  );
}

function GraphqlApiForm({ config, onChange }: { config: GraphqlApiConfig; onChange: (c: Partial<GraphqlApiConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={5} max={100} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Depth" value={config.maxDepth} min={1} max={20} step={1} onChange={(v) => onChange({ maxDepth: v })} />
      <Slider label="Max Complexity" value={config.maxComplexity} min={10} max={500} step={10} onChange={(v) => onChange({ maxComplexity: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={10} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
    </>
  );
}

function AuthServiceForm({ config, onChange }: { config: AuthServiceConfig; onChange: (c: Partial<AuthServiceConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={1000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={5} max={100} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Token TTL" value={config.tokenTTL} min={60} max={86400} step={60} unit="s" onChange={(v) => onChange({ tokenTTL: v })} />
      <SelectField label="Algorithm" value={config.algorithm} options={[
        { value: 'JWT', label: 'JWT' },
        { value: 'OAuth2', label: 'OAuth 2.0' },
      ]} onChange={(v) => onChange({ algorithm: v })} />
    </>
  );
}

function ApiForm({ config, onChange }: { config: ApiConfig; onChange: (c: Partial<ApiConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={100} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={10} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
    </>
  );
}

function CacheForm({ config, onChange }: { config: CacheConfig; onChange: (c: Partial<CacheConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={2000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Hit Rate" value={config.hitRate * 100} min={0} max={100} step={5} unit="%" onChange={(v) => onChange({ hitRate: v / 100 })} />
      <Slider label="TTL" value={config.ttl} min={30} max={3600} step={30} unit="s" onChange={(v) => onChange({ ttl: v })} />
    </>
  );
}

function RedisCacheForm({ config, onChange }: { config: RedisCacheConfig; onChange: (c: Partial<RedisCacheConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={5000} step={100} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={20} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Hit Rate" value={config.hitRate * 100} min={0} max={100} step={5} unit="%" onChange={(v) => onChange({ hitRate: v / 100 })} />
      <Slider label="TTL" value={config.ttl} min={30} max={3600} step={30} unit="s" onChange={(v) => onChange({ ttl: v })} />
      <Slider label="Max Memory" value={config.maxMemoryMB} min={64} max={4096} step={64} unit="MB" onChange={(v) => onChange({ maxMemoryMB: v })} />
      <SelectField label="Eviction Policy" value={config.evictionPolicy} options={[
        { value: 'LRU', label: 'LRU (Least Recently Used)' },
        { value: 'LFU', label: 'LFU (Least Frequently Used)' },
        { value: 'RANDOM', label: 'Random' },
        { value: 'TTL', label: 'TTL (Volatile)' },
      ]} onChange={(v) => onChange({ evictionPolicy: v })} />
    </>
  );
}

function DatabaseForm({ config, onChange }: { config: DatabaseConfig; onChange: (c: Partial<DatabaseConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={20} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={10} max={200} step={5} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Connections" value={config.maxConnections} min={10} max={200} step={5} onChange={(v) => onChange({ maxConnections: v })} />
    </>
  );
}

function SqlDatabaseForm({ config, onChange }: { config: SqlDatabaseConfig; onChange: (c: Partial<SqlDatabaseConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={20} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={5} max={200} step={5} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Connections" value={config.maxConnections} min={10} max={200} step={5} onChange={(v) => onChange({ maxConnections: v })} />
      <Slider label="Pool Size" value={config.poolSize} min={5} max={100} step={5} onChange={(v) => onChange({ poolSize: v })} />
      <SelectField label="Engine" value={config.engine} options={[
        { value: 'POSTGRES', label: 'PostgreSQL' },
        { value: 'MYSQL', label: 'MySQL' },
        { value: 'SQLITE', label: 'SQLite' },
      ]} onChange={(v) => onChange({ engine: v })} />
    </>
  );
}

function NosqlDatabaseForm({ config, onChange }: { config: NosqlDatabaseConfig; onChange: (c: Partial<NosqlDatabaseConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={1000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={5} max={100} step={5} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Connections" value={config.maxConnections} min={10} max={500} step={10} onChange={(v) => onChange({ maxConnections: v })} />
      <Slider label="Replica Count" value={config.replicaCount} min={1} max={7} step={1} onChange={(v) => onChange({ replicaCount: v })} />
      <SelectField label="Engine" value={config.engine} options={[
        { value: 'MONGODB', label: 'MongoDB' },
        { value: 'DYNAMODB', label: 'DynamoDB' },
        { value: 'CASSANDRA', label: 'Cassandra' },
      ]} onChange={(v) => onChange({ engine: v })} />
    </>
  );
}

function ObjectStorageForm({ config, onChange }: { config: ObjectStorageConfig; onChange: (c: Partial<ObjectStorageConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={50} max={2000} step={50} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={10} max={500} step={10} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Max Object Size" value={config.maxObjectSizeMB} min={1} max={5000} step={10} unit="MB" onChange={(v) => onChange({ maxObjectSizeMB: v })} />
      <TextInput label="Region" value={config.region} onChange={(v) => onChange({ region: v })} />
    </>
  );
}

function QueueForm({ config, onChange }: { config: QueueConfig; onChange: (c: Partial<QueueConfig>) => void }) {
  return (
    <>
      <Slider label="Max Size" value={config.maxSize} min={100} max={10000} step={100} onChange={(v) => onChange({ maxSize: v })} />
      <SelectField label="Drop Policy" value={config.dropPolicy} options={[
        { value: 'REJECT_NEW', label: 'Reject New' },
        { value: 'DROP_OLDEST', label: 'Drop Oldest' },
      ]} onChange={(v) => onChange({ dropPolicy: v })} />
    </>
  );
}

function WorkerForm({ config, onChange }: { config: WorkerConfig; onChange: (c: Partial<WorkerConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={10} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Processing Time" value={config.baseLatency} min={10} max={2000} step={10} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Concurrency" value={config.concurrency} min={1} max={32} step={1} onChange={(v) => onChange({ concurrency: v })} />
    </>
  );
}

function StreamProcessorForm({ config, onChange }: { config: StreamProcessorConfig; onChange: (c: Partial<StreamProcessorConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={5000} step={100} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={50} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Partitions" value={config.partitions} min={1} max={32} step={1} onChange={(v) => onChange({ partitions: v })} />
      <TextInput label="Consumer Group" value={config.consumerGroup} onChange={(v) => onChange({ consumerGroup: v })} />
    </>
  );
}

function BatchProcessorForm({ config, onChange }: { config: BatchProcessorConfig; onChange: (c: Partial<BatchProcessorConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={10} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Processing Time" value={config.baseLatency} min={50} max={5000} step={50} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Batch Size" value={config.batchSize} min={10} max={500} step={10} onChange={(v) => onChange({ batchSize: v })} />
      <Slider label="Schedule Interval" value={config.scheduleIntervalMs / 1000} min={1} max={300} step={1} unit="s" onChange={(v) => onChange({ scheduleIntervalMs: v * 1000 })} />
    </>
  );
}

function AnalyticsSinkForm({ config, onChange }: { config: AnalyticsSinkConfig; onChange: (c: Partial<AnalyticsSinkConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={100} max={5000} step={100} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={50} step={1} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Flush Interval" value={config.flushIntervalMs / 1000} min={1} max={60} step={1} unit="s" onChange={(v) => onChange({ flushIntervalMs: v * 1000 })} />
      <Slider label="Buffer Size" value={config.bufferSize} min={50} max={5000} step={50} onChange={(v) => onChange({ bufferSize: v })} />
    </>
  );
}

function CustomLogicForm({ config, onChange }: { config: CustomLogicConfig; onChange: (c: Partial<CustomLogicConfig>) => void }) {
  return (
    <>
      <Slider label="Capacity" value={config.capacity} min={10} max={500} step={10} unit=" RPS" onChange={(v) => onChange({ capacity: v })} />
      <Slider label="Base Latency" value={config.baseLatency} min={1} max={500} step={5} unit="ms" onChange={(v) => onChange({ baseLatency: v })} />
      <Slider label="Error Rate" value={config.errorRate * 100} min={0} max={20} step={0.5} unit="%" onChange={(v) => onChange({ errorRate: v / 100 })} />
      <div className="mb-3">
        <label className="text-slate-400 text-sm block mb-1">Logic Description</label>
        <textarea
          value={config.code}
          onChange={(e) => onChange({ code: e.target.value })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono border border-slate-600 h-20 resize-none"
        />
      </div>
    </>
  );
}

// --------------- Main Inspector ---------------

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

  const visual = NODE_VISUALS[selectedNode.type];
  const handleChange = (config: Record<string, unknown>) => {
    updateNodeConfig(selectedNode.id, config);
  };

  const renderForm = () => {
    const t = selectedNode.type as NodeType;
    const c = selectedNode.config;
    switch (t) {
      case 'CLIENT':          return <ClientForm config={c as ClientConfig} onChange={handleChange} />;
      case 'LOAD_BALANCER':   return <LoadBalancerForm config={c as LoadBalancerConfig} onChange={handleChange} />;
      case 'API_GATEWAY':     return <ApiGatewayForm config={c as ApiGatewayConfig} onChange={handleChange} />;
      case 'RATE_LIMITER':    return <RateLimiterForm config={c as RateLimiterConfig} onChange={handleChange} />;
      case 'REST_API':        return <RestApiForm config={c as RestApiConfig} onChange={handleChange} />;
      case 'GRAPHQL_API':     return <GraphqlApiForm config={c as GraphqlApiConfig} onChange={handleChange} />;
      case 'AUTH_SERVICE':    return <AuthServiceForm config={c as AuthServiceConfig} onChange={handleChange} />;
      case 'API':             return <ApiForm config={c as ApiConfig} onChange={handleChange} />;
      case 'CACHE':           return <CacheForm config={c as CacheConfig} onChange={handleChange} />;
      case 'REDIS_CACHE':     return <RedisCacheForm config={c as RedisCacheConfig} onChange={handleChange} />;
      case 'DATABASE':        return <DatabaseForm config={c as DatabaseConfig} onChange={handleChange} />;
      case 'SQL_DATABASE':    return <SqlDatabaseForm config={c as SqlDatabaseConfig} onChange={handleChange} />;
      case 'NOSQL_DATABASE':  return <NosqlDatabaseForm config={c as NosqlDatabaseConfig} onChange={handleChange} />;
      case 'OBJECT_STORAGE':  return <ObjectStorageForm config={c as ObjectStorageConfig} onChange={handleChange} />;
      case 'QUEUE':           return <QueueForm config={c as QueueConfig} onChange={handleChange} />;
      case 'WORKER':          return <WorkerForm config={c as WorkerConfig} onChange={handleChange} />;
      case 'STREAM_PROCESSOR': return <StreamProcessorForm config={c as StreamProcessorConfig} onChange={handleChange} />;
      case 'BATCH_PROCESSOR': return <BatchProcessorForm config={c as BatchProcessorConfig} onChange={handleChange} />;
      case 'ANALYTICS_SINK':  return <AnalyticsSinkForm config={c as AnalyticsSinkConfig} onChange={handleChange} />;
      case 'CUSTOM_LOGIC':    return <CustomLogicForm config={c as CustomLogicConfig} onChange={handleChange} />;
      default:                return null;
    }
  };

  return (
    <div className="w-72 bg-slate-900/80 backdrop-blur-sm border-l border-slate-700/50 p-4 flex flex-col">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Inspector
      </h2>

      {/* Node Info */}
      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">{visual?.icon}</span>
        <div className="min-w-0">
          <h3 className="text-white font-medium text-sm truncate">{selectedNode.label}</h3>
          <p className="text-slate-500 text-[10px] font-mono">{selectedNode.id}</p>
        </div>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto">{renderForm()}</div>

      {/* Delete Button */}
      <button
        onClick={() => removeNode(selectedNode.id)}
        className="mt-4 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
      >
        Delete Node
      </button>
    </div>
  );
}
