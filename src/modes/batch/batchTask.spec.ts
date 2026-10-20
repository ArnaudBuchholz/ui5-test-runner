import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Process, Host, logger, FileSystem } from '../../platform/index.js';
import type { IProcess } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import { batchTask } from './batchTask.js';
import type { SpawnOptionsExtended } from '../../platform/Process.js';

const CWD = '/test/cwd';
const REPORT_DIR = '/test/report';

const makeConfig = (sources: Partial<Record<string, 'cli' | 'config'>> = {}): Configuration =>
  ({
    cwd: CWD,
    reportDir: REPORT_DIR,
    parallel: 2,
    sources
  }) as unknown as Configuration;

const makeItem = (overrides: Partial<IBatchItem> = {}): IBatchItem => ({
  path: '/some/project',
  id: 'abc123',
  label: 'My Project',
  args: ['--cwd', '/some/project'],
  ...overrides
});

const START_TIME = Date.now();

const makeProcess = (code = 0): IProcess => ({
  pid: 42,
  stdout: '',
  stderr: '',
  closed: Promise.resolve(),
  code,
  kill: vi.fn().mockResolvedValue(undefined)
});

const getOnMessage = (): ((data: unknown) => void) => {
  const options = vi.mocked(Process.spawn).mock.calls[0]![2];
  return (options as SpawnOptionsExtended).onMessage!;
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(Host, { env: {} });
});

describe('task()', () => {
  it('sets UI5TR_BATCH_MODE=1 in the child environment', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(makeConfig(), makeItem(), START_TIME);
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.any(Array) as unknown,
      expect.objectContaining({ env: expect.objectContaining({ UI5TR_BATCH_MODE: '1' }) as unknown })
    );
  });

  it('passes batchItem.args parameters', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(makeConfig(), makeItem({ args: ['--cwd', '/my/path'] }), START_TIME);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    const cwdIndex = parameters.indexOf('--cwd');
    expect.assert(cwdIndex !== -1);
    expect(parameters[cwdIndex + 1]).toEqual('/my/path');
  });

  it('suppresses the banner in every child runner', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(makeConfig(), makeItem(), START_TIME);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    expect(parameters).toContain('--no-banner');
  });

  it('provides a fallback child report directory through the environment', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem({ id: 'abc123' });
    void batchTask(makeConfig(), item, START_TIME);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    expect(parameters).not.toContain('--report-dir');
    expect(item.reportDir).toBe(`${REPORT_DIR}/abc123`);
  });

  it('sets the isolated report directory in the child environment', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(makeConfig({}), makeItem(), START_TIME);
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.any(Array) as unknown,
      expect.objectContaining({
        env: expect.objectContaining({ UI5TR_BATCH_REPORT_DIR: `${REPORT_DIR}/abc123` }) as unknown
      })
    );
  });

  it('serializes json-typed options with JSON.stringify when CLI-sourced', () => {
    const browserOptions = { args: ['--disable-gpu'] };
    const config = { ...makeConfig({ browserOptions: 'cli' }), browserOptions } as unknown as Configuration;
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(config, makeItem(), START_TIME);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    const flagIndex = parameters.indexOf('--browser-options');
    expect.assert(flagIndex !== -1);
    expect(parameters[flagIndex + 1]).toStrictEqual(JSON.stringify(browserOptions));
  });

  it('returns the documented batchItem when the batch completes', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
    const item = makeItem();
    const returnedItem = await batchTask(makeConfig(), item, START_TIME);
    expect(returnedItem).toStrictEqual(item);
    expect(returnedItem.statusCode).toStrictEqual(0);
    expect(returnedItem.end).not.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'page', message: expect.stringMatching(/^succeeded .+ \(\d.*\)$/) as unknown })
    );
  });

  it('sets start and end timestamps on the batch item', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem();
    await batchTask(makeConfig(), item, START_TIME);
    expect(item.start).toBeInstanceOf(Date);
    expect(item.end).toBeInstanceOf(Date);
  });

  it('sets skipped to true on the batch item when the skip IPC message is received', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem();
    void batchTask(makeConfig(), item, START_TIME);
    getOnMessage()({ type: 'skip' });
    expect(item.skipped).toBe(true);
  });

  it('skips the item when the global timeout has already elapsed', async () => {
    const config = { ...makeConfig(), globalTimeout: 1 } as unknown as Configuration;
    const item = makeItem();
    const result = await batchTask(config, item, 0);
    expect(Process.spawn).not.toHaveBeenCalled();
    expect(result.skipped).toBe(true);
  });

  it('updates logger on progress IPC message', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(makeConfig(), makeItem(), START_TIME);
    getOnMessage()({ type: 'progress', count: 3, total: 10 });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'progress', data: expect.objectContaining({ value: 3, max: 10 }) as unknown })
    );
  });

  it('uses the report directory communicated by the child', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem();
    void batchTask(makeConfig(), item, START_TIME);
    getOnMessage()({ type: 'report-dir', reportDir: '/resolved/child/report' });
    expect(item.reportDir).toBe('/resolved/child/report');
  });

  it('kills the child process and sets timedOut when the batch timeout elapses', async () => {
    vi.useFakeTimers();
    const { promise: closed, resolve: resolveClose } = Promise.withResolvers<void>();
    const kill = vi.fn().mockImplementation(() => {
      resolveClose();
      return Promise.resolve();
    });
    const neverProcess: IProcess = { pid: 99, stdout: '', stderr: '', closed, code: undefined, kill };
    vi.mocked(Process.spawn).mockReturnValue(neverProcess);
    const item = makeItem();
    const config = { ...makeConfig(), batchTimeout: 50 } as unknown as Configuration;
    const taskPromise = batchTask(config, item, START_TIME);
    await vi.advanceTimersByTimeAsync(50);
    await taskPromise;
    expect(item.timedOut).toBe(true);
    expect(kill).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('logs an error when the child process exits with a non-zero status code', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(1));
    await batchTask(makeConfig(), makeItem(), START_TIME);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'page', message: expect.stringMatching(/^failed .+ \(\d.*\)$/) as unknown })
    );
  });

  it('forwards scalar-typed CLI options with template-string serialization', () => {
    const config = {
      ...makeConfig({ alternateNpmPath: 'cli' }),
      alternateNpmPath: '/custom/npm'
    } as unknown as Configuration;
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void batchTask(config, makeItem(), START_TIME);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    const flagIndex = parameters.indexOf('--alternate-npm-path');
    expect.assert(flagIndex !== -1);
    expect(parameters[flagIndex + 1]).toBe('/custom/npm');
  });

  it('leaves batchItem.message undefined when all tests passed (buildFailureMessage returns undefined)', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(1));
    vi.mocked(FileSystem.readFile).mockResolvedValue(
      JSON.stringify({ results: { tests: [{ status: 'passed', name: 'ok' }] } })
    );
    const item = makeItem();
    await batchTask(makeConfig(), item, START_TIME);
    expect(item.message).toBeUndefined();
  });

  it('uses singular "test failed" when exactly one test failed', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(1));
    vi.mocked(FileSystem.readFile).mockResolvedValue(
      JSON.stringify({ results: { tests: [{ status: 'failed', name: 'the broken test' }] } })
    );
    const item = makeItem();
    await batchTask(makeConfig(), item, START_TIME);
    expect(item.message).toBe('1 test failed: the broken test');
  });

  it('truncates the failure list when names exceed the max message length', async () => {
    const longName = 'a'.repeat(110);
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(1));
    vi.mocked(FileSystem.readFile).mockResolvedValue(
      JSON.stringify({
        results: {
          tests: [
            { status: 'failed', name: longName },
            { status: 'failed', name: 'second' }
          ]
        }
      })
    );
    const item = makeItem();
    await batchTask(makeConfig(), item, START_TIME);
    expect(item.message).toMatch(/…$/);
    expect(item.message!.length).toBeLessThanOrEqual(120);
  });
});
