import type { Configuration } from '../configuration/Configuration.js';
import type { BrowserDriverDescriptor, IBrowser, IWindow } from './IBrowser.js';
import { factory as puppeteerFactory, descriptor as puppeteerDescriptor } from './puppeteer.js';
import { factory as playwrightFactory, descriptor as playwrightDescriptor } from './playwright.js';
import { factory as webdriverioFactory, descriptor as webdriverioDescriptor } from './webdriverio.js';
import { factory as seleniumWebdriverFactory, descriptor as seleniumWebdriverDescriptor } from './seleniumWebdriver.js';
import { Exit, logger } from '../platform/index.js';

const BROWSERS = ['puppeteer', 'playwright', 'webdriverio', 'selenium-webdriver'] as const;
export type Browser = (typeof BROWSERS)[number];
export const isBrowser = (value: string): value is Browser => (BROWSERS as readonly string[]).includes(value);

const factories: { [key in Browser]: (configuration: Configuration, signal: AbortSignal) => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory,
  playwright: playwrightFactory,
  webdriverio: webdriverioFactory,
  'selenium-webdriver': seleniumWebdriverFactory
};

const descriptors: { [key in Browser]: BrowserDriverDescriptor } = {
  puppeteer: puppeteerDescriptor,
  playwright: playwrightDescriptor,
  webdriverio: webdriverioDescriptor,
  'selenium-webdriver': seleniumWebdriverDescriptor
};

export const getDescriptor = (driver: Browser): BrowserDriverDescriptor => descriptors[driver];

let _instanceCount = 0;
const _activeInstances = new Set<Browser>();

const shutdown = async (browser: Browser, inner: IBrowser) => {
  logger.debug({ source: browser, message: 'shutdown' });
  try {
    await inner.shutdown();
    logger.debug({ source: browser, message: 'shutdown completed' });
  } catch (error) {
    logger.warn({
      source: browser,
      message: 'shutdown failed',
      error
    });
  }
};

export const BrowserFactory = {
  async build(configuration: Configuration, browser: Browser): Promise<IBrowser> {
    if (_activeInstances.has(browser)) {
      logger.fatal({ source: browser, message: 'build failed: already has an active instance' });
    }
    _activeInstances.add(browser);
    const abortController = new AbortController();
    let inner: IBrowser;
    try {
      logger.debug({ source: browser, message: 'build' });
      inner = await factories[browser](configuration, abortController.signal);
      logger.debug({ source: browser, message: 'build completed' });
    } catch (error) {
      _activeInstances.delete(browser);
      logger.fatal({ source: browser, message: 'build failed', error });
      throw error;
    }
    const _openWindows = new Set<IWindow>();
    const closeAllWindows = async () => {
      await Promise.all(
        [..._openWindows].map(async (w) => {
          try {
            await w.close();
          } catch {
            /* ignore */
          }
        })
      );
    };
    let task: ReturnType<typeof Exit.registerAsyncTask> | undefined;
    return {
      async setup(settings) {
        task = Exit.registerAsyncTask({
          name: `${browser}#${++_instanceCount}`,
          async stop() {
            abortController.abort();
            await closeAllWindows();
            await shutdown(browser, inner);
          }
        });
        logger.debug({ source: browser, message: 'setup', data: settings });
        try {
          const capabilities = await inner.setup(settings);
          logger.debug({ source: browser, message: 'setup completed', data: capabilities });
          return capabilities;
        } catch (error) {
          task[Symbol.dispose]();
          _activeInstances.delete(browser);
          logger.fatal({
            source: browser,
            message: 'setup failed',
            error
          });
          throw error; // unreachable: logger.fatal throws
        }
      },
      async newWindow(settings) {
        const { pageId } = settings;
        logger.debug({ source: browser, message: 'newWindow', pageId, data: settings });
        try {
          const innerWindow = await inner.newWindow(settings);
          logger.debug({ source: browser, message: 'newWindow completed', pageId });
          const wrapped = wrapWindow(innerWindow, browser, pageId, () => _openWindows.delete(wrapped));
          _openWindows.add(wrapped);
          return wrapped;
        } catch (error) {
          logger.fatal({
            source: browser,
            message: 'newWindow failed',
            error
          });
          throw error; // unreachable: logger.fatal throws
        }
      },
      async shutdown() {
        await closeAllWindows();
        await shutdown(browser, inner);
        task?.[Symbol.dispose]();
        _activeInstances.delete(browser);
      }
    };
  }
};

const wrapWindow = (innerWindow: IWindow, source: Browser, pageId: number, onClosed: () => void): IWindow => {
  let closed = false;

  return {
    async eval(script) {
      logger.debug({ source, message: 'eval', pageId, data: { script } });
      try {
        if (closed) {
          throw new Error('window closed');
        }
        const result = await innerWindow.eval(script);
        logger.debug({ source, message: 'eval completed', pageId, data: { result } });
        return result;
      } catch (error) {
        logger.error({ source, message: 'eval failed', pageId, error });
        throw error;
      }
    },
    async screenshot(path) {
      logger.debug({ source, message: 'screenshot', pageId, data: { path } });
      try {
        if (closed) {
          throw new Error('window closed');
        }
        await innerWindow.screenshot(path);
        logger.debug({ source, message: 'screenshot completed', pageId, data: { path } });
      } catch (error) {
        logger.error({ source, message: 'screenshot failed', pageId, error, data: { path } });
        throw error;
      }
    },
    async close() {
      if (closed) {
        logger.warn({ source, message: 'closing an already closed window, ignored', pageId });
        return;
      }
      closed = true;
      logger.debug({ source, message: 'window close', pageId });
      try {
        await innerWindow.close();
        logger.debug({ source, message: 'window closed', pageId });
      } catch (error) {
        logger.error({ source, message: 'window close failed', error });
      } finally {
        onClosed();
      }
    }
  }
};
