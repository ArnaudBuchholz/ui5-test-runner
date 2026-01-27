import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Exit as ExitType, IAsyncTask, IRegisteredAsyncTask } from './Exit.js';
import { logger } from './logger.js';
const { Exit } = await vi.importActual<{ Exit: typeof ExitType }>('./Exit.js');
import { ServerResponse, ClientRequest } from 'node:http';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Undocumented API
vi.spyOn(process as any, '_getActiveHandles').mockReturnValue([]);
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(Exit, 'shutdown');

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

    it('logs stop error (synchronous)', async () => {
      Object.assign(Exit, { _enteringShutdown: false });
      const error = new Error('Fail');
      Exit.registerAsyncTask({
        name: 'will fail on stop',
        stop: () => {
          throw error;
        }
      });
      await Exit.shutdown();
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'exit',
        message: `Failed while stopping will fail on stop...`,
        error
      });
    });

    it('logs stop error (asynchronous)', async () => {
      Object.assign(Exit, { _enteringShutdown: false });
      const error = new Error('Fail');
      Exit.registerAsyncTask({
        name: 'will fail on stop',
        stop: () => Promise.reject(error)
      });
      await Exit.shutdown();
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'exit',
        message: `Failed while stopping will fail on stop...`,
        error
      });
    });
  });

  describe('sigInt handler', () => {
    it('calls shutdown', () => {
      Exit.sigInt();
      expect(Exit.shutdown).toHaveBeenCalled();
    });
  });
});

describe('handles', () => {
  const undocumentedProcess = process as { _getActiveHandles?: () => unknown[] };
  const getHandlesMock = vi.spyOn(undocumentedProcess, '_getActiveHandles');
  const destroy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(Exit, { _enteringShutdown: false });
  });

  describe('documenting handles', () => {
    const handles: {
      label: string;
      handles: unknown[];
      logType: 'warn' | 'debug';
      destroyed?: true;
      message: string;
    }[] = [
      {
        // ChildProcess
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
        // ChildProcess (no spawnargs)
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
        // One MessagePort
        label: 'One MessagePort',
        handles: [
          {
            constructor: {
              name: 'MessagePort'
            }
          }
        ],
        logType: 'debug',
        message: 'MessagePort unknown'
      },
      {
        // Two MessagePort
        label: 'Two MessagePort',
        handles: [
          {
            constructor: {
              name: 'MessagePort'
            }
          },
          {
            constructor: {
              name: 'MessagePort'
            }
          }
        ],
        logType: 'warn',
        message: 'possible leak MessagePort unknown'
      },
      {
        // ReadStream (custom)
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
        // ReadStream (stdin)
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
        // Server
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
        // Socket (Incoming Request)
        label: 'Socket (Incoming Request)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            _httpMessage: Object.assign(Object.create(ServerResponse.prototype), {
              req: {
                method: 'GET',
                url: 'http://localhost'
              }
            }) as unknown,
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket IncomingRequest GET http://localhost'
      },
      {
        // Socket (Client Request)
        label: 'Socket (Client Request)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            _httpMessage: Object.assign(Object.create(ClientRequest.prototype), {
              method: 'GET',
              host: 'localhost',
              protocol: 'http:',
              path: '/test'
            }) as unknown,
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket ClientRequest GET http://localhost/test'
      },
      {
        // Socket (raw addresses)
        label: 'Socket (raw addresses)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            localAddress: '127.0.0.1',
            localPort: 80,
            remoteAddress: '127.0.0.2',
            remotePort: 99,
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket local 127.0.0.1:80 <-> remote 127.0.0.2:99'
      },
      {
        // Socket (raw local only)
        label: 'Socket (raw local only)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            localAddress: '127.0.0.1',
            localPort: 80,
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket local 127.0.0.1:80'
      },
      {
        // Socket (handle)
        label: 'Socket (handle)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            _handle: {
              constructor: {
                name: 'whatever'
              }
            },
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket whatever'
      },
      {
        // Socket (unknown handle)
        label: 'Socket (unknown handle)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            _handle: {
              constructor: {}
            },
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket handle unknown'
      },
      {
        // Socket (unknown)
        label: 'Socket (unknown)',
        handles: [
          {
            constructor: {
              name: 'Socket'
            },
            destroy
          }
        ],
        logType: 'warn',
        destroyed: true,
        message: 'possible leak Socket unknown'
      },
      {
        // WriteStream (custom)
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
        // WriteStream (stderr)
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
        // WriteStream (stdout)
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
        if (testCase.destroyed) {
          expect(destroy).toHaveBeenCalled();
        } else {
          expect(destroy).not.toHaveBeenCalled();
        }
        expect(logger.warn).not.toHaveBeenCalledWith({
          source: 'exit/handle',
          message: 'Missing process._getActiveHandles'
        });
      });
    }
  });

  it('does not fail if the undocumented API is not available', async () => {
    globalThis.process = {} as typeof process;
    await Exit.shutdown();
    expect(logger.warn).toHaveBeenCalledWith({
      source: 'exit/handle',
      message: 'Missing process._getActiveHandles'
    });
  });
});
