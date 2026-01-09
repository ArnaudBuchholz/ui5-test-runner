import type { AgentFeedback } from './agent/Feedback.js';
import { BrowserFactory } from './browsers/factory.js';
import type { Configuration } from './configuration/Configuration.js';
import { Modes } from './modes/Modes.js';
import { defaults } from './configuration/options.js';
import { logEnvironnement } from './environment.js';
import { logger } from './logger.js';
import { parallelize } from './parallelize.js';
import { Platform } from './Platform.js';
import { ANSI_BLUE, ANSI_WHITE } from './terminal/ansi.js';
import { version } from './modes/version.js';
import { help } from './modes/help.js';
import { log } from './modes/log.js';
import clean from './clean.js';
const { cleanHandles } = clean;

// TODO: move below modes/
export const execute = async (configuration: Configuration) => {
  if (configuration.mode === Modes.version) {
    await version();
  } else if (configuration.mode === Modes.help) {
    help();
  } else if (configuration.mode === Modes.log) {
    await log(configuration);
  } else {
    // TODO: new mode
    logger.start(configuration);
    logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });

    await logEnvironnement();
    const agent = await Platform.readFile(Platform.join(Platform.sourcesRoot, './agent/agent.js'), 'utf8');
    try {
      if (!configuration.url) {
        logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
        throw new Error('stop');
      }
      logger.info({ source: 'progress', message: 'Executing pages', data: { uid: '', value: 0, max: 0 } });
      const urls = configuration.url;
      const browser = await BrowserFactory.build('puppeteer');
      await browser.setup({});
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
              const feedback = (await page.eval("window['ui5-test-runner']")) as AgentFeedback;
              if (feedback.status === 'done') {
                inProgress = false;
                if (feedback.type === 'suite') {
                  for (const page of feedback.pages) {
                    const pageUrl = new URL(page, url).toString();
                    urls.push(pageUrl);
                  }
                }
              } else if (feedback.type === 'QUnit' && feedback.total > 0) {
                // TODO: generate a message *only if* the progress changed (otherwise it grows the log file)
                // TODO: hash the URL to generate the UID
                logger.info({
                  source: 'progress',
                  message: url,
                  data: { max: feedback.total, value: feedback.executed, uid: url }
                });
              }
            } catch {
              console.log(label, 'error');
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
      Platform.registerSigIntHandler(async () => {
        stopRequested = true;
        await promise;
      });
      await promise;
      await browser.shutdown();
    } catch (error) {
      logger.error({ source: 'job', message: 'An error occurred', error });
    } finally {
      await logger.stop();
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}done.`);
      cleanHandles();
    }
  }
};
