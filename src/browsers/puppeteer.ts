import type { IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser } from 'puppeteer';
import { Npm } from '../Npm.js';
import { logger } from '../logger.js';
import { Platform } from '../Platform.js';

export const factory = async (): Promise<IBrowser> => {
  const puppeteer = await Npm.import('puppeteer');
  const { launch } = puppeteer as { launch: typeof launchFunction };
  let browser: Browser | undefined;

  return {
    async setup(settings) {
      logger.debug({ source: 'puppeteer', message: 'setup', data: settings });
      browser = await launch({
        headless: false,
        defaultViewport: null,
        handleSIGINT: false
      });
      Platform.registerSigIntHandler(() => {
        // eslint-disable-next-line sonarjs/void-use -- Contradicting with non awaited promise
        void browser?.close();
        browser = undefined;
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
    }
  };
};
