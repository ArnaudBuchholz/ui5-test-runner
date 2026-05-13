import { describe, it, expect } from 'vitest';
import { buildSuites, extractUrlLabel, NO_SUITE, NO_SUITE_LABEL, SUITE_SEPARATOR } from './suites.js';
import type { Suite } from './types.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { createTestResults } from '../../types/CommonTestReportFormat.js';

const toTests = (suites: string[][]): CommonTestReport['results']['tests'] =>
  createTestResults({
    tests: suites.map((suite) => ({
      suite,
      status: 'passed'
    }))
  }).tests;

it('allocates a default suite (undefined)', () => {
  expect(
    buildSuites(
      createTestResults({
        tests: [
          {
            suite: undefined,
            status: 'passed'
          }
        ]
      }).tests
    )
  ).toStrictEqual<Suite[]>([
    {
      uid: NO_SUITE,
      label: NO_SUITE_LABEL,
      suites: []
    }
  ]);
});

it('allocates a default suite (empty)', () => {
  expect(buildSuites(toTests([[]]))).toStrictEqual<Suite[]>([
    {
      uid: NO_SUITE,
      label: NO_SUITE_LABEL,
      suites: []
    }
  ]);
});

it('returns the suite', () => {
  expect(buildSuites(toTests([['test']]))).toStrictEqual<Suite[]>([
    {
      uid: 'test',
      label: 'test',
      suites: []
    }
  ]);
});

it('organizes suites as a tree', () => {
  expect(buildSuites(toTests([['test'], ['test', 'abc'], ['test', 'def'], ['test', 'abc', 'ghi']]))).toStrictEqual<
    Suite[]
  >([
    {
      uid: 'test',
      label: 'test',
      suites: [
        {
          uid: `test${SUITE_SEPARATOR}abc`,
          label: 'abc',
          suites: [
            {
              uid: `test${SUITE_SEPARATOR}abc${SUITE_SEPARATOR}ghi`,
              label: 'ghi',
              suites: []
            }
          ]
        },
        {
          uid: `test${SUITE_SEPARATOR}def`,
          label: 'def',
          suites: []
        }
      ]
    }
  ]);
});

describe('summarizing URLs');
it.each([
  {
    url: 'http://localhost:8000/resources/sap/ui/test/starter/Test.qunit.html?testsuite=test-resources/sap/ui/core/qunit/testsuites/testsuite.controls.qunit&test=EnabledPropagator',
    label: 'EnabledPropagator'
  },
  {
    url: 'http://localhost:8000/resources/sap/ui/test/starter/Test.qunit.html?testsuite=test-resources/sap/ui/core/qunit/testsuites/testsuite.controls.qunit',
    label: 'test-resources/sap/ui/core/qunit/testsuites/testsuite.controls.qunit'
  },
  {
    url: 'http://localhost:8000/resources/sap/ui/test/starter/Test.qunit.html',
    label: 'Test.qunit.html'
  }
])('$url -> $label', ({ url, label }) => {
  expect(extractUrlLabel(url)).toStrictEqual(label);
});
