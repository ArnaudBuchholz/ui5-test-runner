import { it, expect } from 'vitest';
import { buildSuites } from './suites.js';
import { Suite } from './types.js';
import { CommonTestReport, createTestResults } from '../../types/CommonTestReportFormat.js';

const toTests = (allSuites: string[][]): CommonTestReport['results']['tests'] =>
  createTestResults({
    tests: allSuites.map((suites) => ({
      suites,
      status: 'passed'
    }))
  }).tests;

it('returns the suite', () => {
  expect(buildSuites(toTests([
    ['test']
  ]))).toStrictEqual<Suite[]>([{
    id: 'test',
    label: 'test',
    suites: []
  }]);
});
