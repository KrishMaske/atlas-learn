// =============================================================================
// Atlas Learn - Win Condition Evaluator
// =============================================================================

import { TutorialLevel, LevelObjective } from '@/core/types';
import { Metrics } from '@/core/sim/metrics';

// -----------------------------------------------------------------------------
// Evaluation Result
// -----------------------------------------------------------------------------

export interface EvaluationResult {
  passed: boolean;
  objectiveResults: {
    objective: LevelObjective;
    currentValue: number;
    passed: boolean;
  }[];
}

// -----------------------------------------------------------------------------
// Evaluator
// -----------------------------------------------------------------------------

export function evaluateLevel(level: TutorialLevel, metrics: Metrics): EvaluationResult {
  const objectiveResults = level.objectives.map((objective) => {
    const currentValue = getMetricValue(metrics, objective.metric);
    const passed = checkObjective(objective, currentValue);
    return { objective, currentValue, passed };
  });

  return {
    passed: objectiveResults.every((r) => r.passed),
    objectiveResults,
  };
}

// Get metric value from simulation metrics
function getMetricValue(metrics: Metrics, metric: LevelObjective['metric']): number {
  switch (metric) {
    case 'p95':
      return metrics.p95Latency;
    case 'throughput':
      return metrics.throughput;
    case 'errorRate':
      return metrics.errorRate;
    default:
      return 0;
  }
}

// Check if objective is met
function checkObjective(objective: LevelObjective, value: number): boolean {
  switch (objective.operator) {
    case '<':
      return value < objective.value;
    case '>':
      return value > objective.value;
    case '<=':
      return value <= objective.value;
    default:
      return false;
  }
}

// -----------------------------------------------------------------------------
// Format Objective for Display
// -----------------------------------------------------------------------------

export function formatObjective(objective: LevelObjective): string {
  const metricLabels: Record<string, string> = {
    p95: 'p95 Latency',
    throughput: 'Throughput',
    errorRate: 'Error Rate',
  };

  const units: Record<string, string> = {
    p95: 'ms',
    throughput: 'RPS',
    errorRate: '%',
  };

  const value = objective.metric === 'errorRate' 
    ? (objective.value * 100).toFixed(1) 
    : objective.value;

  return `${metricLabels[objective.metric]} ${objective.operator} ${value}${units[objective.metric]}`;
}
