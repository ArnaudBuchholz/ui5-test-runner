import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { report } from './report.js';
import type { CommonTestStatus, CTRFTest } from '../types/CommonTestReportFormat.js';
import { log } from './log.js';
import { getConfig } from './config.js';
import { stringify } from './stringify.js';

type QUnitState = Extract<AgentState, { type: 'QUnit' }>;

const NO_TEST_ID = 'unknown';

/* v8 ignore next -- @preserve */
const getTestId = (testId?: string): string => testId ?? NO_TEST_ID;

type QUnitConfigWithModules = QUnit['config'] & {
  modules: {
    name: string;
    moduleId: string;
    tests: { name: string; testId: string; skip: boolean }[];
  }[];
};

type QUnitModuleStartDetails = Parameters<Parameters<typeof QUnit.moduleStart>[0]>[0] & {
  tests?: { name: string; testId: string; skip: boolean }[];
};

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

const isSuiteDone = () => state.done && state.type === 'suite';

const countTotalTests = () => {
  const { modules } = QUnit.config as QUnitConfigWithModules;
  const moduleId = new URL(window.location.href).searchParams.get('moduleId');
  if (moduleId) {
    return modules.find((m) => m.moduleId === moduleId)?.tests.length ?? 0;
  }
  let total = 0;
  for (const module of modules) {
    total += module.tests.length;
  }
  return total;
};

export const qunit = () => {
  const { agentNoTestsTimeout } = getConfig();
  let executed = 0;
  let errors = 0;
  const logs: { [key in string]: QUnitLogDetails[] } = {};

  let doneTimeout: ReturnType<typeof setTimeout> | undefined;

  const cancelDone = () => {
    if (doneTimeout === undefined) {
      return;
    }
    log('New tests found, cancelling done call');
    clearTimeout(doneTimeout);
    doneTimeout = undefined;
  };

  updateState({
    type: 'QUnit',
    isOpa: false,
    executed,
    total: 0,
    errors
  });

  QUnit.begin((details) => {
    log(`QUnit.begin({totalTests: ${details.totalTests}, modules: [...${details.modules.length}...]})`);
    report.begin(`QUnit@${window.QUnit!.version}`);
    const isOpa = !!window?.sap?.ui?.test?.Opa5;
    const shouldSplit =
      isOpa &&
      !!getConfig().splitOpa &&
      (QUnit.config as QUnitConfigWithModules).modules.length > 1 &&
      !new URL(window.location.href).searchParams.has('moduleId');
    if (shouldSplit) {
      const pages = (QUnit.config as QUnitConfigWithModules).modules.map(({ moduleId }) => {
        const url = new URL(window.location.href);
        url.searchParams.set('moduleId', moduleId);
        return url.href;
      });
      Object.assign(state, { done: true, type: 'suite', pages });
      return;
    }
    updateState({
      isOpa,
      executed,
      total: countTotalTests(),
      errors
    });
  });

  QUnit.moduleStart((details: QUnitModuleStartDetails) => {
    log(`QUnit.moduleStart({name: "${details.name}"})`);
    if (isSuiteDone()) return;
    cancelDone();
    const total = countTotalTests();
    if (state.type === 'QUnit' && total > state.total) {
      updateState({
        isOpa: !!window?.sap?.ui?.test?.Opa5,
        total
      });
    }
  });

  QUnit.log((details: QUnitLogDetails) => {
    log(
      `QUnit.log({testId: ${details.testId}, result: ${details.result}, name: "${details.name}", module: "${details.module}}")`
    );
    if (isSuiteDone()) return;
    const testId = getTestId(details.testId);
    logs[testId] ??= [];
    logs[testId].push(details);
  });

  const getErrorDetails = (test: CTRFTest, details: QUnitTestDoneDetails) => {
    const testLogs = logs[getTestId(details.testId)];
    if (!testLogs) {
      test.message = 'No logs';
      return;
    }
    const firstErrorLog = testLogs.find(({ result }) => !result);
    if (firstErrorLog) {
      test.message = firstErrorLog.message ?? 'failed';
      test.trace = firstErrorLog.source;
      test.extra = {
        actual: stringify(firstErrorLog.actual),
        expected: stringify(firstErrorLog.expected)
      };
    } else {
      test.message = 'No error log';
    }
    test.extra ??= {};
    test.extra['QUnitLogs'] = testLogs.map((testLog) => ({
      ...testLog,
      actual: stringify(testLog.actual),
      expected: stringify(testLog.expected)
    }));
  };

  QUnit.testDone((details: QUnitTestDoneDetails) => {
    log(
      `QUnit.log({testId: ${details.testId}, passed: ${details.passed}, failed: ${details.failed}, name: "${details.name}", module: "${details.module}}")`
    );
    if (isSuiteDone()) return;
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
      getErrorDetails(test, details);
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

  const done = () => {
    report.end();
    updateState({
      done: true
    });
  };

  QUnit.done((details) => {
    log(`QUnit.done({passed: ${details.passed}, failed: ${details.failed}, total: ${details.total}}")`);
    if (isSuiteDone()) return;
    if (report.results.summary.tests === 0) {
      log.warn('QUnit.done triggered but no tests were executed, waiting for asynchronous tests loading');
      doneTimeout = setTimeout(done, agentNoTestsTimeout);
    } else {
      done();
    }
  });
};
