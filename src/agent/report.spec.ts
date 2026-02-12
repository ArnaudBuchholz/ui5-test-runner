import { it, expect, describe, beforeEach } from 'vitest';
import { AgentTestResultsBuilder } from './report.js';
import type { CommonTestReport, CommonTestStatus } from '../types/CommonTestReportFormat';

describe('begin', () => {
  it('reports on tool being used (no version)', () => {
    const report = new AgentTestResultsBuilder();
    report.begin('QUnit');
    expect(report.results.tool).toStrictEqual<CommonTestReport['results']['tool']>({
      name: 'QUnit'
    });
  });

  it('reports on tool being used (version)', () => {
    const report = new AgentTestResultsBuilder();
    report.begin('QUnit@1.2.3');
    expect(report.results.tool).toStrictEqual<CommonTestReport['results']['tool']>({
      name: 'QUnit',
      version: '1.2.3'
    });
  });

  it('stores start', () => {
    const report = new AgentTestResultsBuilder();
    report.begin('QUnit@1.2.3');
    expect(report.results.summary.start).not.toStrictEqual(0);
  });
});

describe('test', () => {
  let report: AgentTestResultsBuilder;

  beforeEach(() => {
    report = new AgentTestResultsBuilder();
    report.begin('Qunit@1.2.3');
  });

  const statuses: CommonTestStatus[] = ['failed', 'other', 'passed', 'pending', 'skipped'] as const;
  for (const status of statuses) {
    it(`adds a ${status} test with suite`, () => {
      report.test({
        duration: 1,
        label: status,
        status,
        suite: 'suite'
      });
      expect(report.results.summary).toMatchObject<Partial<CommonTestReport['results']['summary']>>({
        failed: 0,
        other: 0,
        passed: 0,
        pending: 0,
        skipped: 0,
        tests: 1,
        [status]: 1
      });
      expect(report.results.tests).toStrictEqual<CommonTestReport['results']['tests']>([
        {
          duration: 1,
          name: status,
          status,
          suite: ['suite']
        }
      ]);
    });

    it(`adds a ${status} test with no suite`, () => {
      report.test({
        duration: 1,
        label: status,
        status
      });
      expect(report.results.summary).toMatchObject<Partial<CommonTestReport['results']['summary']>>({
        failed: 0,
        other: 0,
        passed: 0,
        pending: 0,
        skipped: 0,
        tests: 1,
        [status]: 1
      });
      expect(report.results.tests).toStrictEqual<CommonTestReport['results']['tests']>([
        {
          duration: 1,
          name: status,
          status
        }
      ]);
    });
  }
});
