import { logger, Exit, logEnvironnement } from '../../platform/index.js';
import type { AgentState } from '../../types/AgentState.js';
import { BrowserFactory } from '../../browsers/factory.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/parallelize.js';
import { getAgentSource } from './agent.js';

/**
 * TODO
 * - log environment
 * - handle coverage
 * - allocate browser
 * - read agent to inject
 * - (legacy) build URL
 * - parallelize
 * - build reports
 */

export const test = async (configuration: Configuration) => {
  logger.start(configuration);
  logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });

  await logEnvironnement();
  const agent = await getAgentSource();
  try {
    if (!configuration.url) {
      logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
      throw new Error('stop');
    }
    const urls = configuration.url;
    const browser = await BrowserFactory.build('puppeteer');
    try {
      await browser.setup({});
    } catch (error) {
      logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
      throw error; // TODO: Use a normalized error with an associated exit code
    }
    logger.info({ source: 'progress', message: 'Executing pages', data: { uid: '', value: 0, max: 0 } });
    let stopRequested = false;
    const promise = parallelize(
      // eslint-disable-next-line sonarjs/cognitive-complexity -- Temporary
      async function (url: string) {
        const page = await browser.newWindow({
          scripts: [agent],
          url
        });
        const label = url.split('/test/')[1];
        let inProgress = true;
        while (inProgress && !stopRequested) {
          try {
            // Value must be serializable...
            const agentState = (await page.eval("window['ui5-test-runner'].state")) as AgentState;
            if (agentState.done) {
              inProgress = false;
              if (agentState.type === 'suite') {
                for (const page of agentState.pages) {
                  const pageUrl = new URL(page, url).toString();
                  urls.push(pageUrl);
                }
              }
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
            logger.error({ source: 'job', message: 'An error occurred', error, data: { label } });
          }
        }
        if (stopRequested) {
          this.stop(new Error('Stop requested'));
        }
        logger.info({
          source: 'progress',
          message: url,
          data: { max: 1, value: 1, uid: url, remove: true }
        });
        await page.close();
      },
      urls,
      2
    );
    const asyncTask = Exit.registerAsyncTask({
      name: 'main job',
      async stop() {
        stopRequested = true;
        await promise;
      }
    });
    await promise;
    asyncTask.unregister();
    await browser.shutdown();
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  }
};
