'use client';

import { Metrics } from '@/core/sim/metrics';

// -----------------------------------------------------------------------------
// Metric Card
// -----------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'bad' | 'neutral';
}

function MetricCard({ label, value, unit = '', status = 'neutral' }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-400 border-green-500/30',
    warning: 'text-yellow-400 border-yellow-500/30',
    bad: 'text-red-400 border-red-500/30',
    neutral: 'text-slate-300 border-slate-600/30',
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg p-3 border ${statusColors[status]}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${statusColors[status].split(' ')[0]}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Metrics Panel
// -----------------------------------------------------------------------------

interface MetricsPanelProps {
  metrics: Metrics | null;
  tick: number;
}

export default function MetricsPanel({ metrics, tick }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 p-4">
        <div className="flex items-center justify-center gap-4 text-slate-500">
          <span>Run simulation to see metrics</span>
        </div>
      </div>
    );
  }

  // Determine status based on thresholds
  const latencyStatus = 
    metrics.p95Latency < 100 ? 'good' :
    metrics.p95Latency < 300 ? 'warning' : 'bad';

  const errorStatus =
    metrics.errorRate < 0.01 ? 'good' :
    metrics.errorRate < 0.05 ? 'warning' : 'bad';

  const throughputStatus =
    metrics.throughput > 100 ? 'good' :
    metrics.throughput > 50 ? 'warning' : 'neutral';

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Metrics
        </h2>
        <span className="text-xs text-slate-500 font-mono">
          Tick: {tick}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Throughput"
          value={metrics.throughput}
          unit="RPS"
          status={throughputStatus}
        />
        <MetricCard
          label="p50 Latency"
          value={metrics.p50Latency}
          unit="ms"
          status="neutral"
        />
        <MetricCard
          label="p95 Latency"
          value={metrics.p95Latency}
          unit="ms"
          status={latencyStatus}
        />
        <MetricCard
          label="Error Rate"
          value={(metrics.errorRate * 100).toFixed(2)}
          unit="%"
          status={errorStatus}
        />
        <MetricCard
          label="Completed"
          value={metrics.completedRequests}
          status="neutral"
        />
        <MetricCard
          label="Dropped"
          value={metrics.droppedRequests}
          status={metrics.droppedRequests > 0 ? 'bad' : 'neutral'}
        />
      </div>

      {/* Status Bar */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        {metrics.p95Latency > 300 && (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
            ⚠️ High Latency
          </span>
        )}
        {metrics.errorRate > 0.05 && (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
            ⚠️ High Error Rate
          </span>
        )}
        {metrics.droppedRequests > 0 && (
          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
            📉 Requests Dropped
          </span>
        )}
        {metrics.p95Latency < 100 && metrics.errorRate < 0.01 && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
            ✓ System Healthy
          </span>
        )}
      </div>
    </div>
  );
}
