import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { ReportController } from './ReportController.js';
import type { State } from './types.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { createEmptyTestResults, createTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';
import { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import { SUITE_SEPARATOR } from './suites.js';

const REPORT_ID = 'report-id' as const;
const REPORT_GENERATED_BY = 'test' as const;

// Silence console logs
vi.spyOn(console, 'log').mockImplementation(() => {});

it('has an empty initial state', () => {
  const controller = new ReportController();
  expect(controller.state).toStrictEqual<State>({
    report: {
      reportFormat: 'CTRF',
      specVersion: SPEC_VERSION,
      results: createEmptyTestResults()
    },
    filterOnSuiteUid: '',
    filterOnStatus: '',
    search: '',
    sortBy: '',
    sortAscending: true,
    mode: 'open',
    suites: [],
    tests: []
  });
});

it('shows the report when set', () => {
  const reportBuilder = new TestReportBuilder(REPORT_ID, REPORT_GENERATED_BY);
  reportBuilder.merge(
    'http://localhost',
    createTestResults({
      tests: [
        {
          suite: ['test'],
          name: 'test',
          status: 'passed'
        }
      ]
    })
  );
  reportBuilder.finalize();
  const { report } = reportBuilder;
  const controller = new ReportController();
  const update = vi.fn();
  controller.connect(update);
  controller.interaction({
    report
  });
  expect(update).toHaveBeenCalledWith({
    mode: 'display',
    suites: [
      {
        uid: 'http://localhost',
        label: 'http://localhost',
        suites: [
          {
            uid: `http://localhost${SUITE_SEPARATOR}test`,
            label: 'test',
            suites: []
          }
        ]
      }
    ],
    tests: report.results.tests
  });
});

it('exports the report by downloading it', () => {
  const controller = new ReportController();
  const mock = {
    setAttribute: vi.fn(),
    click: vi.fn()
  };
  const spy = vi.spyOn(document, 'createElement').mockReturnValue(mock as unknown as HTMLElement);
  controller.interaction({ action: 'export' });
  expect(spy).toHaveBeenCalledOnce();
  expect(spy).toHaveBeenCalledWith('a');
  expect(mock.setAttribute).toHaveBeenCalledWith('href', expect.any(String) as string);
  expect(mock.setAttribute).toHaveBeenCalledWith('download', 'report.json');
  expect(mock.click).toHaveBeenCalledOnce();
});

describe('filtering', () => {
  const SUITE_URL = 'http://localhost/suite.html';
  const QUNIT_URL = 'http://localhost/qunit.html';
  const OPA_URL = 'http://localhost/opa.html';

  let report: CommonTestReport;

  beforeAll(() => {
    const reportBuilder = new TestReportBuilder(REPORT_ID, REPORT_GENERATED_BY);
    reportBuilder.addSuite(SUITE_URL, [QUNIT_URL, OPA_URL]);
    reportBuilder.merge(
      'http://localhost/qunit.html',
      createTestResults({
        tests: [
          { suite: ['qunit 1'], name: 'qunit 1.1', status: 'passed', duration: 6 },
          { suite: ['qunit 1'], name: 'qunit 1.2', status: 'passed', duration: 5 },
          { suite: ['qunit 1'], name: 'qunit 1.3', status: 'failed', duration: 4 },
          { suite: ['qunit 1'], name: 'qunit 1.4', status: 'skipped', duration: 3 },
          { suite: ['qunit 2'], name: 'qunit 2.1', status: 'passed', duration: 2 },
          { suite: ['qunit 2'], name: 'qunit 2.2', status: 'passed', duration: 1 }
        ]
      })
    );
    reportBuilder.merge(
      'http://localhost/opa.html',
      createTestResults({
        tests: [
          { suite: ['opa 1'], name: 'opa 1.1', status: 'passed', duration: 12 },
          { suite: ['opa 1'], name: 'opa 1.2', status: 'passed', duration: 11 },
          { suite: ['opa 1'], name: 'opa 1.3', status: 'failed', duration: 10 },
          { suite: ['opa 1'], name: 'opa 1.4', status: 'skipped', duration: 9 },
          { suite: ['opa 2'], name: 'opa 2.1', status: 'passed', duration: 8 },
          { suite: ['opa 2'], name: 'opa 2.2', status: 'passed', duration: 7 }
        ]
      })
    );
    reportBuilder.finalize();
    report = reportBuilder.report;
  });

  let controller: ReportController;
  let update: Mock;

  beforeEach(() => {
    controller = new ReportController();
    update = vi.fn();
    controller.connect(update);
    controller.interaction({
      report
    });
  });

  it('shows all tests by default', () => {
    expect(controller.state).toMatchObject({
      filterOnSuiteUid: '',
      filterOnStatus: '',
      search: '',
      sortBy: '',
      tests: report.results.tests
    });
  });

  const addSuites = (tests: object[]): object[] =>
    tests.map((object) => ({
      suite: expect.any(Array) as string[],
      ...object
    }));

  describe('filterOnSuiteUid', () => {
    it('shows all tests from suite', () => {
      controller.interaction({ filterOnSuiteUid: SUITE_URL });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.1', status: 'passed', duration: 6 },
          { name: 'qunit 1.2', status: 'passed', duration: 5 },
          { name: 'qunit 1.3', status: 'failed', duration: 4 },
          { name: 'qunit 1.4', status: 'skipped', duration: 3 },
          { name: 'qunit 2.1', status: 'passed', duration: 2 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 },
          { name: 'opa 1.1', status: 'passed', duration: 12 },
          { name: 'opa 1.2', status: 'passed', duration: 11 },
          { name: 'opa 1.3', status: 'failed', duration: 10 },
          { name: 'opa 1.4', status: 'skipped', duration: 9 },
          { name: 'opa 2.1', status: 'passed', duration: 8 },
          { name: 'opa 2.2', status: 'passed', duration: 7 }
        ])
      );
    });

    it('shows only qunit tests', () => {
      controller.interaction({ filterOnSuiteUid: `${SUITE_URL}${SUITE_SEPARATOR}${QUNIT_URL}` });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.1', status: 'passed', duration: 6 },
          { name: 'qunit 1.2', status: 'passed', duration: 5 },
          { name: 'qunit 1.3', status: 'failed', duration: 4 },
          { name: 'qunit 1.4', status: 'skipped', duration: 3 },
          { name: 'qunit 2.1', status: 'passed', duration: 2 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 }
        ])
      );
    });

    it('shows only qunit tests from qunit 2', () => {
      controller.interaction({
        filterOnSuiteUid: `${SUITE_URL}${SUITE_SEPARATOR}${QUNIT_URL}${SUITE_SEPARATOR}qunit 2`
      });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 2.1', status: 'passed', duration: 2 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 }
        ])
      );
    });
  });

  describe('filterOnStatus', () => {
    it('shows all passed tests', () => {
      controller.interaction({ filterOnStatus: 'passed' });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.1', status: 'passed', duration: 6 },
          { name: 'qunit 1.2', status: 'passed', duration: 5 },
          { name: 'qunit 2.1', status: 'passed', duration: 2 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 },
          { name: 'opa 1.1', status: 'passed', duration: 12 },
          { name: 'opa 1.2', status: 'passed', duration: 11 },
          { name: 'opa 2.1', status: 'passed', duration: 8 },
          { name: 'opa 2.2', status: 'passed', duration: 7 }
        ])
      );
    });

    it('shows all failed tests', () => {
      controller.interaction({ filterOnStatus: 'failed' });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.3', status: 'failed', duration: 4 },
          { name: 'opa 1.3', status: 'failed', duration: 10 }
        ])
      );
    });

    it('shows all other tests', () => {
      controller.interaction({ filterOnStatus: 'other' });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.4', status: 'skipped', duration: 3 },
          { name: 'opa 1.4', status: 'skipped', duration: 9 }
        ])
      );
    });
  });

  describe('search', () => {
    it('filters test by name', () => {
      controller.interaction({ search: '.2' });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.2', status: 'passed', duration: 5 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 },
          { name: 'opa 1.2', status: 'passed', duration: 11 },
          { name: 'opa 2.2', status: 'passed', duration: 7 }
        ])
      );
    });
  });

  describe('filterOnSuiteUi + filterOnStatus + search', () => {
    it('shows only qunit tests', () => {
      controller.interaction({
        filterOnSuiteUid: `${SUITE_URL}${SUITE_SEPARATOR}${QUNIT_URL}`,
        filterOnStatus: 'passed',
        search: '.2'
      });
      expect(controller.state.tests).toMatchObject(
        addSuites([
          { name: 'qunit 1.2', status: 'passed', duration: 5 },
          { name: 'qunit 2.2', status: 'passed', duration: 1 }
        ])
      );
    });
  });
});
