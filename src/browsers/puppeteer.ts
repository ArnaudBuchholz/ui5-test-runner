import { logger, Exit, Process } from '../platform/index.js';
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
      try {
        browser = await launch({
          headless: true,
          defaultViewport: null,
          handleSIGINT: false
        });
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Could not find Chrome')) {
          logger.info({ source: 'puppeteer', message: 'Installing chrome' });
          await Process.spawn('npx', 'puppeteer browsers install chrome'.split(' '), {
            shell: true
          }).closed;
          browser = await launch({
            headless: false,
            defaultViewport: null,
            handleSIGINT: false
          });
        } else {
          throw error;
        }
      }
      logger.debug({ source: 'puppeteer', message: 'setup completed' });
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
      logger.debug({ source: 'puppeteer', message: 'newWindow completed', data: settings });
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
      logger.debug({ source: 'puppeteer', message: 'shutdown' });
      // TODO close any remaining pages
      await browser?.close();
      task.unregister();
    }
  };
};
