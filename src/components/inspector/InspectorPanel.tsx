'use client';

import { useGraphStore } from '@/core/graph/graphStore';
import {
  NodeType,
  ContextConfig,
  RestApiConfig,
  GraphqlApiConfig,
  RedisCacheConfig,
  SqlDatabaseConfig,
  NosqlDatabaseConfig,
  ObjectStorageConfig,
  SupabaseConfig,
  FirebaseConfig,
  GithubConfig,
  FunctionConfig,
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
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono text-xs">
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
        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
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
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <div
          className={`w-4 h-4 bg-background rounded-full transform transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
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
      <label className="text-muted-foreground text-sm block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
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
      <label className="text-muted-foreground text-sm block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// --------------- Config forms per node type ---------------

function ContextForm({ config, onChange }: { config: ContextConfig; onChange: (c: Partial<ContextConfig>) => void }) {
  return (
    <div className="mb-3">
      <label className="text-muted-foreground text-sm block mb-1">System Context / Prompt</label>
      <textarea
        value={config.context}
        onChange={(e) => onChange({ context: e.target.value })}
        className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-xs font-mono border border-border h-32 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Describe the high-level purpose of this system..."
      />
    </div>
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

function SupabaseForm({ config, onChange }: { config: SupabaseConfig; onChange: (c: Partial<SupabaseConfig>) => void }) {
  const toggleFeature = (f: 'AUTH' | 'DB' | 'STORAGE' | 'EDGE') => {
    const features = config.features.includes(f)
      ? config.features.filter((x) => x !== f)
      : [...config.features, f];
    onChange({ features });
  };
  return (
    <>
      <div className="mb-4 space-y-2">
        <label className="text-muted-foreground text-sm block mb-1">Features</label>
        {['AUTH', 'DB', 'STORAGE', 'EDGE'].map((f) => (
          <Toggle
            key={f}
            label={f}
            value={config.features.includes(f as any)}
            onChange={() => toggleFeature(f as any)}
          />
        ))}
      </div>
      <TextInput label="Project URL" value={config.url || ''} onChange={(v) => onChange({ url: v })} />
      <TextInput label="Anon Key" value={config.key || ''} onChange={(v) => onChange({ key: v })} />
    </>
  );
}

function FirebaseForm({ config, onChange }: { config: FirebaseConfig; onChange: (c: Partial<FirebaseConfig>) => void }) {
  const toggleFeature = (f: 'AUTH' | 'FIRESTORE' | 'STORAGE' | 'FUNCTIONS') => {
    const features = config.features.includes(f)
      ? config.features.filter((x) => x !== f)
      : [...config.features, f];
    onChange({ features });
  };
  return (
    <>
      <div className="mb-4 space-y-2">
        <label className="text-muted-foreground text-sm block mb-1">Features</label>
        {['AUTH', 'FIRESTORE', 'STORAGE', 'FUNCTIONS'].map((f) => (
          <Toggle
            key={f}
            label={f}
            value={config.features.includes(f as any)}
            onChange={() => toggleFeature(f as any)}
          />
        ))}
      </div>
      <TextInput label="Project ID" value={(config as any).projectId || ''} onChange={(v) => onChange({ projectId: v } as any)} />
      <TextInput label="API Key" value={(config as any).apiKey || ''} onChange={(v) => onChange({ apiKey: v } as any)} />
    </>
  );
}

function GithubForm({ config, onChange }: { config: GithubConfig; onChange: (c: Partial<GithubConfig>) => void }) {
  return (
    <>
      <TextInput label="Repository" value={config.repo} onChange={(v) => onChange({ repo: v })} />
      <TextInput label="Branch" value={config.branch} onChange={(v) => onChange({ branch: v })} />
      <Toggle label="Enable Actions" value={config.actions} onChange={(v) => onChange({ actions: v })} />
    </>
  );
}

function FunctionForm({ config, onChange }: { config: FunctionConfig; onChange: (c: Partial<FunctionConfig>) => void }) {
  return (
    <>
      <SelectField label="Language" value={config.language} options={[
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'go', label: 'Go' },
      ]} onChange={(v) => onChange({ language: v })} />
      <div className="mb-3">
        <label className="text-muted-foreground text-sm block mb-1">Code</label>
        <textarea
          value={config.code}
          onChange={(e) => onChange({ code: e.target.value })}
          className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-xs font-mono border border-border h-40 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
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
      <div className="w-72 bg-card/80 backdrop-blur-md border-l border-border p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Inspector
        </h2>
        <p className="text-muted-foreground text-sm">Select a node to configure</p>
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
      case 'CONTEXT': return <ContextForm config={c as ContextConfig} onChange={handleChange} />;
      case 'REST_API': return <RestApiForm config={c as RestApiConfig} onChange={handleChange} />;
      case 'GRAPHQL_API': return <GraphqlApiForm config={c as GraphqlApiConfig} onChange={handleChange} />;
      case 'REDIS_CACHE': return <RedisCacheForm config={c as RedisCacheConfig} onChange={handleChange} />;
      case 'SQL_DATABASE': return <SqlDatabaseForm config={c as SqlDatabaseConfig} onChange={handleChange} />;
      case 'NOSQL_DATABASE': return <NosqlDatabaseForm config={c as NosqlDatabaseConfig} onChange={handleChange} />;
      case 'OBJECT_STORAGE': return <ObjectStorageForm config={c as ObjectStorageConfig} onChange={handleChange} />;
      case 'SUPABASE': return <SupabaseForm config={c as SupabaseConfig} onChange={handleChange} />;
      case 'FIREBASE': return <FirebaseForm config={c as FirebaseConfig} onChange={handleChange} />;
      case 'GITHUB': return <GithubForm config={c as GithubConfig} onChange={handleChange} />;
      case 'FUNCTION': return <FunctionForm config={c as FunctionConfig} onChange={handleChange} />;
      default: return null;
    }
  };

  return (
    <div className="w-72 bg-card/80 backdrop-blur-md border-l border-border p-4 flex flex-col">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Inspector
      </h2>

      {/* Node Info */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4 flex items-center gap-3 border border-border">
        <span className="text-2xl">{visual?.icon}</span>
        <div className="min-w-0">
          <h3 className="text-foreground font-medium text-sm truncate">{selectedNode.label}</h3>
          <p className="text-muted-foreground text-[10px] font-mono">{selectedNode.id}</p>
        </div>
      </div>

      {/* Job Spec / Description */}
      {!['CONTEXT'].includes(selectedNode.type) && (
        <div className="mb-4">
          <label className="text-muted-foreground text-sm block mb-1">Job Description</label>
          <textarea
            value={(selectedNode.config as any).jobSpec || ''}
            onChange={(e) => handleChange({ jobSpec: e.target.value })}
            placeholder="Describe what this node does..."
            className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-xs font-mono border border-border h-16 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto">{renderForm()}</div>

      {/* Delete Button */}
      <button
        onClick={() => removeNode(selectedNode.id)}
        className="mt-4 w-full py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
      >
        Delete Node
      </button>
    </div>
  );
}
