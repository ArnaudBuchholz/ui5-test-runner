import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { report } from './report.js';
import type { CommonTestStatus, CTRFTest } from '../types/CommonTestReportFormat.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;

type QUnitLogDetails = Parameters<Parameters<typeof QUnit.log>[0]>[0] & {
  testId?: string;
};

type QUnitTestDoneDetails = Parameters<Parameters<typeof QUnit.testDone>[0]>[0] & {
  testId?: string;
  assertions?: { result: boolean; message: string }[];
  skipped?: true;
  todo?: true;
};

const updateState = (updates: Partial<QUnitState>) => {
  Object.assign(state, updates);
};

export const qunit = () => {
  state.type = 'QUnit';
  let executed = 0;
  let errors = 0;

  QUnit.begin((details) => {
    report.begin(`QUnit@${window.QUnit!.version}`);
    updateState({
      isOpa: !!window?.sap?.ui?.test?.Opa5,
      executed,
      total: details.totalTests,
      errors
    });
  });

  QUnit.log((details: QUnitLogDetails) => {
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
    const test: CTRFTest = {
      id: details.testId,
      suite: [details.module],
      name: details.name,
      duration: details.runtime,
      status: 'other'
    }
    if (details.failed > 0) {
      ++errors;
      status = 'failed';
    } else if (details.skipped) {
      status = 'skipped';
    } else if (details.todo) {
      status = 'pending';
    }
    test.status = status;
    report.test(test);
    updateState({
      executed: ++executed,
      errors
    });
  });

  QUnit.done(() => {
    report.end();
    updateState({
      done: true
    });
  });
};
