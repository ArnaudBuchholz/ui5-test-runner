import { BrowserFactory } from './browsers/factory.js';
import type { Configuration } from './configuration/Configuration.js';
import { Modes } from './configuration/Modes.js';
import { logger } from './logger.js';
import { parallelize } from './parallelize.js';
import { Platform } from './Platform.js';

export const execute = async (configuration: Configuration) => {
  if (configuration.mode === Modes.version) {
    const packageFile = await Platform.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageFile) as { version: string };
    console.log(packageJson.version);
  } else if (configuration.mode === Modes.help) {
    console.log('Please check https://arnaudbuchholz.github.io/ui5-test-runner/');
  } else {
    const agent = await Platform.readFile(Platform.join(__dirname, './agent/agent.js'), 'utf8');
    try {
      logger.start(configuration);
      if (!configuration.url) {
        logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
        throw new Error('stop');
      }
      const urls = configuration.url;
      const browser = await BrowserFactory.build('puppeteer');
      await browser.setup({});
      await parallelize(
        async (url: string) => {
          const page = await browser.newWindow({
            scripts: [agent],
            url
          });
          const label = url.split('/test/')[1];
          let inProgress = true;
          while (inProgress) {
            try {
              // Value must be serializable...
              const value = (await page.eval("window['ui5-test-runner']")) as {
                status: 'pending' | 'done';
                type: 'suite' | 'unknown' | 'QUnit';
                pages: string[];
              };
              console.log(label, value);
              if (value.status === 'done') {
                inProgress = false;
                if (value.type === 'suite') {
                  for (const page of value.pages) {
                    const pageUrl = new URL(page, url).toString();
                    urls.push(pageUrl);
                  }
                }
              }
            } catch {
              console.log(label, 'error');
            }
          }
          await page.close();
        },
        urls,
        2
      );
      await browser.shutdown();
    } catch (error) {
      logger.error({ source: 'job', message: 'An error occurred', error });
    } finally {
      await logger.stop();
      console.log('🧢 done.');
    }
  }
};
