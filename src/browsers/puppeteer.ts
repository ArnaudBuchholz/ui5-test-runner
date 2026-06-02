import { logger, Exit, Process } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser, Page, ConsoleMessageType } from 'puppeteer';
import { Npm } from '../Npm.js';
import type { ILogger } from '../platform/logger/ILogger.js';
import { agentLogPrefix } from '../types/AgentState.js';
import type { LogSource } from '../platform/logger/types.js';
import type { Configuration } from '../configuration/Configuration.js';

export const factory = async (configuration: Configuration): Promise<IBrowser> => {
  const puppeteer = await Npm.import(configuration, 'puppeteer');
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
  let openedPages = 0;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    const launchOptions: Parameters<typeof launch>[0] = {
      headless: !settings.visible,
      defaultViewport: null,
      handleSIGINT: false,
      signal,
      args: ['--start-maximized']
    };
    try {
      browser = await launch(launchOptions);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Could not find Chrome')) {
        // TODO: is there a way to monitor the progress ?
        // YES: using https://pptr.dev/browsers-api/browsers.installoptions
        logger.info({
          source: 'progress',
          message: 'Installing chrome (puppeteer)',
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        await Process.spawn('npx', 'puppeteer browsers install chrome'.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await launch(launchOptions);
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
      let page: Page | undefined;
      if (++openedPages === 1) {
        const pages = await browser?.pages(true);
        page = pages?.[0];
      } else {
        page = await browser?.newPage({
          type: 'window'
        });
      }
      for (const script of settings.scripts) {
        await page?.evaluateOnNewDocument(script);
      }
      const { pageId } = settings;
      page
        ?.on('console', (message) => {
          const LOG_TYPES: { [key in ConsoleMessageType]?: keyof ILogger } = {
            error: 'error',
            warn: 'warn',
            debug: 'debug'
          } as const;
          const logType = LOG_TYPES[message.type()] ?? 'info';
          let source: LogSource;
          let messageText = message.text();
          if (messageText.startsWith(agentLogPrefix)) {
            source = 'browser/agent';
            messageText = messageText.slice(agentLogPrefix.length);
          } else {
            source = 'browser/console';
          }
          logger[logType]({
            source,
            message: messageText,
            pageId,
            data: { type: message.type() }
          });
        })
        ?.on('response', (response) => {
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
