import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { Exit as ExitType, IAsyncTask, IRegisteredAsyncTask } from './Exit.js';
const { Exit } = await vi.importActual<{ Exit: typeof ExitType }>('./Exit.js');

it('offers a wrapper for process.exitCode', () => {
  Exit.code = -1;
  expect(process.exitCode).toStrictEqual(-1);
});

it('offers a method to shutdown', () => {
  expect(typeof Exit.shutdown).toStrictEqual('function');
});

describe('shutdown', () => {
  describe('asynchronous tasks', () => {
    const task = {
      name: 'test',
      stop: vi.fn()
    } satisfies IAsyncTask;

    let registered: IRegisteredAsyncTask;

    it('offers a method to register an asynchronous task', () => {
      registered = Exit.registerAsyncTask(task);
      expect(registered).not.toBeUndefined();
      expect(typeof registered.unregister).toStrictEqual('function');
    });

    it('stops the task on shutdown', async () => {
      await Exit.shutdown();
      expect(task.stop).toHaveBeenCalled();
    });
  });

  describe('asynchronous tasks (during shutdown)', () => {
    beforeAll(() => {
      Object.assign(Exit, { _enteringShutdown: false });
    });
  });
});
