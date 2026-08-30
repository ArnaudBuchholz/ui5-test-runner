import { logger, Path } from '../../platform/index.js';
import { Folder } from '../../utils/node/Folder.js';
import { setTimeout } from 'node:timers/promises';
import type { IWindow } from '../../browsers/IBrowser.js';
import type { AgentState } from '../../types/AgentState.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { Configuration } from '../../configuration/Configuration.js';

const screenshotTimeoutError = async (ms: number) => {
  await setTimeout(ms);
  throw new Error('screenshot timeout');
};

export const makeScreenshotHandlers = (configuration: Configuration) => {
  const { screenshot, screenshotOnFailure, screenshotTimeout, reportDir } = configuration;

  const takeScreenshot = async (page: IWindow, name: string): Promise<string> => {
    await Folder.create(reportDir);
    const filename = `${name}.png`;
    const absolutePath = Path.join(reportDir, filename);
    await Promise.race([page.screenshot(absolutePath), screenshotTimeoutError(screenshotTimeout)]);
    return filename;
  };

  const handlePendingScreenshot = async (page: IWindow, pageId: number): Promise<void> => {
    if (!screenshot) return;
    const agentState = (await page.eval("window['ui5-test-runner'].state")) as AgentState;
    if (agentState.type !== 'QUnit' || !agentState.pendingScreenshot) return;
    const testId = agentState.currentTestId ?? String(pageId);
    const logIndex = agentState.currentLogIndex;
    try {
      const filename = await takeScreenshot(page, `${pageId}-${testId}-${logIndex}`);
      logger.debug({ source: 'page', message: 'screenshot taken', pageId, data: { filename } });
    } catch (error) {
      logger.error({ source: 'page', message: 'screenshot failed', error, pageId });
    }
    await page.eval("window['ui5-test-runner'].state.pendingScreenshot = false");
  };

  const handleFailureScreenshot = async (
    page: IWindow,
    pageId: number,
    testResults: CommonTestReport['results']
  ): Promise<void> => {
    if (!screenshotOnFailure || testResults.tests.every((t) => t.status !== 'failed')) return;
    try {
      const path = await takeScreenshot(page, `${pageId}-failure`);
      logger.debug({ source: 'page', message: 'failure screenshot taken', pageId, data: { path } });
      for (const test of testResults.tests) {
        if (test.status === 'failed') {
          test.screenshot = path;
        }
      }
    } catch (error) {
      logger.error({ source: 'page', message: 'failure screenshot failed', error, pageId });
    }
  };

  return { handlePendingScreenshot, handleFailureScreenshot };
};
