import { BrowserFactory } from '../../browsers/factory.js';
import type { BrowserSettings, IBrowser } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, assert, logger } from '../../platform/index.js';

let browser: IBrowser;

export const setupBrowser = async (configuration: Configuration): Promise<IBrowser> => {
  assert(configuration.browser === '$/puppeteer.js'); // TODO: see how to make it compatible
  browser = await BrowserFactory.build('puppeteer');
  const { debugKeepBrowserOpen } = configuration;
  const settings: BrowserSettings = {
    visible: debugKeepBrowserOpen // Or there is no value to keep it
  };
  try {
    await browser.setup(settings);
  } catch (error) {
    logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
    throw error; // TODO: Use a normalized error with an associated exit code
  }
  if (debugKeepBrowserOpen) {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Called with .call(browser,...)
    const { newWindow } = browser;
    browser.newWindow = async (settings) => {
      const window = await newWindow.call(browser, settings);
      window.close = async () => {};
      return window;
    };
    const { promise, resolve } = Promise.withResolvers<void>();
    Exit.registerAsyncTask({
      name: 'debugKeepBrowserOpen',
      stop: () => resolve()
    });
    browser.shutdown = () => {
      logger.warn({ source: 'job', message: 'Browser will remain open, use CTRL+C to end command' });
      return promise;
    };
  }
  return browser;
};

export const getBrowser = (): IBrowser => browser;
