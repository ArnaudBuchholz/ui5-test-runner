import { describe, it, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { BrowserFactory } from './factory.js';
import type { Browser } from './factory.js';
import type { IBrowser, IWindow } from './IBrowser.js';
import { defaults } from '../configuration/options.js';
import type { Configuration } from '../configuration/Configuration.js';
import { __sourcesRoot, logger, Path } from '../platform/index.js';
// Need to import native APIs to enable testing
import { stat } from 'node:fs/promises';

type TTestBrowserArguments = {
  name: Browser;
  failedSetupTestCases?: {
    label: string;
    setup: () => void | Promise<void>;
  }[];
};

beforeEach(() => vi.clearAllMocks());

export const testBrowser = ({ name, failedSetupTestCases }: TTestBrowserArguments) => {
  let BASE_URL: string;
  const FACTORY_SETTINGS = {
    ...defaults,
    coverageReporters: [],
    mode: 'help',
    sources: {}
  } as const as Configuration;
  const BROWSER_SETTINGS = {} as const;

  beforeAll(() => {
    BASE_URL = process.env['BROWSERS_SERVER_URL'] ?? '';
  });

  describe(name, () => {
    let browser: IBrowser;

    if (failedSetupTestCases) {
      describe('setup failures', () => {
        for (const { label, setup } of failedSetupTestCases)
          it(`fails with fatal when ${label}`, async () => {
            await setup();
            const newBrowser = await BrowserFactory.build(FACTORY_SETTINGS, name);
            await expect(newBrowser.setup(BROWSER_SETTINGS)).rejects.toThrow();
          });
      });
    }

    describe('setup succeeds', () => {
      beforeAll(async () => {
        vi.clearAllMocks();
        browser = await BrowserFactory.build(FACTORY_SETTINGS, name);
        await browser.setup(BROWSER_SETTINGS);
      }, 0);

      afterAll(() => browser.shutdown());

      let testWindows: IWindow[] = [];
      let nextPageId = 0;

      beforeEach(() => {
        testWindows = [];
      });

      afterEach(async () => {
        for (const w of testWindows) {
          try {
            await w.close();
          } catch {
            // ignore
          }
        }
      });

      const openWindow = async (
        settings: Omit<Parameters<IBrowser['newWindow']>[0], 'pageId'>
      ): Promise<{ window: IWindow; pageId: number }> => {
        const pageId = nextPageId++;
        const w = await browser.newWindow({ ...settings, pageId });
        testWindows.push(w);
        return { window: w, pageId };
      };

      const getClosedPages = async (): Promise<number[]> => {
        const response = await fetch(`${BASE_URL}closed`);
        return response.json() as Promise<number[]>;
      };

      const resetClosedPages = async (): Promise<void> => {
        await fetch(`${BASE_URL}closed`, { method: 'DELETE' });
      };

      it('enables creating a window', async () => {
        const { window } = await openWindow({
          scripts: [],
          url: BASE_URL
        });
        expect(window).toBeDefined();
      });

      describe('supports multiple windows', () => {
        beforeEach(() => resetClosedPages());

        describe('shutdown', () => {
          let shutdownBrowser: IBrowser;

          beforeEach(async () => {
            vi.clearAllMocks();
            await resetClosedPages();
            shutdownBrowser = await BrowserFactory.build(FACTORY_SETTINGS, name);
            await shutdownBrowser.setup(BROWSER_SETTINGS);
            await shutdownBrowser.newWindow({ pageId: 1, scripts: [], url: `${BASE_URL}track-close.html?pageId=1` });
            await shutdownBrowser.newWindow({ pageId: 2, scripts: [], url: `${BASE_URL}track-close.html?pageId=2` });
            await shutdownBrowser.newWindow({ pageId: 3, scripts: [], url: `${BASE_URL}track-close.html?pageId=3` });
          });

          afterEach(() => shutdownBrowser.shutdown());

          afterAll(async () => {
            const closed = await getClosedPages();
            expect(closed).toHaveLength(3);
            expect(closed).toContain(1);
            expect(closed).toContain(2);
            expect(closed).toContain(3);
          });

          // Weird but want to benefit from afterEach that shutdowns browser
          it('closes all open pages', () => {
            expect(shutdownBrowser).toBeDefined();
          });
        });

        const runSequence = async (sequence: string) => {
          const windows = new Map<number, IWindow>();
          const slotToPageId = new Map<number, number>();
          const expected: number[] = [];
          for (const token of sequence.split(' ')) {
            const slotId = Number(token.slice(1));
            if (token.startsWith('o')) {
              const pageId = nextPageId++;
              windows.set(
                slotId,
                await browser.newWindow({ pageId, scripts: [], url: `${BASE_URL}track-close.html?pageId=${pageId}` })
              );
              slotToPageId.set(slotId, pageId);
            } else {
              const window = windows.get(slotId) as IWindow;
              await window.close();
              expected.push(slotToPageId.get(slotId)!);
              const snapshot = [...expected];
              await vi.waitFor(async () => expect(await getClosedPages()).toStrictEqual(snapshot));
            }
          }
        };

        it.each(['o1 o2 o3 c1 c2 c3', 'o1 o2 o3 c3 c2 c1', 'o1 o2 c1 o3 c3 c2', 'o1 o2 o3 c2 c1 c3'])(
          '%s',
          (sequence) => runSequence(sequence)
        );
      });

      describe('console', () => {
        it('captures console.log as info', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}console-log.html` });
          await vi.waitFor(() =>
            expect(logger.info).toHaveBeenCalledWith({
              source: 'browser/console',
              message: 'Hello World !',
              pageId,
              data: { type: 'log' }
            })
          );
        });

        it('captures console.warn as warn', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}console-warn.html` });
          await vi.waitFor(() =>
            expect(logger.warn).toHaveBeenCalledWith({
              source: 'browser/console',
              message: 'Hello World !',
              pageId,
              data: { type: 'warn' }
            })
          );
        });

        it('captures console.error as error', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}console-error.html` });
          await vi.waitFor(() =>
            expect(logger.error).toHaveBeenCalledWith({
              source: 'browser/console',
              message: 'Hello World !',
              pageId,
              data: { type: 'error' }
            })
          );
        });

        it('captures console.debug as debug', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}console-debug.html` });
          await vi.waitFor(() =>
            expect(logger.debug).toHaveBeenCalledWith({
              source: 'browser/console',
              message: 'Hello World !',
              pageId,
              data: { type: 'debug' }
            })
          );
        });
      });

      describe('agent', () => {
        it('captures agent logs as debug with browser/agent source', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}agent-log.html` });
          await vi.waitFor(() =>
            expect(logger.debug).toHaveBeenCalledWith({
              source: 'browser/agent',
              message: 'Hello World !',
              pageId,
              data: { type: 'debug' }
            })
          );
        });

        it('captures agent warns as warn with browser/agent source', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}agent-warn.html` });
          await vi.waitFor(() =>
            expect(logger.warn).toHaveBeenCalledWith({
              source: 'browser/agent',
              message: 'Hello World !',
              pageId,
              data: { type: 'warn' }
            })
          );
        });

        it('captures agent errors as error with browser/agent source', async () => {
          const { pageId } = await openWindow({ scripts: [], url: `${BASE_URL}agent-error.html` });
          await vi.waitFor(() =>
            expect(logger.error).toHaveBeenCalledWith({
              source: 'browser/agent',
              message: 'Hello World !',
              pageId,
              data: { type: 'error' }
            })
          );
        });
      });

      describe('network logs', () => {
        let networkPageId: number;
        beforeEach(async () => {
          ({ pageId: networkPageId } = await openWindow({ scripts: [], url: `${BASE_URL}network.html` }));
        });

        it('2xx', async () => {
          await vi.waitFor(() =>
            expect(logger.info).toHaveBeenCalledWith({
              source: 'browser/network',
              message: `${BASE_URL}hello.js`,
              pageId: networkPageId,
              data: {
                request: {
                  method: 'GET',
                  headers: expect.objectContaining({
                    'user-agent': expect.any(String) as string
                  }) as object
                },
                response: {
                  status: 200,
                  headers: expect.objectContaining({
                    'content-type': 'text/javascript; charset=UTF-8'
                  }) as object
                }
              }
            })
          );
        });

        it('4xx', async () => {
          await vi.waitFor(() =>
            expect(logger.warn).toHaveBeenCalledWith({
              source: 'browser/network',
              message: `${BASE_URL}not_found.js`,
              pageId: networkPageId,
              data: {
                request: {
                  method: 'GET',
                  headers: expect.objectContaining({
                    'user-agent': expect.any(String) as string
                  }) as object
                },
                response: {
                  status: 404,
                  headers: expect.objectContaining({
                    // Not found
                    'content-length': '9',
                    'content-type': 'text/plain'
                  }) as object
                }
              }
            })
          );
        });

        it('5xx', async () => {
          await vi.waitFor(() =>
            expect(logger.error).toHaveBeenCalledWith({
              source: 'browser/network',
              message: `${BASE_URL}server_error.js`,
              pageId: networkPageId,
              data: {
                request: {
                  method: 'GET',
                  headers: expect.objectContaining({
                    'user-agent': expect.any(String) as string
                  }) as object
                },
                response: {
                  status: 500,
                  headers: expect.objectContaining({
                    // Internal Server Error
                    'content-length': '21',
                    'content-type': 'text/plain'
                  }) as object
                }
              }
            })
          );
        });
      });

      it('enables initialization script kept after loading the page', async () => {
        const { pageId } = await openWindow({
          scripts: [`window.addEventListener('load', () => { console.log('loaded') })`],
          url: `${BASE_URL}page.html`
        });
        await vi.waitFor(() =>
          expect(logger.info).toHaveBeenCalledWith({
            source: 'browser/console',
            message: 'loaded',
            pageId,
            data: { type: 'log' }
          })
        );
      });

      it('enables eval', async () => {
        const { window } = await openWindow({
          scripts: [`window.addEventListener('load', () => { console.log('loaded') })`],
          url: `${BASE_URL}page.html`
        });
        await vi.waitFor(async () => {
          const value = await window.eval(`document.querySelector('h1').innerText`);
          expect(value).toStrictEqual('Hello World !');
        });
      });

      it('enables screenshots', async () => {
        const { window } = await openWindow({
          scripts: [`window.addEventListener('load', () => { console.log('loaded') })`],
          url: `${BASE_URL}page.html`
        });
        const path = Path.join(__sourcesRoot, `../tmp/browsers/${name}.png`);
        await window.screenshot(path);
        const pathStat = await stat(path);
        expect(pathStat.size).toBeGreaterThan(0);
      });
    });
  });
};
