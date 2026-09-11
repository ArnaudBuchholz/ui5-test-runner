import type { Configuration } from '../configuration/Configuration.js';
import type { IBrowser, IWindow } from './IBrowser.js';
import { factory as puppeteerFactory } from './puppeteer.js';
import { factory as playwrightFactory } from './playwright.js';
import { factory as webdriverioFactory } from './webdriverio.js';
import { assert, Exit, logger } from '../platform/index.js';

export type Browser = 'puppeteer' | 'playwright' | 'webdriverio' | 'selenium-webdriver';

const notImplemented = () => {
  assert(false, 'Not implemented');
};

const factories: { [key in Browser]: (configuration: Configuration, signal: AbortSignal) => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory,
  playwright: playwrightFactory,
  webdriverio: webdriverioFactory,
  'selenium-webdriver': notImplemented
};

let _instanceCount = 0;

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
    const abortController = new AbortController();
    let inner: IBrowser;
    try {
      logger.debug({ source: browser, message: 'build' });
      inner = await factories[browser](configuration, abortController.signal);
      logger.debug({ source: browser, message: 'build completed' });
    } catch (error) {
      logger.fatal({ source: browser, message: 'build failed', error });
      throw error;
    }
    let task: ReturnType<typeof Exit.registerAsyncTask> | undefined;
    return {
      async setup(settings) {
        task = Exit.registerAsyncTask({
          name: `${browser}#${++_instanceCount}`,
          async stop() {
            abortController.abort();
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
          return wrapWindow(innerWindow, browser, pageId);
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
        await shutdown(browser, inner);
        task?.[Symbol.dispose]();
      }
    };
  }
};

const wrapWindow = (innerWindow: IWindow, source: Browser, pageId: number): IWindow => ({
  async eval(script) {
    logger.debug({ source, message: 'eval', pageId, data: { script } });
    try {
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
      await innerWindow.screenshot(path);
      logger.debug({ source, message: 'screenshot completed', pageId, data: { path } });
    } catch (error) {
      logger.error({ source, message: 'screenshot failed', pageId, error, data: { path } });
      throw error;
    }
  },
  async close() {
    logger.debug({ source, message: 'window close', pageId });
    try {
      await innerWindow.close();
      logger.debug({ source, message: 'window closed', pageId });
    } catch (error) {
      logger.error({ source, message: 'window close failed', error });
    }
  }
});
