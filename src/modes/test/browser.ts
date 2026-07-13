import { BrowserFactory } from '../../browsers/factory.js';
import type { Browser } from '../../browsers/factory.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, assert, logger } from '../../platform/index.js';

let _browser: IBrowser;
let _capabilities: BrowserCapabilities;

export const setupBrowser = async (configuration: Configuration): Promise<BrowserCapabilities> => {
  const browserName = configuration.browser as Browser;
  assert(browserName === 'puppeteer' || browserName === 'playwright');
  _browser = await BrowserFactory.build(configuration, browserName);
  const { debugKeepBrowserOpen } = configuration;
  const settings: BrowserSettings = {
    visible: debugKeepBrowserOpen // Or there is no value to keep it
  };
  try {
    _capabilities = await _browser.setup(settings);
  } catch (error) {
    logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
    throw error; // TODO: Use a normalized error with an associated exit code
  }
  if (debugKeepBrowserOpen) {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Called with .call(browser,...)
    const { newWindow } = _browser;
    _browser.newWindow = async (settings) => {
      const window = await newWindow.call(_browser, settings);
      window.close = async () => {};
      return window;
    };
    const { promise, resolve } = Promise.withResolvers<void>();
    Exit.registerAsyncTask({
      name: 'debugKeepBrowserOpen',
      stop: () => resolve()
    });
    _browser.shutdown = () => {
      logger.warn({ source: 'job', message: 'Browser will remain open, use CTRL+C to end command' });
      return promise;
    };
  }
  return _capabilities;
};

export const getBrowser = (): IBrowser => _browser;

export const getBrowserCapabilities = (): BrowserCapabilities => _capabilities;
