import { TestSuite, TestResult } from './types';

export function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

export async function runSuite(suite: TestSuite, onResult: (testName: string, result: TestResult) => void) {
  for (const test of suite.tests) {
    const start = performance.now();
    try {
      onResult(test.name, { name: test.name, status: 'running' });
      await test.fn();
      const duration = performance.now() - start;
      onResult(test.name, { name: test.name, status: 'passed', duration });
    } catch (e: any) {
      const duration = performance.now() - start;
      onResult(test.name, { name: test.name, status: 'failed', duration, error: e.message });
    }
  }
}
