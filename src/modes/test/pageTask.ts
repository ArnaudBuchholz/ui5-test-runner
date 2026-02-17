import type { IParallelizeContext } from '../../utils/parallelize.js';
import { logger } from '../../platform/logger.js';
import { getAgentSource } from './agent.js';
import { getBrowser } from './browser.js';
import type { AgentState } from '../../types/AgentState.js';
import { Exit, ExitShutdownError } from '../../platform/Exit.js';
import { setTimeout } from 'node:timers/promises';
import { report } from './report.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

export const pageTask = async function (this: IParallelizeContext, url: string, index: number, urls: string[]) {
  const agentSource = await getAgentSource();
  const browser = getBrowser();
  const page = await browser.newWindow({
    scripts: [agentSource],
    url
  });
  const { promise: taskStopped, resolve: setTaskAsStopped } = Promise.withResolvers<void>();
  const asyncTask = Exit.registerAsyncTask({
    name: url,
    stop: async () => {
      try {
        this.stop(new ExitShutdownError());
      } catch {
        // ignore
      }
      await taskStopped;
    }
  });
  while (!this.stopRequested) {
    try {
      await setTimeout(250);
      const agentState = (await page.eval("window['ui5-test-runner'].state")) as AgentState;
      if (agentState.done) {
        if (agentState.type === 'suite') {
          for (const page of agentState.pages) {
            const pageUrl = new URL(page, url).toString();
            urls.push(pageUrl);
          }
        }
        break;
      } else if (agentState.type === 'QUnit' && agentState.total > 0) {
        // TODO: generate a message *only if* the progress changed (otherwise it grows the log file)
        // TODO: hash the URL to generate the UID
        logger.info({
          source: 'progress',
          message: url,
          data: { max: agentState.total, value: agentState.executed, uid: url }
        });
      }
    } catch (error) {
      logger.error({ source: 'job', message: 'An error occurred', error, data: { url } });
    }
  }
  const agentReport = (await page.eval("window['ui5-test-runner'].report")) as CommonTestReport['results'];
  // TODO log report
  report.merge(agentReport);
  logger.info({
    source: 'progress',
    message: url,
    data: { max: 1, value: 1, uid: url, remove: true }
  });
  asyncTask.unregister();
  await page.close();
  setTaskAsStopped();
};
