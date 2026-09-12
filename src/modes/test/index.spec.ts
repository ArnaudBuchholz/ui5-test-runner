import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, Http, logger } from '../../platform/index.js';
import { __lastRegisteredExitAsyncTask } from '../../platform/mock.js';
import type { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';

vi.mock('./report.js', () => ({
  initReportBuilder: vi.fn(),
  getReportBuilder: vi.fn(),
  setReportBrowserInfo: vi.fn()
}));
vi.mock('./browser.js', () => ({ setupBrowser: vi.fn(), getBrowser: vi.fn() }));
vi.mock('./pageTask.js', () => ({ makePageTask: vi.fn(() => vi.fn()) }));
vi.mock('./browserConfig.js', () => ({ initBrowserConfig: vi.fn() }));
vi.mock('./agent.js', () => ({ getAgentSource: vi.fn() }));
vi.mock('./Server.js', () => ({ Server: { start: vi.fn(), stop: vi.fn() } }));
vi.mock('../../reports/saveReport.js', () => ({ saveReport: vi.fn() }));
vi.mock('../../utils/node/Folder.js', () => ({ Folder: { create: vi.fn() } }));
vi.mock('../../utils/shared/parallelize.js', () => ({ parallelize: vi.fn().mockResolvedValue([]) }));
vi.mock('../../start.js', () => ({ start: vi.fn() }));
vi.mock('../../end.js', () => ({ end: vi.fn() }));
vi.mock('../../sendToParentProcess.js', () => ({ sendToParentProcess: vi.fn() }));
vi.mock('./coverage/index.js', () => ({ instrument: vi.fn(), generateReport: vi.fn() }));

import { test as runTest } from './index.js';
import { initReportBuilder, getReportBuilder, setReportBrowserInfo } from './report.js';
import { setupBrowser, getBrowser } from './browser.js';
import { Server } from './Server.js';
import { saveReport } from '../../reports/saveReport.js';
import { Folder } from '../../utils/node/Folder.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { sendToParentProcess } from '../../sendToParentProcess.js';
import { instrument, generateReport } from './coverage/index.js';

const PORT = 8080;
const CAPABILITIES = { browserName: 'chrome', browserVersion: '120', screenshotFormat: 'png' };
const VERSION_JSON = JSON.stringify({ libraries: [{ name: 'sap.ui.core', version: '1.120.0' }] });

const makeBuilder = (summaryOverrides: object = {}) =>
  ({
    report: { results: { summary: { passed: 0, failed: 0, tests: 0, duration: 100, ...summaryOverrides } } },
    finalize: vi.fn(),
    merge: vi.fn()
  }) as unknown as TestReportBuilder;

const makeConfig = (overrides: object = {}): Configuration =>
  ({
    reportDir: '/tmp/report',
    url: ['http://localhost:0/page.html'],
    parallel: 1,
    coverage: false,
    serveOnly: false,
    testsuite: '/test/testsuite.qunit.html',
    ...overrides
  }) as unknown as Configuration;

const setupHappyPath = (summaryOverrides: object = {}) => {
  const builder = makeBuilder(summaryOverrides);
  vi.mocked(getReportBuilder).mockReturnValue(builder);
  vi.mocked(Server.start).mockResolvedValue(PORT);
  vi.mocked(setupBrowser).mockResolvedValue(CAPABILITIES);
  vi.mocked(getBrowser).mockReturnValue({ shutdown: vi.fn().mockResolvedValue(undefined) } as never);
  vi.mocked(Http.getAsText).mockResolvedValue(VERSION_JSON);
  return builder;
};

beforeEach(() => vi.clearAllMocks());

describe('test()', () => {
  it('calls initReportBuilder with the configuration', async () => {
    setupHappyPath();
    const config = makeConfig();
    await runTest(config);
    expect(initReportBuilder).toHaveBeenCalledWith(config);
  });

  it('calls Folder.create with reportDir', async () => {
    setupHappyPath();
    await runTest(makeConfig());
    expect(Folder.create).toHaveBeenCalledWith('/tmp/report');
  });

  it('calls parallelize with port-substituted urls', async () => {
    setupHappyPath();
    await runTest(makeConfig({ url: ['https://x:0/page.html'] }));
    const calledUrls = vi.mocked(parallelize).mock.calls[0]![1] as string[];
    expect(calledUrls[0]).toContain(':8080/');
  });

  it('builds url from testsuite when url is undefined', async () => {
    setupHappyPath();
    await runTest(makeConfig({ url: undefined, testsuite: '/test/suite.html' }));
    const calledUrls = vi.mocked(parallelize).mock.calls[0]![1] as string[];
    expect(calledUrls[0]).toContain('suite.html');
  });

  it('calls saveReport after parallelize', async () => {
    setupHappyPath();
    await runTest(makeConfig());
    expect(saveReport).toHaveBeenCalled();
  });

  it('calls getBrowser().shutdown after run', async () => {
    const fakeBrowser = { shutdown: vi.fn().mockResolvedValue(undefined) };
    setupHappyPath();
    vi.mocked(getBrowser).mockReturnValue(fakeBrowser as never);
    await runTest(makeConfig());
    expect(fakeBrowser.shutdown).toHaveBeenCalled();
  });

  it('calls Server.stop after run', async () => {
    setupHappyPath();
    await runTest(makeConfig());
    expect(Server.stop).toHaveBeenCalled();
  });

  it('calls setReportBrowserInfo with capabilities', async () => {
    setupHappyPath();
    await runTest(makeConfig());
    expect(setReportBrowserInfo).toHaveBeenCalledWith(CAPABILITIES);
  });

  describe('coverage', () => {
    it('calls instrument before Server.start when coverage is enabled', async () => {
      setupHappyPath();
      vi.mocked(generateReport).mockResolvedValue(undefined);
      const order: string[] = [];
      vi.mocked(instrument).mockImplementation(() => {
        order.push('instrument');
        return Promise.resolve();
      });
      vi.mocked(Server.start).mockImplementation(() => {
        order.push('Server.start');
        return Promise.resolve(PORT);
      });
      await runTest(makeConfig({ coverage: true }));
      expect(order.indexOf('instrument')).toBeLessThan(order.indexOf('Server.start'));
    });

    it('calls generateReport when coverage is enabled', async () => {
      setupHappyPath();
      vi.mocked(generateReport).mockResolvedValue(undefined);
      await runTest(makeConfig({ coverage: true }));
      expect(generateReport).toHaveBeenCalled();
    });

    it('merges coverage failure into report when generateReport returns a result', async () => {
      setupHappyPath();
      const failureResult = { summary: { passed: 0, failed: 1, tests: 1 }, tests: [] } as never;
      vi.mocked(generateReport).mockResolvedValue(failureResult);
      const builder = vi.mocked(getReportBuilder)();
      await runTest(makeConfig({ coverage: true }));
      expect(builder.merge).toHaveBeenCalledWith('coverage', failureResult);
    });

    it('does not call getReportBuilder merge for coverage when generateReport returns undefined', async () => {
      const builder = setupHappyPath();
      vi.mocked(generateReport).mockResolvedValue(undefined);
      await runTest(makeConfig({ coverage: true }));
      expect(builder.merge).not.toHaveBeenCalledWith('coverage', expect.anything());
    });
  });

  describe('serveOnly', () => {
    // Advance microtasks until a NEW serveOnly task is registered (different from any previous one)
    const waitForServeOnlyTask = async (previousTask: unknown) => {
      for (let index = 0; index < 30; index++) {
        await Promise.resolve();
        const t = __lastRegisteredExitAsyncTask as { name?: string } | undefined;
        if (t !== previousTask && t?.name === 'serveOnly') break;
      }
    };

    it('registers a serveOnly Exit task', async () => {
      setupHappyPath();
      const previousTask = __lastRegisteredExitAsyncTask as unknown;
      const { promise: runPromise, resolve: finishRun } = Promise.withResolvers<void>();
      void runTest(makeConfig({ serveOnly: true }))
        .then(finishRun)
        .catch(finishRun);
      await waitForServeOnlyTask(previousTask);
      void __lastRegisteredExitAsyncTask.stop();
      await runPromise;
      expect(__lastRegisteredExitAsyncTask.name).toBe('serveOnly');
    });

    it('does not call setupBrowser in serveOnly mode', async () => {
      setupHappyPath();
      const previousTask = __lastRegisteredExitAsyncTask as unknown;
      const { promise: runPromise, resolve: finishRun } = Promise.withResolvers<void>();
      void runTest(makeConfig({ serveOnly: true }))
        .then(finishRun)
        .catch(finishRun);
      await waitForServeOnlyTask(previousTask);
      void __lastRegisteredExitAsyncTask.stop();
      await runPromise;
      expect(setupBrowser).not.toHaveBeenCalled();
    });

    it('does not call parallelize in serveOnly mode', async () => {
      setupHappyPath();
      const previousTask = __lastRegisteredExitAsyncTask as unknown;
      const { promise: runPromise, resolve: finishRun } = Promise.withResolvers<void>();
      void runTest(makeConfig({ serveOnly: true }))
        .then(finishRun)
        .catch(finishRun);
      await waitForServeOnlyTask(previousTask);
      void __lastRegisteredExitAsyncTask.stop();
      await runPromise;
      expect(parallelize).not.toHaveBeenCalled();
    });
  });

  describe('exit code', () => {
    it('sets Exit.code to -1 when there are failed tests', async () => {
      setupHappyPath({ failed: 2 });
      Exit.code = 999;
      await runTest(makeConfig());
      expect(Exit.code).toBe(-1);
    });

    it('does not change Exit.code when there are no failed tests', async () => {
      setupHappyPath({ failed: 0 });
      Exit.code = 999;
      await runTest(makeConfig());
      expect(Exit.code).toBe(999);
    });

    it('calls sendToParentProcess with done event after run', async () => {
      setupHappyPath({ failed: 2, passed: 5, tests: 7 });
      await runTest(makeConfig());
      expect(sendToParentProcess).toHaveBeenCalledWith(expect.objectContaining({ type: 'done' }));
    });
  });

  describe('error handling', () => {
    it('calls logger.error when Server.start rejects', async () => {
      setupHappyPath();
      vi.mocked(Server.start).mockRejectedValue(new Error('boom'));
      await runTest(makeConfig());
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'An error occurred' }));
    });

    it('calls Server.stop even when Server.start rejects', async () => {
      setupHappyPath();
      vi.mocked(Server.start).mockRejectedValue(new Error('boom'));
      await runTest(makeConfig());
      expect(Server.stop).toHaveBeenCalled();
    });

    it('does not call getBrowser().shutdown when browser was never started', async () => {
      const fakeBrowser = { shutdown: vi.fn().mockResolvedValue(undefined) };
      setupHappyPath();
      vi.mocked(getBrowser).mockReturnValue(fakeBrowser as never);
      vi.mocked(Server.start).mockRejectedValue(new Error('boom'));
      await runTest(makeConfig());
      expect(fakeBrowser.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('parallelize on callback', () => {
    it('logs error on failed event', async () => {
      setupHappyPath();
      vi.mocked(parallelize).mockImplementation((_task, _urls, options) => {
        options?.on?.({ type: 'failed', index: 0, input: 'https://x/page.html', error: new Error('fail') });
        return Promise.resolve([]);
      });
      await runTest(makeConfig());
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'page failed' }));
    });

    it('sends progress on completed event', async () => {
      setupHappyPath();
      vi.mocked(parallelize).mockImplementation((_task, _urls, options) => {
        options?.on?.({ type: 'completed', index: 0, input: 'https://x/page.html', output: undefined });
        return Promise.resolve([]);
      });
      await runTest(makeConfig({ url: ['https://x/page.html'] }));
      expect(sendToParentProcess).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'progress', count: 1, total: 1 })
      );
    });
  });
});
