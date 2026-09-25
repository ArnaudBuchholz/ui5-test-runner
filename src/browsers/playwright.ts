import { logger, Process, assert } from '../platform/index.js';
import type { BrowserCapabilities, BrowserDriverDescriptor, BrowserSettings, IBrowser } from './IBrowser.js';
import type { BrowserType, Browser, BrowserContext } from 'playwright';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { handleNetworkResponse } from './networkResponse.js';
import { getExtraChromeArguments } from './chromeArguments.js';

export const descriptor: BrowserDriverDescriptor = {
  supportedBrowsers: ['chromium', 'firefox', 'webkit'],
  defaultBrowser: 'chromium',
  screenshotFormat: '.png'
};

export const factory = async (configuration: Configuration, signal: AbortSignal): Promise<IBrowser> => {
  const playwright = await Npm.import(configuration, 'playwright');
  const { chromium } = playwright as { chromium: BrowserType };
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let isFirstWindow = true;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    logger.debug({ source: 'playwright', message: 'launching browser' });
    try {
      browser = await chromium.launch({
        headless: !settings.visible,
        handleSIGINT: false,
        args: getExtraChromeArguments()
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
          handleSIGINT: false,
          args: getExtraChromeArguments()
        });
      } else {
        throw error;
      }
    }
    context = await browser.newContext({
      viewport: settings.viewport ?? null // null = no fixed viewport (use window size)
    });
    return {
      browserName: browser.browserType().name(),
      browserVersion: browser.version()
    };
  };

  return {
    async setup(settings) {
      return await launchAndInstallIfNeeded(settings);
    },

    async newWindow(settings) {
      let page;
      if (isFirstWindow) {
        isFirstWindow = false;
        const existingPages = context?.pages();
        page = existingPages?.[0] ?? (await context?.newPage());
      } else {
        page = await context?.newPage();
      }
      assert(page !== undefined);
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
          handleNetworkResponse(
            pageId,
            request.url(),
            request.method(),
            response.status(),
            request.headers(),
            response.headers()
          );
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
          await page.goto('about:blank');
          await page.close();
        }
      };
    },

    async shutdown() {
      await browser?.close();
    }
  };
};
