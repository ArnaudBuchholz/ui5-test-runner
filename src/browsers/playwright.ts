import { logger, Process, assert } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { BrowserType, Browser, Page } from 'playwright';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';

export const factory = async (configuration: Configuration, signal: AbortSignal): Promise<IBrowser> => {
  const playwright = await Npm.import(configuration, 'playwright');
  const { chromium } = playwright as { chromium: BrowserType };
  let browser: Browser | undefined;
  const pages = new Set<Page>();

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    logger.debug({ source: 'playwright', message: 'launching browser' });
    try {
      // TODO define args for chrome
      browser = await chromium.launch({
        headless: !settings.visible,
        handleSIGINT: false
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Executable doesn')) {
        logger.info({
          source: 'progress',
          message: 'Installing chromium (playwright)',
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        await Process.spawn('npx', 'playwright install chromium'.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await chromium.launch({
          headless: !settings.visible,
          handleSIGINT: false
        });
      } else {
        throw error;
      }
    }
    return {
      screenshotFormat: '.png',
      browserName: browser.browserType().name(),
      browserVersion: browser.version()
    };
  };

  return {
    async setup(settings) {
      return await launchAndInstallIfNeeded(settings);
    },

    async newWindow(settings) {
      let page: Page | undefined;
      if (pages.size === 0) {
        const existingPages = browser?.contexts()[0]?.pages();
        page = existingPages?.[0] ?? (await browser?.newPage());
      } else {
        page = await browser?.newPage();
      }
      assert(page !== undefined);
      pages.add(page);
      for (const script of settings.scripts) {
        await page.addInitScript(script);
      }
      const { pageId } = settings;
      page
        .on('console', (message) => {
          handleConsoleMessage(message.type(), message.text(), pageId);
        })
        .on('response', (response) => {
          const request = response.request();
          const statusType = Math.floor(response.status() / 100);
          const LOG_TYPES = [null, null, null, null, 'warn', 'error'] as const;
          const logType = LOG_TYPES[statusType] ?? 'info';
          logger[logType]({
            source: 'browser/network',
            message: request.url(),
            pageId,
            data: {
              request: {
                method: request.method(),
                headers: request.headers()
              },
              response: {
                status: response.status(),
                headers: response.headers()
              }
            }
          });
        });
      await page.goto(settings.url);
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        async screenshot(path: string) {
          await page.screenshot({ path });
        },
        async close() {
          pages.delete(page);
          await page.goto('about:blank');
          await page.close();
        }
      };
    },

    async shutdown() {
      await Promise.all(
        pages.values().map(async (page) => {
          try {
            await page.goto('about:blank');
          } catch {
            /* ignore */
          }
        })
      );
      await browser?.close();
    }
  };
};
