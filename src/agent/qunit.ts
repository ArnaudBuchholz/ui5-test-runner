import type { AgentState } from '../types/AgentState.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';
import { UI5_TEST_RUNNER } from './contants.js';
import { state } from './state.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;
type QUnitTestDoneDetails = Parameters<Parameters<typeof QUnit.testDone>[0]>[0] & {
  skipped?: true;
  todo?: true;
};

const updateState = (updates: Partial<QUnitState>) => {
  Object.assign(state, updates);
};

const report: CommonTestReport['results'] = {
  tool: {
    name: 'QUnit',
  },
  summary: {
    failed: 0,
    other: 0,
    passed: 0,
    pending: 0,
    skipped: 0,
    start: 0,
    stop: 0,
    tests: 0,
    duration: 0
  },
  tests: []
};

export const qunit = () => {
  state.type = 'QUnit';
  let executed = 0;

  QUnit.begin((details) => {
    if (!report.summary.start) {
      report.summary.start = Date.now();
    }
    updateState({
      isOpa: !!window?.sap?.ui?.test?.Opa5,
      executed,
      total: details.totalTests
    })
  });

  QUnit.testStart((details) => {
    report.tests.push({
      name: details.name,
      suite: [details.module],
      duration: 0,
      status: 'other'
    });
  });

  QUnit.testDone((details: QUnitTestDoneDetails) => {
    if (!report.tests.length ) {
      // TODO: find a way to log the issue
      return;
    }
    const test = report.tests[report.tests.length - 1]!; // length has been tested
    // TODO: check that the test correspond to the one added on testStart
    test.duration = details.runtime;
    ++report.summary.tests;
    if (details.failed > 0) {
      test.status = 'failed';
      test.message = ''; // Need to capture the first failed assertion
      ++report.summary.failed;
    } else if (details.passed > 0) {
      test.status = 'passed';
      ++report.summary.passed;
    } else if (details.skipped) {
      test.status = 'skipped';
      ++report.summary.skipped;
    } else if (details.todo) {
      test.status = 'pending';
      ++report.summary.pending;
    } else {
      test.status = 'other';
      ++report.summary.other;
    }
    updateState({
      executed: ++executed
    })
  });

  QUnit.done(() => {
    window[UI5_TEST_RUNNER].report = report;
    updateState({
      done: true
    });
  });
};
