import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { agentStateMessage, reportError, makePageTask } from './pageTask.js';
import type { AgentState } from '../../types/AgentState.js';
import type { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IParallelizeContext } from '../../utils/shared/parallelize.js';
import { Http, logger, Process } from '../../platform/index.js';
import { ExitShutdownError } from '../../platform/Exit.js';
import { __lastRegisteredExitAsyncTask } from '../../platform/mock.js';

vi.mock('./agent.js', () => ({ getAgentSource: vi.fn().mockResolvedValue('AGENT_SRC') }));
vi.mock('./browser.js', () => ({ getBrowser: vi.fn() }));
vi.mock('./browserConfig.js', () => ({ getBrowserConfigScript: vi.fn(() => 'CONFIG_SCRIPT') }));
vi.mock('./screenshot.js', () => ({
  makeScreenshotHandlers: vi.fn(() => ({
    handlePendingScreenshot: vi.fn().mockResolvedValue(undefined),
    handleFailureScreenshot: vi.fn().mockResolvedValue(undefined)
  }))
}));
vi.mock('./coverage/index.js', () => ({ collect: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../utils/node/timeout.js', () => ({
  getEffectiveTimeout: vi.fn(() => 0),
  isGloballyTimedOut: vi.fn(() => false)
}));
vi.mock('./report.js', () => ({
  getReportBuilder: vi.fn()
}));

import { getReportBuilder } from './report.js';
import { getBrowser } from './browser.js';
import { makeScreenshotHandlers } from './screenshot.js';
import { collect } from './coverage/index.js';
import { isGloballyTimedOut, getEffectiveTimeout } from '../../utils/node/timeout.js';

const LOADING_STATE = { done: false, type: undefined } satisfies AgentState;
const UNKNOWN_STATE = { done: false, type: 'unknown' } satisfies AgentState;
const SUITE_STATE = { done: true, type: 'suite', pages: ['/a.html', '/b.html'] } satisfies AgentState;
const QUNIT_IN_PROGRESS = {
  done: false,
  type: 'QUnit',
  isOpa: false,
  executed: 3,
  errors: 0,
  total: 10,
  pendingScreenshot: false
} satisfies AgentState;
const QUNIT_DONE = {
  done: true,
  type: 'QUnit',
  isOpa: false,
  executed: 10,
  errors: 0,
  total: 10,
  pendingScreenshot: false
} satisfies AgentState;
const OPA_IN_PROGRESS = {
  done: false,
  type: 'QUnit',
  isOpa: true,
  executed: 1,
  errors: 0,
  total: 5,
  pendingScreenshot: false
} satisfies AgentState;
const OPA_DONE = {
  done: true,
  type: 'QUnit',
  isOpa: true,
  executed: 5,
  errors: 0,
  total: 5,
  pendingScreenshot: false
} satisfies AgentState;

const EMPTY_RESULTS = { summary: { passed: 0, failed: 0, tests: 0, duration: 0 }, tests: [] };
const HAPPY_RESULTS = { summary: { passed: 10, failed: 0, tests: 10, duration: 100 }, tests: [] };
const PAGE_URL = 'http://localhost/test/page.html';

describe('agentStateMessage', () => {
  it('returns loading when type is undefined', () => {
    expect(agentStateMessage(LOADING_STATE)).toBe('agent state: loading');
  });

  it('returns unknown when type is unknown', () => {
    expect(agentStateMessage(UNKNOWN_STATE)).toBe('agent state: unknown');
  });

  it('returns suite done', () => {
    expect(agentStateMessage(SUITE_STATE)).toBe('agent state: suite done');
  });

  it('returns QUnit progress when not done', () => {
    expect(agentStateMessage(QUNIT_IN_PROGRESS)).toBe('agent state: QUnit 3/10');
  });

  it('returns QUnit done with final counts', () => {
    expect(agentStateMessage(QUNIT_DONE)).toBe('agent state: QUnit done 10/10');
  });

  it('returns OPA progress for OPA tests', () => {
    expect(agentStateMessage(OPA_IN_PROGRESS)).toBe('agent state: OPA 1/5');
  });
});

describe('reportError', () => {
  it('reports a failed test with the given message when page times out', () => {
    const merge = vi.fn();
    vi.mocked(getReportBuilder).mockReturnValue({ merge } as unknown as TestReportBuilder);
    reportError(PAGE_URL, 'Page timed out');
    expect(merge).toHaveBeenCalledOnce();
    const result = (merge.mock.calls[0] as [string, CommonTestReport['results']])[1];
    expect(result.summary.tests).toStrictEqual(1);
    expect(result.summary.failed).toStrictEqual(1);
    expect(result.tests[0]).toMatchObject({ status: 'failed', message: 'Page timed out, check the logs' });
  });
});

const makeBuilder = () => ({
  report: { results: { summary: { start: 0 } } },
  merge: vi.fn()
});

const makePage = () => ({
  eval: vi.fn(),
  screenshot: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined)
});

const makeContext = (overrides: Partial<IParallelizeContext> = {}): IParallelizeContext => ({
  stop: vi.fn(),
  stopRequested: false,
  ...overrides
});

const makeConfig = (overrides: Record<string, unknown> = {}): Configuration =>
  ({
    screenshot: false,
    pageTimeout: 0,
    globalTimeout: 0,
    ...overrides
  }) as unknown as Configuration;

describe('makePageTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Process.sleep).mockResolvedValue(undefined);
    vi.mocked(isGloballyTimedOut).mockReturnValue(false);
    vi.mocked(makeScreenshotHandlers).mockReturnValue({
      handlePendingScreenshot: vi.fn().mockResolvedValue(undefined),
      handleFailureScreenshot: vi.fn().mockResolvedValue(undefined)
    });
  });

  const setupHappyPath = (evalSequence: unknown[]) => {
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    vi.mocked(Http.fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    const page = makePage();
    let mock = page.eval;
    for (const value of evalSequence) {
      mock = mock.mockResolvedValueOnce(value);
    }
    vi.mocked(getBrowser).mockReturnValue({ newWindow: vi.fn().mockResolvedValue(page) } as never);
    return { builder, page };
  };

  const runTask = async (overrides: Record<string, unknown> = {}, context = makeContext()) => {
    const urls: string[] = [];
    await makePageTask(makeConfig(overrides)).call(context, PAGE_URL, 0, urls);
    return { urls };
  };

  it('skips page and reports error when globally timed out', async () => {
    vi.mocked(isGloballyTimedOut).mockReturnValue(true);
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    const browserMock = { newWindow: vi.fn() };
    vi.mocked(getBrowser).mockReturnValue(browserMock as never);
    await runTask();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Global timeout reached, skipping page' })
    );
    expect(builder.merge).toHaveBeenCalled();
    expect(browserMock.newWindow).not.toHaveBeenCalled();
  });

  it('rejects and logs progress with remove when fetch returns non-ok status', async () => {
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    vi.mocked(Http.fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    const context = makeContext();
    const urls: string[] = [];
    await expect(makePageTask(makeConfig()).call(context, PAGE_URL, 0, urls)).rejects.toThrow();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ remove: true }) as unknown })
    );
    expect(builder.merge).toHaveBeenCalled();
  });

  it('rejects and logs progress with remove when fetch throws', async () => {
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    vi.mocked(Http.fetch).mockRejectedValue(new Error('network error'));
    const context = makeContext();
    const urls: string[] = [];
    await expect(makePageTask(makeConfig()).call(context, PAGE_URL, 0, urls)).rejects.toThrow();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ remove: true }) as unknown })
    );
    expect(builder.merge).toHaveBeenCalled();
  });

  it('completes the loop on done state and calls collect and merge', async () => {
    const { builder } = setupHappyPath([QUNIT_IN_PROGRESS, QUNIT_DONE, HAPPY_RESULTS]);
    await runTask();
    expect(collect).toHaveBeenCalled();
    expect(builder.merge).toHaveBeenCalledWith(PAGE_URL, expect.anything(), expect.anything());
  });

  it('pushes resolved page URLs into urls array and skips merge when state is suite', async () => {
    const { builder } = setupHappyPath([
      { done: true, type: 'suite', pages: ['page1.html'] } satisfies AgentState,
      EMPTY_RESULTS
    ]);
    const { urls } = await runTask();
    const expectedUrl = new URL('page1.html', PAGE_URL).href;
    expect(urls).toContain(expectedUrl);
    expect(builder.merge).not.toHaveBeenCalledWith(PAGE_URL, expect.anything(), expect.anything());
  });

  it('logs error with Unable to detect page type when state type is unknown and done', async () => {
    setupHappyPath([{ done: true, type: 'unknown' } satisfies AgentState, EMPTY_RESULTS]);
    await runTask();
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unable to detect page type' }));
  });

  it('logs error and reports when uncaught error occurs', async () => {
    const { builder } = setupHappyPath([
      {
        done: false,
        type: 'QUnit',
        isOpa: false,
        executed: 0,
        errors: 1,
        total: 5,
        pendingScreenshot: false as const,
        uncaughtErrors: [{ name: 'Error', message: 'boom', stack: 'at /app/test.js', event: 'error' }]
      } satisfies AgentState,
      EMPTY_RESULTS
    ]);
    await runTask();
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Uncaught error' }));
    expect(builder.merge).toHaveBeenCalled();
  });

  it('logs warn and does not fail when uncaught error is the expected QUnit one', async () => {
    setupHappyPath([
      {
        done: false,
        type: 'QUnit',
        isOpa: false,
        executed: 0,
        errors: 0,
        total: 5,
        pendingScreenshot: false as const,
        uncaughtErrors: [
          {
            name: 'Error',
            message: 'Called start() outside of a test context too many times',
            stack: 'at /sap/ui/thirdparty/qunit-2.js',
            event: 'error'
          }
        ]
      } satisfies AgentState,
      QUNIT_DONE,
      EMPTY_RESULTS
    ]);
    await runTask();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Uncaught error (expected)' }));
    expect(logger.error).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'Uncaught error' }));
  });

  it('completes the task when OPA in-progress state is followed by done state', async () => {
    setupHappyPath([OPA_IN_PROGRESS, OPA_DONE, EMPTY_RESULTS]);
    await runTask();
    expect(collect).toHaveBeenCalled();
  });

  it('logs an error and breaks the loop when page.eval throws during state read', async () => {
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    vi.mocked(Http.fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    const page = makePage();
    // First call (state read) throws; second call (results read after loop break) returns EMPTY_RESULTS
    page.eval.mockRejectedValueOnce(new Error('eval failed')).mockResolvedValueOnce(EMPTY_RESULTS);
    vi.mocked(getBrowser).mockReturnValue({ newWindow: vi.fn().mockResolvedValue(page) } as never);
    await runTask();
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'An error occurred' }));
  });

  it('calls handlePendingScreenshot when screenshot is enabled', async () => {
    setupHappyPath([QUNIT_IN_PROGRESS, QUNIT_DONE, HAPPY_RESULTS]);
    const screenshotHandlers = {
      handlePendingScreenshot: vi.fn().mockResolvedValue(undefined),
      handleFailureScreenshot: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(makeScreenshotHandlers).mockReturnValue(screenshotHandlers);
    await runTask({ screenshot: true });
    expect(screenshotHandlers.handlePendingScreenshot).toHaveBeenCalled();
  });

  it('logs page.close failed and still resolves when page.close rejects', async () => {
    const { page } = setupHappyPath([QUNIT_DONE, EMPTY_RESULTS]);
    page.close.mockRejectedValue(new Error('close failed'));
    await expect(runTask()).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'page.close failed' }));
  });

  it('resolves the Exit async task stop after the task completes', async () => {
    setupHappyPath([QUNIT_DONE, HAPPY_RESULTS]);
    await runTask();
    await expect(__lastRegisteredExitAsyncTask.stop()).resolves.toBeUndefined();
  });

  it('calls context.stop with ExitShutdownError when exit task is stopped mid-run', async () => {
    const builder = makeBuilder();
    vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
    vi.mocked(Http.fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    const page = makePage();
    const { promise: evalPromise, resolve: resolveEval } = Promise.withResolvers<unknown>();
    // First eval (state read) blocks; second eval (results read after exit) returns EMPTY_RESULTS
    page.eval.mockReturnValueOnce(evalPromise).mockResolvedValueOnce(EMPTY_RESULTS);
    vi.mocked(getBrowser).mockReturnValue({ newWindow: vi.fn().mockResolvedValue(page) } as never);
    const context = makeContext();
    const taskPromise = makePageTask(makeConfig()).call(context, PAGE_URL, 0, []);
    // With Process.sleep mocked immediate, the task reaches eval after a few microtasks
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    void __lastRegisteredExitAsyncTask.stop();
    expect(context.stop).toHaveBeenCalledWith(expect.any(ExitShutdownError));
    // resolve eval so the task can finish
    resolveEval(QUNIT_DONE);
    await taskPromise;
  });

  describe('page timeout', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.mocked(getEffectiveTimeout).mockReturnValue(0);
    });

    it('logs Page timed out and reports error when page timeout fires', async () => {
      vi.useFakeTimers();
      vi.mocked(getEffectiveTimeout).mockReturnValue(100);
      const builder = makeBuilder();
      vi.mocked(getReportBuilder).mockReturnValue(builder as unknown as TestReportBuilder);
      vi.mocked(Http.fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
      const page = makePage();
      // First eval call (state) blocks until released; subsequent calls return results
      const { promise: evalBlocker, resolve: releaseEval } = Promise.withResolvers<unknown>();
      page.eval
        .mockReturnValueOnce(evalBlocker) // state read — blocks until timeout fires
        .mockResolvedValue(EMPTY_RESULTS); // results read after loop
      vi.mocked(getBrowser).mockReturnValue({ newWindow: vi.fn().mockResolvedValue(page) } as never);
      const taskPromise = makePageTask(makeConfig()).call(makeContext(), PAGE_URL, 0, []);
      await vi.advanceTimersByTimeAsync(200);
      releaseEval(EMPTY_RESULTS);
      await taskPromise;
      expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Page timed out' }));
      const mergeCalls = builder.merge.mock.calls as Array<[string, { summary: { failed: number } }]>;
      const timeoutMergeCall = mergeCalls.find(([, result]) => result.summary.failed === 1);
      expect(timeoutMergeCall).toBeDefined();
      expect(timeoutMergeCall![0]).toBe(PAGE_URL);
    });
  });
});
