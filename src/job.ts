import { BrowserFactory } from './browsers/factory.js';
import type { Configuration } from './configuration/Configuration.js';
import { Modes } from './configuration/Modes.js';
import { logger } from './logger.js';
import { Platform } from './Platform.js';

export const execute = async (configuration: Configuration) => {
  const inject = await Platform.readFile(Platform.join(__dirname, './inject/inject.js'), 'utf8');

  if (configuration.mode === Modes.version) {
    const packageFile = await Platform.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageFile);
    console.log(packageJson.version);
  } else if (configuration.mode === Modes.help) {
    console.log('Please check https://arnaudbuchholz.github.io/ui5-test-runner/');
  } else
    try {
      logger.start(configuration);
      if (!configuration.url) {
        logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
        throw new Error('stop');
      }
      // Simple test
      const browser = await BrowserFactory.build('puppeteer');
      await browser.setup({});
      const urls = configuration.url;
      const pages = [];
      for (const url of urls) {
        const page = await browser.newWindow({
          scripts: [inject],
          url
        });
        pages.push(page);
      }
      const done = false;
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        for (const [index, url_] of urls.entries()) {
          const page = pages[index]!;
          const url = url_.split('/test/')[1];
          try {
            // Value must be serializable...
            const value = await page.eval("window['ui5-test-runner']");
            console.log(url, value);
          } catch {
            console.log(url, 'error');
          }
        }
      }
      for (const page of pages) {
        await page.close();
      }
      await browser.shutdown();
    } catch (error) {
      logger.error({ source: 'job', message: 'An error occurred', error });
    } finally {
      await logger.stop();
      console.log('🧢 done.');
    }
};
