import { logger, Exit, Process } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser } from 'puppeteer';
import { Npm } from '../Npm.js';

export const factory = async (): Promise<IBrowser> => {
  const puppeteer = await Npm.import('puppeteer');
  const { launch } = puppeteer as { launch: typeof launchFunction };
  let browser: Browser | undefined;
  const abortController = new AbortController();
  const { signal } = abortController;
  const task = Exit.registerAsyncTask({
    name: 'puppeteer',
    async stop() {
      abortController.abort();
      await browser?.close();
    }
  });

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    try {
      browser = await launch({
        headless: !settings.visible,
        defaultViewport: null,
        handleSIGINT: false,
        signal
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Could not find Chrome')) {
        logger.info({
          source: 'progress',
          message: 'Installing chrome (puppeteer)',
          data: { uid: '', value: 0, max: 0 }
        });
        await Process.spawn('npx', 'puppeteer browsers install chrome'.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await launch({
          headless: false,
          defaultViewport: null,
          handleSIGINT: false,
          signal
        });
      } else {
        throw error;
      }
    }
    logger.debug({ source: 'puppeteer', message: 'setup completed' });
    return {
      screenshotFormat: '.png'
    };
  };

  return {
    async setup(settings) {
      logger.debug({ source: 'puppeteer', message: 'setup', data: settings });
      try {
        return await launchAndInstallIfNeeded(settings);
      } catch (error) {
        logger.error({ source: 'puppeteer', message: 'setup failed', error });
        task[Symbol.dispose]();
        throw error;
      }
    },

    async newWindow(settings) {
      logger.debug({ source: 'puppeteer', message: 'newWindow', data: settings });
      const page = await browser?.newPage();
      for (const script of settings.scripts) {
        await page?.evaluateOnNewDocument(script);
      }
      await page?.goto(settings.url);
      logger.debug({ source: 'puppeteer', message: 'newWindow completed', data: settings });
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        screenshot(/* path: string */) {
          throw new Error('Not implemented');
        },
        async close() {
          try {
            await page?.close();
          } catch (error) {
            logger.error({ source: 'puppeteer', message: 'page.close failed', error });
          }
        }
      };
    },

    async shutdown() {
      logger.debug({ source: 'puppeteer', message: 'shutdown' });
      try {
        await browser?.close();
      } catch (error) {
        logger.error({ source: 'puppeteer', message: 'browser.close failed', error });
      }
      // TODO close any remaining pages
      task[Symbol.dispose]();
    }
  };
};
