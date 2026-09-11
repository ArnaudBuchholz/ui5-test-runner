import { logger } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';

type WdioBidiHeaderValue = { type: string; value: string };
type WdioHeader = { name: string; value: string | WdioBidiHeaderValue };
type WdioBrowser = {
  capabilities: { browserName?: string; browserVersion?: string };
  on(event: string, listener: (data: unknown) => void): void;
  off(event: string, listener: (data: unknown) => void): void;
  browsingContextClose(options: { context: string }): Promise<void>;
  browsingContextCreate(options: { type: string; background?: boolean }): Promise<{ context: string }>;
  browsingContextNavigate(options: { context: string; url: string; wait?: string }): Promise<unknown>;
  sessionSubscribe(options: { events: string[] }): Promise<void>;
  scriptAddPreloadScript(options: { functionDeclaration: string; contexts?: string[] }): Promise<unknown>;
  url(url: string): Promise<void>;
  execute<T>(script: string): Promise<T>;
  saveScreenshot(path: string): Promise<void>;
  getWindowHandle(): Promise<string>;
  getWindowHandles(): Promise<string[]>;
  switchToWindow(handle: string): Promise<void>;
  deleteSession(): Promise<void>;
};

const headerValue = (value: string | WdioBidiHeaderValue): string =>
  typeof value === 'string' ? value : (value?.value ?? '');

const headersToObject = (headers: WdioHeader[] | undefined): Record<string, string> =>
  Object.fromEntries((headers ?? []).map(({ name, value }) => [name.toLowerCase(), headerValue(value)]));

export const factory = async (configuration: Configuration): Promise<IBrowser> => {
  const webdriverio = await Npm.import(configuration, 'webdriverio');
  const { remote } = webdriverio as { remote: (options: unknown) => Promise<WdioBrowser> };
  let browser: WdioBrowser | undefined;
  const contextToPageId = new Map<string, number>();
  const openHandles = new Set<string>();
  let windowsOpened = 0;

  return {
    async setup(settings: BrowserSettings): Promise<BrowserCapabilities> {
      logger.debug({ source: 'webdriverio', message: 'launching browser' });
      browser = await remote({
        capabilities: {
          browserName: 'chrome',
          webSocketUrl: true,
          'goog:chromeOptions': {
            args: [
              ...(settings.visible ? [] : ['--headless']),
              '--start-maximized',
              ...(settings.viewport ? [`--window-size=${settings.viewport.width},${settings.viewport.height}`] : [])
            ]
          }
        }
      });
      browser.on('log.entryAdded', (entry) => {
        const e = entry as { type?: string; method?: string; text?: string | null; source?: { context?: string } };
        if (e.type === 'console') {
          const pageId = (e.source?.context !== undefined ? contextToPageId.get(e.source.context) : undefined) ?? -1;
          handleConsoleMessage(e.method ?? 'log', e.text ?? '', pageId);
        }
      });
      await browser.sessionSubscribe({ events: ['network.responseStarted'] });
      browser.on('network.responseStarted', (event) => {
        const e = event as {
          context: string | null;
          request: { url: string; method: string; headers: WdioHeader[] };
          response: { status: number; headers: WdioHeader[] };
        };
        const pageId = (e.context !== null ? contextToPageId.get(e.context) : undefined) ?? -1;
        const statusType = Math.floor(e.response.status / 100);
        const LOG_TYPES = [null, null, null, null, 'warn', 'error'] as const;
        const logType = LOG_TYPES[statusType] ?? 'info';
        logger[logType]({
          source: 'browser/network',
          message: e.request.url,
          pageId,
          data: {
            request: { method: e.request.method, headers: headersToObject(e.request.headers) },
            response: { status: e.response.status, headers: headersToObject(e.response.headers) }
          }
        });
      });
      return {
        screenshotFormat: '.png',
        browserName: browser.capabilities.browserName ?? 'chrome',
        browserVersion: browser.capabilities.browserVersion ?? ''
      };
    },

    async newWindow(settings) {
      const { pageId, scripts, url } = settings;
      const isFirst = windowsOpened === 0;
      windowsOpened++;

      let handle: string;
      let context: string;

      if (isFirst) {
        handle = await browser!.getWindowHandle();
        context = handle;
        contextToPageId.set(context, pageId);
        openHandles.add(handle);
        for (const script of scripts) {
          await browser!.scriptAddPreloadScript({
            functionDeclaration: `() => { ${script} }`,
            contexts: [context]
          });
        }
        await browser!.url(url);
      } else {
        const { context: newContext } = await browser!.browsingContextCreate({ type: 'tab', background: true });
        context = newContext;
        contextToPageId.set(context, pageId);
        for (const script of scripts) {
          await browser!.scriptAddPreloadScript({
            functionDeclaration: `() => { ${script} }`,
            contexts: [context]
          });
        }
        await browser!.browsingContextNavigate({ context, url, wait: 'interactive' });
        const handles = await browser!.getWindowHandles();
        const prevHandles = new Set(openHandles);
        handle = handles.find((h) => !prevHandles.has(h)) ?? context;
        openHandles.add(handle);
      }

      const switchTo = () => browser!.switchToWindow(handle);
      return {
        async eval(script: string) {
          await switchTo();
          return browser!.execute<unknown>(`return (${script})`);
        },
        async screenshot(path: string) {
          await switchTo();
          await browser!.saveScreenshot(path);
        },
        async close() {
          contextToPageId.delete(context);
          openHandles.delete(handle);
          await browser!.browsingContextClose({ context });
        }
      };
    },

    async shutdown() {
      await Promise.all(
        [...contextToPageId.keys()].map((context) =>
          browser!.browsingContextClose({ context }).catch(() => undefined)
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      await browser?.deleteSession();
    }
  };
};
