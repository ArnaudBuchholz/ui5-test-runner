import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, Process, Host } from '../../platform/index.js';
import type { IProcess } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import { task } from './task.js';

vi.mock('../../platform/mock.js');

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

const makeProcess = (code = 0): IProcess => ({
  pid: 42,
  stdout: '',
  stderr: '',
  closed: Promise.resolve(),
  code,
  kill: vi.fn().mockResolvedValue(undefined)
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(Host, { env: {} });
});

describe('task()', () => {
  it('sets UI5TR_BATCH_MODE=1 in the child environment', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void task(makeConfig(), makeItem());
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.any(Array) as unknown,
      expect.objectContaining({ env: expect.objectContaining({ UI5TR_BATCH_MODE: '1' }) as unknown })
    );
  });

  it('passes batchItem.args as the first parameters', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void task(makeConfig(), makeItem({ args: ['--cwd', '/my/path'] }));
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    expect(parameters.slice(0, 2)).toEqual(['--cwd', '/my/path']);
  });

  it('appends --report-dir when reportDir is CLI-sourced', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem({ id: 'abc123' });
    void task(makeConfig({ reportDir: 'cli' }), item);
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    expect(parameters).toContain('--report-dir');
    expect(parameters).toContain(`${REPORT_DIR}/abc123`);
  });

  it('does not append --report-dir when reportDir is not CLI-sourced', () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    void task(makeConfig({}), makeItem());
    const [, parameters] = vi.mocked(Process.spawn).mock.calls[0]!;
    expect(parameters).not.toContain('--report-dir');
  });

  it('logs ✔️ and sets statusCode when child exits with code 0', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
    const item = makeItem();
    await task(makeConfig(), item);
    expect(item.statusCode).toBe(0);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('✔️') as unknown })
    );
  });

  it('logs ❌ and sets statusCode when child exits with non-zero code', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(1));
    const item = makeItem();
    await task(makeConfig(), item);
    expect(item.statusCode).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('❌') as unknown })
    );
  });

  it('sets start and end timestamps on the batch item', async () => {
    vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    const item = makeItem();
    await task(makeConfig(), item);
    expect(item.start).toBeInstanceOf(Date);
    expect(item.end).toBeInstanceOf(Date);
  });
});
