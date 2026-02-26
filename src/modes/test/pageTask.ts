import type { IParallelizeContext } from '../../utils/parallelize.js';
import { logger } from '../../platform/logger.js';
import { getAgentSource } from './agent.js';
import { getBrowser } from './browser.js';
import type { AgentState } from '../../types/AgentState.js';
import { Exit, ExitShutdownError } from '../../platform/Exit.js';
import { setTimeout } from 'node:timers/promises';
import { report } from './report.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { IWindow } from '../../browsers/IBrowser.js';

const UID_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let lastUid = 0;

const generateUid = (): string => {
  let uid = '';
  let value = lastUid++;
  do {
    uid = UID_DIGITS[value % UID_DIGITS.length] + uid;
    value = Math.floor(value / UID_DIGITS.length);
  } while (value > 0);
  return uid.padStart(4, '0');
};

type PageContext = {
  uid: string;
  urls: string[];
  url: string;
  page: IWindow;
  loopDelay: number;
  lastExecuted: number;
  lastTotal: number;
};

const queryAgentState = async (context: PageContext): Promise<boolean> => {
  const agentState = (await context.page.eval("window['ui5-test-runner'].state")) as AgentState;
  logger.debug({ source: 'page', message: 'agent state', data: { uid: context.uid, state: agentState } });
  if (agentState.done) {
    if (agentState.type === 'suite') {
      for (const page of agentState.pages) {
        const pageUrl = new URL(page, context.url).toString();
        context.urls.push(pageUrl);
      }
    }
    return true;
  }
  if (agentState.type === 'QUnit') {
    if (agentState.isOpa) {
      context.loopDelay = 1000; // No need to stress out, they are slower
    }
    if (agentState.total > 0) {
      const { executed, total } = agentState;
      if (executed !== context.lastExecuted || total !== context.lastTotal) {
        context.lastExecuted = executed;
        context.lastTotal = total;
        logger.info({
          source: 'progress',
          message: context.url,
          data: { max: agentState.total, value: agentState.executed, uid: context.uid }
        });
      }
    }
  }
  return false;
};

export const pageTask = async function (this: IParallelizeContext, url: string, index: number, urls: string[]) {
  const uid = generateUid();
  logger.debug({ source: 'page', message: 'new page task', data: { uid, url } });
  logger.info({
    source: 'progress',
    message: url,
    data: { max: 0, value: 1, uid }
  });
  const { promise: taskStopped, resolve: setTaskAsStopped } = Promise.withResolvers<void>();
  const asyncTask = Exit.registerAsyncTask({
    name: url,
    stop: async () => {
      try {
        this.stop(new ExitShutdownError()); // throws
      } finally {
        await taskStopped;
      }
    }
  });
  const agentSource = await getAgentSource();
  const browser = getBrowser();
  const page = await browser.newWindow({
    scripts: [agentSource],
    url
  });
  const context: PageContext = {
    uid,
    urls,
    url,
    page,
    loopDelay: 250, // default
    lastExecuted: 0,
    lastTotal: 0
  };
  while (!this.stopRequested) {
    try {
      await setTimeout(context.loopDelay);
      if (await queryAgentState(context)) {
        break;
      }
    } catch (error) {
      logger.error({ source: 'page', message: 'An error occurred', error, data: { uid } });
    }
  }
  try {
    const testResults = (await page.eval("window['ui5-test-runner'].results")) as CommonTestReport['results'];
    logger.debug({ source: 'page', message: 'test results', data: { uid, results: testResults } });
    report.merge(url, testResults);
  } finally {
    logger.info({
      source: 'progress',
      message: url,
      data: { max: 1, value: 1, uid, remove: true }
    });
    asyncTask.unregister();
    await page.close();
    setTaskAsStopped();
  }
};
