import type { Configuration } from '../configuration/Configuration.js';
import type { IBrowser, IWindow } from './IBrowser.js';
import { factory as puppeteerFactory } from './puppeteer.js';
import { factory as playwrightFactory } from './playwright.js';
import { assert, Exit, logger } from '../platform/index.js';

export type Browser = 'puppeteer' | 'playwright' | 'webdriverio' | 'selenium-webdriver';

const notImplemented = () => {
  assert(false, 'Not implemented');
};

const factories: { [key in Browser]: (configuration: Configuration, signal: AbortSignal) => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory,
  playwright: playwrightFactory,
  webdriverio: notImplemented,
  'selenium-webdriver': notImplemented
};

let _instanceCount = 0;

export const BrowserFactory = {
  async build(configuration: Configuration, browser: Browser): Promise<IBrowser> {
    const abortController = new AbortController();
    const inner = await factories[browser](configuration, abortController.signal);
    let task: ReturnType<typeof Exit.registerAsyncTask> | undefined;
    return {
      async setup(settings) {
        task = Exit.registerAsyncTask({
          name: `${browser}#${++_instanceCount}`,
          async stop() {
            abortController.abort();
            await inner.shutdown();
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
            error,
            data: { factory: configuration, settings }
          });
          throw error; // unreachable: logger.fatal throws
        }
      },
      async newWindow(settings) {
        const { pageId } = settings;
        logger.debug({ source: browser, message: 'newWindow', pageId, data: settings });
        try {
          const innerWindow = await inner.newWindow(settings);
          logger.debug({ source: browser, message: 'newWindow completed', pageId, data: settings });
          return wrapWindow(innerWindow, browser, pageId);
        } catch (error) {
          logger.fatal({
            source: browser,
            message: 'newWindow failed',
            error,
            data: { factory: configuration, settings }
          });
          throw error; // unreachable: logger.fatal throws
        }
      },
      async shutdown() {
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
        } finally {
          task?.[Symbol.dispose]();
        }
    }
    };
  }
};

const wrapWindow = (innerWindow: IWindow, source: Browser, pageId: number): IWindow => ({
  async eval(script) {
    logger.debug({ source, message: 'eval', pageId, data: { script } });
    try {
      const result = await innerWindow.eval(script);
      logger.debug({ source, message: 'eval completed', pageId, data: { script } });
      return result;
    } catch (error) {
      logger.error({ source, message: 'eval failed', pageId, error, data: { script } });
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
    logger.debug({ source, message: 'window closing', pageId });
    try {
      await innerWindow.close();
    } catch (error) {
      logger.error({ source, message: 'page.close failed', error });
    }
    logger.debug({ source, message: 'window closed', pageId });
  }
});
