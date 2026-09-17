import { BrowserFactory, getDescriptor, isBrowser } from '../../browsers/factory.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, logger } from '../../platform/index.js';

let _browser: IBrowser;
let _capabilities: BrowserCapabilities;

export const setupBrowser = async (configuration: Configuration): Promise<BrowserCapabilities> => {
  const { driver } = configuration;
  if (!isBrowser(driver)) {
    return logger.fatal({ source: 'job', message: `Unknown driver: ${driver}` });
  }
  _browser = await BrowserFactory.build(configuration, driver);
  const { debugKeepBrowserOpen, browserVisible, browserViewportWidth, browserViewportHeight } = configuration;
  const settings: BrowserSettings = {
    visible: browserVisible || debugKeepBrowserOpen,
    viewport: {
      width: browserViewportWidth,
      height: browserViewportHeight
    },
    browser: configuration.browser ?? getDescriptor(driver).defaultBrowser,
    options: configuration.browserOptions
  };
  try {
    _capabilities = await _browser.setup(settings);
  } catch (error) {
    logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
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
