import { logger, Process, assert } from '../platform/index.js';
import type { BrowserCapabilities, BrowserDriverDescriptor, BrowserSettings, IBrowser } from './IBrowser.js';
import type { BrowserType, Browser, BrowserContext } from 'playwright';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { handleNetworkResponse } from './networkResponse.js';
import { buildChromeLaunchOptions } from './chromeOptions.js';

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
  let isolation: BrowserSettings['isolation'];
  let contextOptions: ReturnType<typeof buildContextOptions>;

  const buildContextOptions = (settings: BrowserSettings) => ({
    viewport: settings.viewport ?? null, // null = no fixed viewport (use window size)
    httpCredentials: settings.basicAuthentication
      ? { username: settings.basicAuthentication.username, password: settings.basicAuthentication.password.reveal() }
      : undefined
  });

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    const launchOptions = {
      headless: !settings.visible,
      handleSIGINT: false,
      ...buildChromeLaunchOptions(settings.options)
    };
    logger.debug({ source: 'playwright', message: 'launching browser' });
    try {
      browser = await chromium.launch(launchOptions);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Executable doesn')) {
        logger.info({
          source: 'progress',
          message: 'installing chromium (playwright)',
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        const cliPath = await Npm.resolvePackageBinCommand(configuration, 'playwright', 'playwright');
        await Process.spawn('node', [cliPath, 'install', 'chromium'], {
          signal
        }).closed;
        browser = await chromium.launch(launchOptions);
      } else {
        throw error;
      }
    }
    if (isolation !== 'context') {
      context = await browser.newContext(contextOptions);
    }
    return {
      browserName: browser.browserType().name(),
      browserVersion: browser.version()
    };
  };

  return {
    async setup(settings) {
      isolation = settings.isolation;
      contextOptions = buildContextOptions(settings);
      return await launchAndInstallIfNeeded(settings);
    },

    async newWindow(settings) {
      let page;
      let windowContext: BrowserContext | undefined;
      if (isolation === 'context') {
        windowContext = await browser?.newContext(contextOptions);
        page = await windowContext?.newPage();
      } else if (isFirstWindow) {
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
      await page.goto(settings.url, { waitUntil: 'domcontentloaded' });
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        async screenshot(path: string) {
          await page.screenshot({ path });
        },
        async close() {
          if (windowContext) {
            await windowContext.close();
          } else {
            await page.goto('about:blank');
            await page.close();
          }
        }
      };
    },

    async shutdown() {
      await browser?.close();
    }
  };
};
