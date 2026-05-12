import { it, expect } from 'vitest';
import { buildSuites, NO_SUITE, NO_SUITE_LABEL } from './suites.js';
import { Suite } from './types.js';
import { CommonTestReport, createTestResults } from '../../types/CommonTestReportFormat.js';

const toTests = (suites: string[][]): CommonTestReport['results']['tests'] =>
  createTestResults({
    tests: suites.map((suite) => ({
      suite,
      status: 'passed'
    }))
  }).tests;

it('allocates a default suite (undefined)', () => {
  expect(buildSuites(createTestResults({
    tests: [{
      suite: undefined,
      status: 'passed'
    }]
  }).tests)).toStrictEqual<Suite[]>([{
    uid: NO_SUITE,
    label: NO_SUITE_LABEL,
    suites: []
  }]);
});

it('allocates a default suite (empty)', () => {
  expect(buildSuites(toTests([
    []
  ]))).toStrictEqual<Suite[]>([{
    uid: NO_SUITE,
    label: NO_SUITE_LABEL,
    suites: []
  }]);
});

it('returns the suite', () => {
  expect(buildSuites(toTests([
    ['test']
  ]))).toStrictEqual<Suite[]>([{
    uid: 'test',
    label: 'test',
    suites: []
  }]);
});
