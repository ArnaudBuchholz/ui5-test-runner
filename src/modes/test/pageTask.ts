import type { IParallelizeContext } from '../../utils/shared/parallelize.js';
import { assert, logger } from '../../platform/index.js';
import type { PageProgressData } from '../../platform/logger/types.js';
import { getAgentSource } from './agent.js';
import { getBrowser } from './browser.js';
import type { AgentState } from '../../types/AgentState.js';
import { Exit, ExitShutdownError } from '../../platform/Exit.js';
import { setTimeout } from 'node:timers/promises';
import { getReportBuilder } from './report.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { IWindow } from '../../browsers/IBrowser.js';
import { getBrowserConfigScript } from './browserConfig.js';

let lastPageId = 0;

type PageContext = {
  pageId: number;
  urls: string[];
  url: string;
  page: IWindow;
  loopDelay: number;
  type: PageProgressData['type'];
  lastExecuted: number;
  errors: number;
  lastTotal: number;
  isSuite: boolean;
};

export const agentStateMessage = (agentState: AgentState): string => {
  if (agentState.type === 'suite') return 'agent state: suite done';
  if (agentState.type === 'QUnit') {
    const kind = agentState.isOpa ? 'OPA' : 'QUnit';
    const progress = `${agentState.executed}/${agentState.total}`;
    return agentState.done ? `agent state: ${kind} done ${progress}` : `agent state: ${kind} ${progress}`;
  }
  if (agentState.type === 'unknown') return 'agent state: unknown';
  return 'agent state: loading';
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
        pageId: context.pageId,
        data: { max: agentState.total, value: agentState.executed, type, errors }
      });
    }
  }
};

const queryAgentState = async (context: PageContext): Promise<boolean> => {
  const agentState = (await context.page.eval("window['ui5-test-runner'].state")) as AgentState;
  logger.debug({
    source: 'page',
    message: agentStateMessage(agentState),
    data: { state: agentState },
    pageId: context.pageId
  });
  if (agentState.done) {
    if (agentState.type === 'suite') {
      const resolvedPages = agentState.pages.map((page) => new URL(page, context.url).href);
      for (const pageUrl of resolvedPages) {
        context.urls.push(pageUrl);
      }
      context.isSuite = true;
      logger.debug({
        source: 'page',
        message: `suite: dispatching ${resolvedPages.length} pages`,
        pageId: context.pageId,
        data: { pages: resolvedPages }
      });
    } else if (agentState.type === 'unknown') {
      logger.fatal({
        source: 'page',
        message: 'Unable to detect page type',
        pageId: context.pageId,
        data: { state: agentState }
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
    // TODO: document the problem in the test report
    // TODO: add an option to ignore the uncaught errors
    if (agentState.uncaughtErrors?.length) {
      return true;
    }
  }
  return false;
};

export const pageTask = async function (this: IParallelizeContext, url: string, index: number, urls: string[]) {
  const pageId = ++lastPageId;
  logger.debug({ source: 'page', message: 'new page task', pageId, data: { url } });
  logger.info({
    source: 'progress',
    message: url,
    pageId,
    data: { max: 0, value: 1, type: 'unknown', errors: 0 }
  });
  // TODO a quick probe may help to figure out if the page is accessible (using Http.fetch and checking response.ok)
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
    const browserConfig = getBrowserConfigScript();
    const browser = getBrowser();
    page = await browser.newWindow({
      pageId,
      scripts: [browserConfig, agentSource],
      url
    });
    context = {
      pageId,
      urls,
      url,
      page,
      loopDelay: 250, // default
      type: 'unknown',
      lastExecuted: 0,
      errors: 0,
      lastTotal: 0,
      isSuite: false
    };
    while (!this.stopRequested) {
      try {
        await setTimeout(context.loopDelay);
        if (await queryAgentState(context)) {
          break;
        }
      } catch (error) {
        logger.error({ source: 'page', message: 'An error occurred', error, pageId, data: {} });
        break;
      }
    }
    const testResults = (await page.eval("window['ui5-test-runner'].results")) as CommonTestReport['results'];
    if (!context?.isSuite) {
      const { passed, failed, tests, duration } = testResults.summary;
      const durationString = duration === undefined ? '' : ` (${duration}ms)`;
      logger.debug({
        source: 'page',
        message: `test results: passed=${passed} failed=${failed} tests=${tests}${durationString}`,
        pageId,
        data: { results: testResults }
      });
    }
    getReportBuilder().merge(url, testResults);
    // TODO: add a catch block and document the problem in the test report
  } finally {
    if (context !== undefined) {
      logger.info({
        source: 'progress',
        message: url,
        pageId,
        data: {
          max: context.lastTotal,
          value: context.lastExecuted,
          type: context.type,
          errors: context.errors,
          remove: true
        }
      });
      // TODO: document end of page with type and duration (to ease search)
    }
    try {
      logger.debug({ source: 'page', message: 'closing page', pageId });
      await page?.close();
    } catch (error) {
      logger.error({ source: 'page', message: 'page.close failed', error, pageId, data: {} });
    }
    setTaskAsStopped();
  }
};
