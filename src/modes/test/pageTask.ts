import type { IParallelizeContext } from '../../utils/shared/parallelize.js';
import { assert, logger } from '../../platform/index.js';
import type { PageProgressData } from '../../platform/logger/types.js';
import { getAgentSource } from './agent.js';
import { getBrowser } from './browser.js';
import type { AgentState } from '../../types/AgentState.js';
import { Exit, ExitShutdownError } from '../../platform/Exit.js';
import { setTimeout } from 'node:timers/promises';
import { reportBuilder } from './report.js';
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
  type: PageProgressData['type'];
  lastExecuted: number;
  errors: number;
  lastTotal: number;
};

const reportQunitProgress = (context: PageContext, agentState: Extract<AgentState, { type: 'QUnit' }>) => {
  if (agentState.isOpa) {
    context.loopDelay = 1000; // No need to stress out, they are slower
  }
  if (agentState.total > 0) {
    const { executed, total, errors } = agentState;
    if (executed !== context.lastExecuted || total !== context.lastTotal) {
      const type = agentState.isOpa ? 'opa' : 'qunit';
      context.lastExecuted = executed;
      context.lastTotal = total;
      context.errors = errors;
      context.type = type;
      logger.info({
        source: 'progress',
        message: context.url,
        data: { max: agentState.total, value: agentState.executed, uid: context.uid, type, errors }
      });
    }
  }
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
    } else if (agentState.type === 'unknown') {
      logger.fatal({
        source: 'page',
        message: 'Unable to detect page type',
        data: { uid: context.uid, state: agentState }
      });
      throw new Error('Unable to detect page type');
    } else {
      assert(agentState.type === 'QUnit');
      reportQunitProgress(context, agentState);
    }
    return true;
  }
  if (agentState.type === 'QUnit') {
    reportQunitProgress(context, agentState);
  }
  return false;
};

export const pageTask = async function (this: IParallelizeContext, url: string, index: number, urls: string[]) {
  const uid = generateUid();
  logger.debug({ source: 'page', message: 'new page task', data: { uid, url } });
  logger.info({
    source: 'progress',
    message: url,
    data: { max: 0, value: 1, uid, type: 'unknown', errors: 0 }
  });
  const { promise: taskStopped, resolve: setTaskAsStopped } = Promise.withResolvers<void>();
  using _ = Exit.registerAsyncTask({
    name: url,
    stop: async () => {
      try {
        this.stop(new ExitShutdownError()); // throws
      } catch {
        // ignore
      } finally {
        await taskStopped;
      }
    }
  });
  let page: IWindow | undefined;
  let context: PageContext | undefined;
  try {
    const agentSource = await getAgentSource();
    const browser = getBrowser();
    page = await browser.newWindow({
      uid,
      scripts: [agentSource],
      url
    });
    context = {
      uid,
      urls,
      url,
      page,
      loopDelay: 250, // default
      type: 'unknown',
      lastExecuted: 0,
      errors: 0,
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
        break;
      }
    }
    const testResults = (await page.eval("window['ui5-test-runner'].results")) as CommonTestReport['results'];
    logger.debug({ source: 'page', message: 'test results', data: { uid, results: testResults } });
    reportBuilder.merge(url, testResults);
  } finally {
    if (context !== undefined) {
      logger.info({
        source: 'progress',
        message: url,
        data: {
          max: context.lastTotal,
          value: context.lastExecuted,
          uid,
          type: context.type,
          errors: context.errors,
          remove: true
        }
      });
    }
    try {
      await page?.close();
    } catch (error) {
      logger.error({ source: 'page', message: 'page.close failed', error, data: { uid } });
    }
    setTaskAsStopped();
  }
};
