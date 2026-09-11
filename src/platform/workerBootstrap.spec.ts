import { describe, it, expect, vi, beforeAll } from 'vitest';
import { logger } from './logger.js';
import { workerMain } from './workerBootstrap.test.js';

const WORKER_DATA = { key: 'value' };

vi.mock(import('node:worker_threads'), () => ({
  workerData: { path: './workerBootstrap.test.js', data: { key: 'value' } }
}));

describe('when workerMain succeeds', () => {
  beforeAll(async () => {
    vi.clearAllMocks();
    workerMain.mockResolvedValue(undefined);
    vi.resetModules();
    vi.doMock('./workerBootstrap.test.js', () => ({ workerMain }));
    await import('./workerBootstrap.js');
    await vi.waitFor(() => expect(workerMain).toHaveBeenCalled());
  });

  it('calls workerMain with the worker data', () => {
    expect(workerMain).toHaveBeenCalledWith(WORKER_DATA);
  });

  it('logs debug on start', () => {
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Worker starting') as string })
    );
  });

  it('logs debug on completion', () => {
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Main completed') as string })
    );
  });
});

describe('when workerMain throws', () => {
  const error = new Error('worker error');

  beforeAll(async () => {
    vi.clearAllMocks();
    workerMain.mockRejectedValue(error);
    vi.mocked(logger.fatal).mockImplementation((() => {}) as unknown as typeof logger.fatal);
    vi.resetModules();
    vi.doMock('./workerBootstrap.test.js', () => ({ workerMain }));
    await import('./workerBootstrap.js');
    await vi.waitFor(() =>
      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Main completed') as string })
      )
    );
  });

  it('logs fatal with the error', () => {
    expect(logger.fatal).toHaveBeenCalledWith(expect.objectContaining({ message: 'An error occurred', error }));
  });

  it('still logs completion in the finally block', () => {
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Main completed') as string })
    );
  });
});
