import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Exit as ExitType, IAsyncTask, IRegisteredAsyncTask } from './Exit.js';
import { logger } from './logger.js';
const { Exit } = await vi.importActual<{ Exit: typeof ExitType }>('./Exit.js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Undocumented API
vi.spyOn(process as any, '_getActiveHandles').mockReturnValue([]);
vi.spyOn(console, 'log').mockImplementation(() => {});

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

beforeEach(() => vi.clearAllMocks());

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

    it('does not fail if trying to unregister twice (because it may happen)', () => {
      expect(() => registered.unregister()).not.toThrowError();
    });

    it('fails when registering a task during shutdown', () => {
      expect(() => Exit.registerAsyncTask(task)).toThrowError('Exiting application');
    });
  });
});

describe('handles', () => {
  const undocumentedProcess = process as { _getActiveHandles?: () => unknown[] };
  const getHandlesMock = vi.spyOn(undocumentedProcess, '_getActiveHandles');

  beforeEach(() => {
    Object.assign(Exit, { _enteringShutdown: false });
  });

  describe('documenting handles', () => {
    const handles: {
      label: string;
      handles: unknown[];
      logType: 'warn' | 'debug';
      message: string;
    }[] = [
      {
        label: 'ChildProcess',
        handles: [
          {
            constructor: {
              name: 'ChildProcess'
            },
            pid: 123,
            spawnargs: ['a', 'b']
          }
        ],
        logType: 'warn',
        message: 'possible leak ChildProcess pid: 123 a,b'
      },
      {
        label: 'ChildProcess (no spawnargs)',
        handles: [
          {
            constructor: {
              name: 'ChildProcess'
            },
            pid: 123
          }
        ],
        logType: 'warn',
        message: 'possible leak ChildProcess pid: 123 unknown'
      },
      {
        label: 'ReadStream (custom)',
        handles: [
          {
            constructor: {
              name: 'ReadStream'
            },
            fd: 123
          }
        ],
        logType: 'warn',
        message: 'possible leak ReadStream fd: 123'
      },
      {
        label: 'ReadStream (stdin)',
        handles: [
          {
            constructor: {
              name: 'ReadStream'
            },
            fd: 0,
            isTTY: true
          }
        ],
        logType: 'debug',
        message: 'ReadStream stdin isTTY: true'
      },
      {
        label: 'Server',
        handles: [
          {
            constructor: {
              name: 'Server'
            },
            _connections: 1,
            _eventsCount: 2
          }
        ],
        logType: 'warn',
        message: 'possible leak Server connections: 1 events: 2'
      },
      {
        label: 'WriteStream (custom)',
        handles: [
          {
            constructor: {
              name: 'WriteStream'
            },
            fd: 123
          }
        ],
        logType: 'warn',
        message: 'possible leak WriteStream fd: 123'
      },
      {
        label: 'WriteStream (stderr)',
        handles: [
          {
            constructor: {
              name: 'WriteStream'
            },
            fd: 2,
            columns: 40,
            rows: 25,
            isTTY: true
          }
        ],
        logType: 'debug',
        message: 'WriteStream stderr 40x25 isTTY: true'
      },
      {
        label: 'WriteStream (stdout)',
        handles: [
          {
            constructor: {
              name: 'WriteStream'
            },
            fd: 1,
            columns: 40,
            rows: 25,
            isTTY: true
          }
        ],
        logType: 'debug',
        message: 'WriteStream stdout 40x25 isTTY: true'
      }
    ];

    for (const testCase of handles) {
      it(testCase.label, async () => {
        getHandlesMock.mockReturnValue(testCase.handles);
        await Exit.shutdown();
        expect(logger[testCase.logType]).toHaveBeenCalledWith({
          source: 'exit/handle',
          message: testCase.message
        });
      });
    }
  });
});
