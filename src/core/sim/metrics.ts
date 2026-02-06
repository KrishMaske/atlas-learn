// =============================================================================
// Atlas Learn - Metrics Calculator
// =============================================================================

import { SimRequest } from './models';

// -----------------------------------------------------------------------------
// Latency Percentile Calculator
// -----------------------------------------------------------------------------

export function calculatePercentile(latencies: number[], percentile: number): number {
  if (latencies.length === 0) return 0;
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// -----------------------------------------------------------------------------
// Global Metrics
// -----------------------------------------------------------------------------

export interface Metrics {
  throughput: number;      // requests/sec completed
  errorRate: number;       // 0-1
  p50Latency: number;      // ms
  p95Latency: number;      // ms
  dropRate: number;        // 0-1
  totalRequests: number;
  completedRequests: number;
  erroredRequests: number;
  droppedRequests: number;
}

export function calculateMetrics(
  completedRequests: SimRequest[],
  tickCount: number
): Metrics {
  if (completedRequests.length === 0) {
    return {
      throughput: 0,
      errorRate: 0,
      p50Latency: 0,
      p95Latency: 0,
      dropRate: 0,
      totalRequests: 0,
      completedRequests: 0,
      erroredRequests: 0,
      droppedRequests: 0,
    };
  }

  const successful = completedRequests.filter((r) => r.status === 'SUCCESS');
  const errored = completedRequests.filter((r) => r.status === 'ERROR');
  const dropped = completedRequests.filter((r) => r.status === 'DROPPED');

  const latencies = successful.map((r) => r.latency);

  // Convert ticks to seconds (1 tick = 100ms)
  const seconds = tickCount / 10;

  return {
    throughput: seconds > 0 ? successful.length / seconds : 0,
    errorRate: completedRequests.length > 0 ? errored.length / completedRequests.length : 0,
    p50Latency: calculatePercentile(latencies, 50),
    p95Latency: calculatePercentile(latencies, 95),
    dropRate: completedRequests.length > 0 ? dropped.length / completedRequests.length : 0,
    totalRequests: completedRequests.length,
    completedRequests: successful.length,
    erroredRequests: errored.length,
    droppedRequests: dropped.length,
  };
}

// -----------------------------------------------------------------------------
// Rolling Window Metrics (for live updates)
// -----------------------------------------------------------------------------

export class RollingMetrics {
  private windowSize: number;
  private latencies: number[] = [];
  private errors: number = 0;
  private drops: number = 0;
  private total: number = 0;

  constructor(windowSize: number = 100) {
    this.windowSize = windowSize;
  }

  addRequest(request: SimRequest) {
    if (request.status === 'SUCCESS') {
      this.latencies.push(request.latency);
      if (this.latencies.length > this.windowSize) {
        this.latencies.shift();
      }
    } else if (request.status === 'ERROR') {
      this.errors++;
    } else if (request.status === 'DROPPED') {
      this.drops++;
    }
    this.total++;
  }

  getMetrics(): { p50: number; p95: number; errorRate: number } {
    return {
      p50: calculatePercentile(this.latencies, 50),
      p95: calculatePercentile(this.latencies, 95),
      errorRate: this.total > 0 ? this.errors / this.total : 0,
    };
  }

  reset() {
    this.latencies = [];
    this.errors = 0;
    this.drops = 0;
    this.total = 0;
  }
}
