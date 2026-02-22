import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { report } from './report.js';
import type { CommonTestStatus } from '../types/CommonTestReportFormat.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;
type QUnitTestDoneDetails = Parameters<Parameters<typeof QUnit.testDone>[0]>[0] & {
  skipped?: true;
  todo?: true;
};

const updateState = (updates: Partial<QUnitState>) => {
  Object.assign(state, updates);
};

export const qunit = () => {
  state.type = 'QUnit';
  let executed = 0;

  QUnit.begin((details) => {
    report.begin(`QUnit@${window.QUnit!.version}`);
    updateState({
      isOpa: !!window?.sap?.ui?.test?.Opa5,
      executed,
      total: details.totalTests
    });
  });

  QUnit.log((details) => {
    if (details.result) {
      return;
    }
    // const message = details.message ? `: ${details.message}` : '';
    // report.error(`Assertion failed${message}`, {
    //   expected: details.expected,
    //   actual: details.actual,
    //   source: details.source
    // });
  });

  QUnit.testDone((details: QUnitTestDoneDetails) => {
    let status: CommonTestStatus = 'passed';
    if (details.failed > 0) {
      status = 'failed';
    } else if (details.skipped) {
      status = 'skipped';
    } else if (details.todo) {
      status = 'pending';
    } else if (!details.passed) {
      status = 'other';
    }
    report.test({
      suite: details.module,
      label: details.name,
      duration: details.runtime,
      status
    });
    updateState({
      executed: ++executed
    });
  });

  QUnit.done(() => {
    report.end();
    updateState({
      done: true
    });
  });
};
