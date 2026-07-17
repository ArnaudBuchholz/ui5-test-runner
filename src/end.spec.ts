import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, Exit, Process } from './platform/index.js';
import type { IProcess } from './platform/index.js';
import type { Configuration } from './configuration/Configuration.js';
import { Command } from './Command.js';
import { end } from './end.js';

vi.spyOn(Command, 'parse');

const CWD = '/test/cwd';

const NO_END_CONFIGURATION = { cwd: CWD } as Configuration;
const END_CONFIGURATION = { cwd: CWD, end: 'my-command --flag' } as Configuration;
const END_TIMEOUT = 5000;
const END_WITH_TIMEOUT_CONFIGURATION = {
  cwd: CWD,
  end: 'my-command --flag',
  endTimeout: END_TIMEOUT
} as Configuration;

const DEFAULT_EXIT_CODE = 999;

const makeProcess = (code: number): IProcess => ({
  pid: 123,
  stdout: '',
  stderr: '',
  closed: Promise.resolve(),
  code,
  kill: vi.fn().mockResolvedValue(undefined)
});

beforeEach(() => {
  vi.clearAllMocks();
  Exit.code = DEFAULT_EXIT_CODE;
  vi.mocked(Command.parse).mockResolvedValue(['my-command', ['--flag']]);
});

describe('end', () => {
  describe('when configuration.end is not set', () => {
    it('does nothing', async () => {
      await end(NO_END_CONFIGURATION);
      expect(Process.spawn).not.toHaveBeenCalled();
      expect(Exit.code).toStrictEqual(DEFAULT_EXIT_CODE);
    });
  });

  describe('when configuration.end is set', () => {
    beforeEach(() => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
    });

    it('logs info before running the command', async () => {
      await end(END_CONFIGURATION);
      expect(logger.info).toHaveBeenCalledWith({
        source: 'progress',
        message: 'Executing end command',
        pageId: undefined,
        data: { value: 0, max: 0 }
      });
    });

    it('parses the command with Command.parse', async () => {
      await end(END_CONFIGURATION);
      expect(Command.parse).toHaveBeenCalledWith(END_CONFIGURATION, 'my-command --flag');
    });

    it('spawns the process with parsed command and cwd', async () => {
      await end(END_CONFIGURATION);
      expect(Process.spawn).toHaveBeenCalledWith('my-command', ['--flag'], { cwd: CWD });
    });

    it('sets Exit.code to 0 on clean exit', async () => {
      await end(END_CONFIGURATION);
      expect(Exit.code).toStrictEqual(0);
    });

    it('warns when switching Exit.code from something to 0', async () => {
      Exit.code = 42;
      await end(END_CONFIGURATION);
      expect(logger.warn).toHaveBeenCalledWith({
        source: 'job',
        message: 'Status changed to success by end command'
      });
    });

    it('sets Exit.code to the process exit code', async () => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess(42));
      await end(END_CONFIGURATION);
      expect(Exit.code).toBe(42);
    });

    it('warns when switching Exit.code from 0 to something', async () => {
      Exit.code = 0;
      vi.mocked(Process.spawn).mockReturnValue(makeProcess(42));
      await end(END_CONFIGURATION);
      expect(logger.warn).toHaveBeenCalledWith({
        source: 'job',
        message: 'Status changed to error by end command'
      });
    });
  });

  describe('when endTimeout is set', () => {
    it('sets Exit.code to the process exit code when process finishes in time', async () => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess(3));
      await end(END_WITH_TIMEOUT_CONFIGURATION);
      expect(Exit.code).toBe(3);
    });

    it('kills the process and sets Exit.code to -1 when timeout fires first', async () => {
      vi.useFakeTimers();
      const { promise: closed, resolve: setProcessAsClosed } = Promise.withResolvers<void>();
      const process: IProcess = {
        pid: 123,
        stdout: '',
        stderr: '',
        closed,
        code: undefined,
        kill: vi.fn().mockResolvedValue(undefined)
      };
      vi.mocked(Process.spawn).mockReturnValue(process);

      const promise = end(END_WITH_TIMEOUT_CONFIGURATION);
      await vi.advanceTimersByTimeAsync(END_TIMEOUT);
      setProcessAsClosed();
      await promise;

      expect(process.kill).toHaveBeenCalled();
      expect(logger.fatal).toHaveBeenCalledWith({ source: 'job', message: 'End command timed out, killing' });
      expect(Exit.code).toBe(-1);
      vi.useRealTimers();
    });

    it('does not kill the process when it finishes before the timeout', async () => {
      vi.useFakeTimers();
      const process = makeProcess(0);
      vi.mocked(Process.spawn).mockReturnValue(process);

      await end(END_WITH_TIMEOUT_CONFIGURATION);

      expect(process.kill).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
