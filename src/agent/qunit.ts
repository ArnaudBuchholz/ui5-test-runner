import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { report } from './report.js';
import type { CommonTestStatus, CTRFTest } from '../types/CommonTestReportFormat.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;

const NO_TEST_ID = 'unknown';

/* v8 ignore next -- @preserve */
const getTestId = (testId?: string): string => testId ?? NO_TEST_ID;

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
  let executed = 0;
  let errors = 0;
  const logs: { [key in string]: QUnitLogDetails[] } = {};

  updateState({
    type: 'QUnit',
    isOpa: false,
    executed,
    total: 0,
    errors
  });

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
    const testId = getTestId(details.testId);
    logs[testId] ??= [];
    logs[testId].push(details);
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
      const errorLogs = logs[getTestId(details.testId)]?.filter(({ result }) => !result);
      if (errorLogs && errorLogs.length > 0) {
        test.message = errorLogs[0]!.message ?? 'failed';
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
    delete logs[getTestId(details.testId)];
  });

  QUnit.done(() => {
    report.end();
    updateState({
      done: true
    });
  });
};
