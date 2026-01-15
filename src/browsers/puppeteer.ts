import { logger, Exit } from '../platform/index.js';
import type { IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser } from 'puppeteer';
import { Npm } from '../Npm.js';

export const factory = async (): Promise<IBrowser> => {
  const puppeteer = await Npm.import('puppeteer');
  // TODO: may need to npx puppeteer browsers install chrome
  const { launch } = puppeteer as { launch: typeof launchFunction };
  let browser: Browser | undefined;
  let task: ReturnType<typeof Exit.registerAsyncTask>;

  return {
    async setup(settings) {
      logger.debug({ source: 'puppeteer', message: 'setup', data: settings });
      browser = await launch({
        headless: false,
        defaultViewport: null,
        handleSIGINT: false
      });
      task = Exit.registerAsyncTask({
        name: 'puppeteer',
        async stop() {
          await browser?.close();
        }
      });
      return {
        screenshotFormat: '.png'
      };
    },

    async newWindow(settings) {
      logger.debug({ source: 'puppeteer', message: 'newWindow', data: settings });
      const page = await browser?.newPage();
      for (const script of settings.scripts) {
        await page?.evaluateOnNewDocument(script);
      }
      await page?.goto(settings.url);
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        screenshot(/* path: string */) {
          throw new Error('Not implemented');
        },
        async close() {
          await page?.close();
        }
      };
    },

    async shutdown() {
      // TODO close any remaining pages
      await browser?.close();
      task.unregister();
    }
  };
};
