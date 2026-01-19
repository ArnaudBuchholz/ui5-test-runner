import { describe, it, expect, vi } from 'vitest';
import type { Exit as ExitType, IAsyncTask, IRegisteredAsyncTask } from './Exit.js';
const { Exit } = await vi.importActual<{ Exit: typeof ExitType }>('./Exit.js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Undocumented API
vi.spyOn(process as any, '_getActiveHandles').mockReturnValue([]);

it('offers a wrapper for process.exitCode', () => {
  Exit.code = -1;
  expect(process.exitCode).toStrictEqual(-1);
});

it('offers a method to shutdown', () => {
  expect(typeof Exit.shutdown).toStrictEqual('function');
});

const task = {
  name: 'test',
  stop: vi.fn()
} satisfies IAsyncTask;

describe('shutdown', () => {
  describe('asynchronous tasks', () => {
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

    it('fails when registering a task during shutdown', () => {
      expect(() => Exit.registerAsyncTask(task)).toThrowError('Exiting application');
    });
  });
});
