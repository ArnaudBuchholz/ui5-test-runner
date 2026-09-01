import { it, expect, vi, beforeEach, describe } from 'vitest';
import { logger, Path } from '../../platform/index.js';
import { Folder } from '../../utils/node/Folder.js';
import type { IWindow } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { makeScreenshotHandlers } from './screenshot.js';
import { createTestResults } from '../../types/CommonTestReportFormat.js';

vi.mock('../../utils/node/Folder.js', () => ({ Folder: { create: vi.fn() } }));
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn() }));
import { setTimeout as nodeSetTimeout } from 'node:timers/promises';

beforeEach(() => vi.clearAllMocks());

const REPORT_DIR = '/report';
const PAGE_ID = 42;

const BASE_CONFIG = {
  screenshot: true,
  screenshotOnFailure: true,
  screenshotTimeout: 5000,
  reportDir: REPORT_DIR
} as unknown as Configuration;

const makePage = (overrides: Partial<IWindow> = {}): IWindow => ({
  eval: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
  ...overrides
});

const QUnit_STATE_WITH_PENDING = (filename: string) =>
  ({
    type: 'QUnit',
    done: false,
    isOpa: true,
    executed: 0,
    errors: 0,
    total: 1,
    pendingScreenshot: filename
  }) as const;

const QUnit_STATE_NO_PENDING = {
  type: 'QUnit',
  done: false,
  isOpa: true,
  executed: 0,
  errors: 0,
  total: 1,
  pendingScreenshot: false
} as const;

describe('handlePendingScreenshot', () => {
  it('does nothing when pendingScreenshot is false', async () => {
    const { handlePendingScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage();
    await handlePendingScreenshot(page, QUnit_STATE_NO_PENDING, PAGE_ID);
    expect(page.screenshot).not.toHaveBeenCalled();
  });

  it('takes screenshot to the agent-supplied filename and clears the flag', async () => {
    const FILENAME = '42-abc-0.png';
    const { handlePendingScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage({ eval: vi.fn().mockResolvedValue(undefined) });
    await handlePendingScreenshot(page, QUnit_STATE_WITH_PENDING(FILENAME), PAGE_ID);
    expect(Folder.create).toHaveBeenCalledWith(REPORT_DIR);
    expect(page.screenshot).toHaveBeenCalledWith(Path.join(REPORT_DIR, FILENAME));
    expect(page.eval).toHaveBeenCalledWith("window['ui5-test-runner'].state.pendingScreenshot = false");
    expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: 'screenshot taken' }));
  });

  it('logs error and still clears the flag when screenshot throws', async () => {
    const FILENAME = '42-abc-0.png';
    const { handlePendingScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage({
      eval: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockRejectedValue(new Error('disk full'))
    });
    await handlePendingScreenshot(page, QUnit_STATE_WITH_PENDING(FILENAME), PAGE_ID);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'screenshot failed' }));
    expect(page.eval).toHaveBeenCalledWith("window['ui5-test-runner'].state.pendingScreenshot = false");
  });

  it('logs error when screenshot times out', async () => {
    const FILENAME = '42-abc-0.png';
    const { handlePendingScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    vi.mocked(nodeSetTimeout).mockResolvedValue(undefined);
    const page = makePage({
      eval: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockReturnValue(new Promise(() => {}))
    });
    await handlePendingScreenshot(page, QUnit_STATE_WITH_PENDING(FILENAME), PAGE_ID);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'screenshot failed' }));
  });
});

describe('handleFailureScreenshot', () => {
  it('does nothing when screenshotOnFailure is disabled', async () => {
    const config = { ...BASE_CONFIG, screenshotOnFailure: false } as unknown as Configuration;
    const { handleFailureScreenshot } = makeScreenshotHandlers(config);
    const page = makePage();
    const results = createTestResults({ tests: [{ status: 'failed' }] });
    await handleFailureScreenshot(page, PAGE_ID, results);
    expect(page.screenshot).not.toHaveBeenCalled();
  });

  it('does nothing when no tests failed', async () => {
    const { handleFailureScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage();
    const results = createTestResults({ tests: [{ status: 'passed' }] });
    await handleFailureScreenshot(page, PAGE_ID, results);
    expect(page.screenshot).not.toHaveBeenCalled();
  });

  it('takes a failure screenshot and does not modify existing test entries', async () => {
    const { handleFailureScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage();
    const results = createTestResults({ tests: [{ status: 'failed' }, { status: 'passed' }] });
    await handleFailureScreenshot(page, PAGE_ID, results);
    expect(page.screenshot).toHaveBeenCalledWith(Path.join(REPORT_DIR, `${PAGE_ID}-failure.png`));
    expect(results.tests[0]!.screenshot).toBeUndefined();
    expect(results.tests[1]!.screenshot).toBeUndefined();
  });

  it('adds a synthetic other-status test with the screenshot as attachment', async () => {
    const FILENAME = `${PAGE_ID}-failure.png`;
    const { handleFailureScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage();
    const results = createTestResults({ tests: [{ status: 'failed' }] });
    await handleFailureScreenshot(page, PAGE_ID, results);
    const synthetic = results.tests.find((t) => t.name === 'failure screenshot');
    expect(synthetic).toBeDefined();
    expect(synthetic!.status).toBe('other');
    expect(synthetic!.screenshot).toBeUndefined();
    expect(synthetic!.attachments).toEqual([{ name: 'failure screenshot', contentType: 'image/png', path: FILENAME }]);
    expect(results.summary.tests).toBe(2);
    expect(results.summary.other).toBe(1);
  });

  it('logs error when failure screenshot throws', async () => {
    const { handleFailureScreenshot } = makeScreenshotHandlers(BASE_CONFIG);
    const page = makePage({ screenshot: vi.fn().mockRejectedValue(new Error('fail')) });
    const results = createTestResults({ tests: [{ status: 'failed' }] });
    await handleFailureScreenshot(page, PAGE_ID, results);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'failure screenshot failed' }));
  });
});
