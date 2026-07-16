import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, Http, Process } from './platform/index.js';
import type { IProcess } from './platform/index.js';
import type { Configuration } from './configuration/Configuration.js';
import { Command } from './Command.js';
import { start } from './start.js';

vi.mock('./platform/mock.js');
vi.spyOn(Command, 'parse');

const CWD = '/test/cwd';
const START_URL = 'http://localhost:8080/health';
const START_TIMEOUT = 5000;

const NO_START_CONFIGURATION = { cwd: CWD } as unknown as Configuration;
const START_CONFIGURATION = { cwd: CWD, start: 'my-server --port 8080' } as unknown as Configuration;
const START_WITH_WAIT_CONFIGURATION = {
  cwd: CWD,
  start: 'my-server --port 8080',
  startWaitUrl: START_URL,
  startWaitMethod: 'GET',
  startTimeout: START_TIMEOUT
} as unknown as Configuration;

const makeProcess = (code?: number): IProcess => ({
  pid: 123,
  stdout: '',
  stderr: '',
  closed: Promise.resolve(),
  code,
  kill: vi.fn().mockResolvedValue(undefined)
});

const makeOkResponse = (): Response => ({ ok: true, status: 200 }) as Response;
const makeNotOkResponse = (): Response => ({ ok: false, status: 503 }) as Response;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  vi.mocked(Command.parse).mockResolvedValue(['my-server', ['--port', '8080']]);
});

describe('start', () => {
  describe('when configuration.start is not set', () => {
    it('returns undefined without spawning a process', async () => {
      const result = await start(NO_START_CONFIGURATION);
      expect(result).toBeUndefined();
      expect(Process.spawn).not.toHaveBeenCalled();
    });
  });

  describe('when configuration.start is set without startWaitUrl', () => {
    beforeEach(() => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess());
    });

    it('logs info before running the command', async () => {
      await start(START_CONFIGURATION);
      expect(logger.info).toHaveBeenCalledWith({ source: 'job', message: 'Executing start command...' });
      expect(logger.info).toHaveBeenCalledWith({
        source: 'progress',
        message: 'Executing start command',
        pageId: undefined,
        data: { value: 0, max: 0 }
      });
    });

    it('parses the command with Command.parse', async () => {
      await start(START_CONFIGURATION);
      expect(Command.parse).toHaveBeenCalledWith(START_CONFIGURATION, 'my-server --port 8080');
    });

    it('spawns the process with parsed command, cwd, and detached options', async () => {
      await start(START_CONFIGURATION);
      expect(Process.spawn).toHaveBeenCalledWith('my-server', ['--port', '8080'], {
        cwd: CWD,
        windowsHide: true,
        detached: true
      });
    });

    it('returns the spawned process', async () => {
      const spawnedProcess = makeProcess();
      vi.mocked(Process.spawn).mockReturnValue(spawnedProcess);
      const result = await start(START_CONFIGURATION);
      expect(result).toBe(spawnedProcess);
    });
  });

  describe('when startWaitUrl is set', () => {
    it('logs info about waiting for the URL', async () => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess());
      vi.mocked(Http.fetch).mockResolvedValue(makeOkResponse());
      await start(START_WITH_WAIT_CONFIGURATION);
      expect(logger.info).toHaveBeenCalledWith({
        source: 'job',
        message: 'Waiting for start URL to be reachable',
        data: { url: START_URL }
      });
      expect(logger.info).toHaveBeenCalledWith({
        source: 'progress',
        message: 'Waiting for start URL to be reachable',
        pageId: undefined,
        data: { value: 0, max: 0 }
      });
    });

    it('returns the process when the URL responds with ok on the first poll', async () => {
      const spawnedProcess = makeProcess();
      vi.mocked(Process.spawn).mockReturnValue(spawnedProcess);
      vi.mocked(Http.fetch).mockResolvedValue(makeOkResponse());
      const result = await start(START_WITH_WAIT_CONFIGURATION);
      expect(result).toBe(spawnedProcess);
    });

    it('polls Http.fetch with the configured method and abort signal', async () => {
      vi.mocked(Process.spawn).mockReturnValue(makeProcess());
      vi.mocked(Http.fetch).mockResolvedValue(makeOkResponse());
      await start(START_WITH_WAIT_CONFIGURATION);
      expect(Http.fetch).toHaveBeenCalledWith(START_URL, {
        method: 'GET',
        signal: expect.any(AbortSignal) as unknown
      });
    });

    it('retries polling when the URL responds with a non-ok status', async () => {
      vi.useFakeTimers();
      vi.mocked(Process.spawn).mockReturnValue(makeProcess());
      vi.mocked(Http.fetch)
        .mockResolvedValueOnce(makeNotOkResponse())
        .mockResolvedValueOnce(makeNotOkResponse())
        .mockResolvedValueOnce(makeOkResponse());
      const promise = start(START_WITH_WAIT_CONFIGURATION);
      await vi.runAllTimersAsync();
      await promise;
      expect(Http.fetch).toHaveBeenCalledTimes(3);
    });

    it('retries polling when Http.fetch throws', async () => {
      vi.useFakeTimers();
      vi.mocked(Process.spawn).mockReturnValue(makeProcess());
      vi.mocked(Http.fetch)
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce(makeOkResponse());
      const promise = start(START_WITH_WAIT_CONFIGURATION);
      await vi.runAllTimersAsync();
      await promise;
      expect(Http.fetch).toHaveBeenCalledTimes(3);
    });

    it('kills the process and throws when the timeout fires', async () => {
      vi.useFakeTimers();
      const spawnedProcess = makeProcess();
      vi.mocked(Process.spawn).mockReturnValue(spawnedProcess);
      vi.mocked(Http.fetch).mockRejectedValue(new Error('ECONNREFUSED'));
      const promise = start(START_WITH_WAIT_CONFIGURATION);
      const expectation = expect(promise).rejects.toThrow(`Timeout while waiting for ${START_URL}`);
      await vi.advanceTimersByTimeAsync(START_TIMEOUT);
      await expectation;
      expect(spawnedProcess.kill).toHaveBeenCalled();
    });

    it('throws with the exit code when the process exits before the URL is reachable', async () => {
      vi.useFakeTimers();
      const spawnedProcess = makeProcess(1);
      vi.mocked(Process.spawn).mockReturnValue(spawnedProcess);
      vi.mocked(Http.fetch).mockRejectedValue(new Error('ECONNREFUSED'));
      const promise = start(START_WITH_WAIT_CONFIGURATION);
      const expectation = expect(promise).rejects.toThrow('Start command failed with exit code 1');
      await vi.runAllTimersAsync();
      await expectation;
      expect(spawnedProcess.kill).not.toHaveBeenCalled();
    });

    it('does not sleep after a successful response', async () => {
      vi.useFakeTimers();
      const spawnedProcess = makeProcess();
      vi.mocked(Process.spawn).mockReturnValue(spawnedProcess);
      vi.mocked(Http.fetch).mockResolvedValue(makeOkResponse());
      const promise = start(START_WITH_WAIT_CONFIGURATION);
      // Resolve without advancing timers — no sleep should block the return
      await promise;
      expect(Http.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
