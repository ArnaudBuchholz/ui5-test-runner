import { it, expect, describe } from 'vitest';
import { createEmptyTestResults, createTestResults } from './CommonTestReportFormat.js';
import type { CommonTestReport } from './CommonTestReportFormat.js';

describe('createEmptyTestResults', () => {
  it('returns an empty test results object', () => {
    expect(createEmptyTestResults()).toStrictEqual<CommonTestReport['results']>({
      tool: {
        name: ''
      },
      tests: [],
      summary: {
        failed: 0,
        other: 0,
        passed: 0,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        duration: 0,
        tests: 0
      }
    });
  });
});

describe('createTestResults', () => {
  it('returns a test results object with the provided tool information', () => {
    expect(
      createTestResults({
        tool: {
          name: 'tool'
        }
      })
    ).toStrictEqual<CommonTestReport['results']>({
      tool: {
        name: 'tool'
      },
      tests: [],
      summary: {
        failed: 0,
        other: 0,
        passed: 0,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        duration: 0,
        tests: 0
      }
    });
  });

  it('returns a test results object with the summary', () => {
    expect(
      createTestResults({
        tests: [
          {
            name: 'test0',
            status: 'passed',
            duration: 1
          }
        ],
        summary: {
          failed: 999,
          other: 999,
          passed: 999,
          pending: 999,
          skipped: 999,
          start: 123,
          stop: 456,
          tests: 999
        }
      })
    ).toStrictEqual<CommonTestReport['results']>({
      tool: {
        name: ''
      },
      tests: [
        {
          suite: ['suite'],
          name: 'test0',
          status: 'passed',
          duration: 1
        }
      ],
      summary: {
        failed: 0,
        other: 0,
        passed: 1,
        pending: 0,
        skipped: 0,
        start: 123,
        stop: 456,
        duration: 0,
        tests: 1
      }
    });
  });

  it('returns a test results object consolidating the different tests', () => {
    expect(
      createTestResults({
        tests: [
          {
            suite: ['suite', 'test0'],
            name: 'test0',
            status: 'passed',
            duration: 1
          },
          {
            suite: ['suite', 'test1'],

            name: 'test1',
            status: 'failed',
            duration: 1
          },
          {
            suite: ['suite', 'test2'],
            name: 'test2',
            status: 'passed',
            duration: 1
          }
        ]
      })
    ).toStrictEqual<CommonTestReport['results']>({
      tool: {
        name: ''
      },
      tests: [
        {
          suite: ['suite', 'test0'],
          name: 'test0',
          status: 'passed',
          duration: 1
        },
        {
          suite: ['suite', 'test1'],
          name: 'test1',
          status: 'failed',
          duration: 1
        },
        {
          suite: ['suite', 'test2'],
          name: 'test2',
          status: 'passed',
          duration: 1
        }
      ],
      summary: {
        failed: 1,
        other: 0,
        passed: 2,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        duration: 0,
        tests: 3
      }
    });
  });
});
