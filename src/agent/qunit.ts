import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { report } from './report.js';
import type { CommonTestStatus, CTRFTest } from '../types/CommonTestReportFormat.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;

const NO_TEST_ID = 'unknown';

type QUnitLogDetails = Parameters<Parameters<typeof QUnit.log>[0]>[0] & {
  testId?: string;
  result?: boolean;
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
  const logs: { [key in string]: QUnitLogDetails[] } = {};

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
    logs[details.testId ?? NO_TEST_ID] ??= [];
    logs[details.testId ?? NO_TEST_ID]!.push(details);
  });

  QUnit.testDone((details: QUnitTestDoneDetails) => {
    let status: CommonTestStatus = 'passed';
    const test: CTRFTest = {
      id: details.testId,
      suite: [details.module],
      name: details.name,
      duration: details.runtime,
      status: 'other'
    };
    if (details.failed > 0) {
      ++errors;
      status = 'failed';
      const errorLogs = logs[details.testId ?? NO_TEST_ID]?.filter(({ result }) => !result);
      if (errorLogs && errorLogs.length > 0) {
        test.message = errorLogs[0]!.message;
        test.trace = errorLogs[0]!.source;
      }
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
    delete logs[details.testId ?? NO_TEST_ID];
  });

  QUnit.done(() => {
    report.end();
    updateState({
      done: true
    });
  });
};
