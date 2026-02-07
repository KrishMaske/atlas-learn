export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

export interface TestResult {
  name: string;
  status: TestStatus;
  duration?: number;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
}

export interface RunnerState {
  suites: TestSuite[];
  results: Record<string, TestResult[]>;
  isRunning: boolean;
  totalPassed: number;
  totalFailed: number;
}
