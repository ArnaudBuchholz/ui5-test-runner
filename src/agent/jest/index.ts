import type { AgentState } from '../../types/AgentState.js';
import type { CTRFTest, CommonTestStatus } from '../../types/CommonTestReportFormat.js';
import { state } from '../state.js';
import { report } from '../report.js';
import { log } from '../log.js';
import { UI5_TEST_RUNNER } from '../contants.js';
import { Collector } from './collect.js';
import { expect } from './expect.js';
import { createJest } from './jestMock.js';
import { run } from './run.js';
import type { JestEvents, JestStatus } from './run.js';

type JestState = Extract<AgentState, { type: 'jest' }>;

const JEST_VERSION = '29.7.0';

const STATUS: { [key in JestStatus]: CommonTestStatus } = {
  passed: 'passed',
  failed: 'failed',
  skipped: 'skipped',
  pending: 'pending'
};

const updateState = (updates: Partial<JestState>) => {
  Object.assign(state, updates);
};

export const jest = () => {
  const collector = new Collector();
  Object.assign(window, {
    describe: collector.describe.bind(collector),
    test: collector.test,
    it: collector.test,
    beforeAll: collector.beforeAll.bind(collector),
    beforeEach: collector.beforeEach.bind(collector),
    afterEach: collector.afterEach.bind(collector),
    afterAll: collector.afterAll.bind(collector),
    expect,
    jest: createJest()
  });

  let executed = 0;
  let errors = 0;

  updateState({ type: 'jest', executed, total: 0, errors });

  const events: JestEvents = {
    runStart() {
      log('jest run start');
      report.begin(`jest@${JEST_VERSION}`);
    },
    testStart(suite, name) {
      log(`jest test start: ${[...suite, name].join(' > ')}`);
    },
    testDone(event) {
      const test: CTRFTest = {
        suite: event.suite.length > 0 ? (event.suite as [string, ...string[]]) : undefined,
        name: event.name,
        duration: event.duration,
        status: STATUS[event.status]
      };
      if (event.error) {
        ++errors;
        test.message = event.error.message;
        test.trace = event.error.stack;
      }
      report.test(test);
      updateState({ executed: ++executed, total: executed, errors });
    },
    runFinish() {
      log('jest run finish');
      report.end();
      updateState({ done: true });
    }
  };

  let isStarted = false;
  const start = () => {
    if (isStarted) {
      log.warn('jestStart called more than once, ignoring');
      return;
    }
    isStarted = true;
    void run(collector.root, events);
  };
  window[UI5_TEST_RUNNER].jestStart = start;
};
