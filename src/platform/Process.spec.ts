import { it, expect, vi, beforeEach, describe } from 'vitest';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import type { Process as ProcessType } from './Process.js';
import { Exit } from './Exit.js';
import { __lastRegisteredExitAsyncTask, __unregisterExitAsyncTask } from './mock.js';
import { Host } from './Host.js';
import { logger } from './logger.js';
const { Process } = await vi.importActual<{ Process: typeof ProcessType }>('./Process.js');

type EventHandler = (...arguments_: unknown[]) => unknown;

const createMockChildProcess = () => {
  const processHandlers = new Map<string, EventHandler[]>();
  const stdoutHandlers = new Map<string, EventHandler[]>();
  const stderrHandlers = new Map<string, EventHandler[]>();

  const registerHandler = (map: Map<string, EventHandler[]>, event: string, handler: EventHandler) => {
    if (!map.has(event)) {
      map.set(event, []);
    }
    map.get(event)!.push(handler);
  };

  return {
    pid: 1000 + (Date.now() % 1000),
    stdout: {
      on: vi.fn((event: string, handler: EventHandler) => {
        registerHandler(stdoutHandlers, event, handler);
      })
    },
    stderr: {
      on: vi.fn((event: string, handler: EventHandler) => {
        registerHandler(stderrHandlers, event, handler);
      })
    },
    on: vi.fn((event: string, handler: EventHandler) => {
      registerHandler(processHandlers, event, handler);
    }),
    // Helper methods to trigger events in tests
    emit: (event: string, ...arguments_: unknown[]) => {
      for (const handler of processHandlers.get(event) ?? []) {
        handler(...arguments_);
      }
    },
    emitStdout: (event: string, ...arguments_: unknown[]) => {
      for (const handler of stdoutHandlers.get(event) ?? []) {
        handler(...arguments_);
      }
    },
    emitStderr: (event: string, ...arguments_: unknown[]) => {
      for (const handler of stderrHandlers.get(event) ?? []) {
        handler(...arguments_);
      }
    }
  };
};

let mockChildProcess: ReturnType<typeof createMockChildProcess> | undefined;

vi.mock(import('node:child_process'), () => ({
  spawn: vi.fn().mockImplementation(() => mockChildProcess)
}));
vi.spyOn(Process.prototype, 'kill');
vi.spyOn(process, 'kill').mockImplementation(() => true);

beforeEach(() => {
  vi.clearAllMocks();
  mockChildProcess = createMockChildProcess();
});

describe('spawn', () => {
  it('allocates a Process instance after calling node.js spawn', () => {
    const options = {};
    const childProcess = Process.spawn('whatever', ['a', 'b'], options);
    expect(spawn).toHaveBeenCalledWith('whatever', ['a', 'b'], options);
    expect(childProcess).toBeInstanceOf(Process);
  });

  it('substitutes node command', () => {
    Process.spawn('node', []);
    expect(spawn).toHaveBeenCalledWith(process.argv[0], [], {});
  });
});

describe('asynchronous task', () => {
  it('registers itself as an async task', () => {
    Process.spawn('node', []);
    expect(Exit.registerAsyncTask).toHaveBeenCalledWith({
      name: expect.stringMatching(/^Process.spawn\(/) as string,
      stop: expect.any(Function) as () => void
    });
  });

  it('uses kill to stop the process', async () => {
    const childProcess = Process.spawn('whatever', []) as ProcessType;
    vi.mocked(childProcess.kill).mockResolvedValueOnce();
    const stopped = __lastRegisteredExitAsyncTask.stop();
    expect(childProcess.kill).toHaveBeenCalled();
    mockChildProcess?.emit('close', 0);
    await stopped;
    expect(__unregisterExitAsyncTask).toHaveBeenCalled();
  });
});

describe('kill', () => {
  let childProcess: ProcessType;

  beforeEach(() => {
    childProcess = Process.spawn('whatever', []) as ProcessType;
  });

  describe('win32', () => {
    beforeEach(() => {
      vi.mocked(Host.platform).mockReturnValue('win32');
    });

    it('uses taskkill', async () => {
      vi.mocked(spawn).mockImplementationOnce(() => {
        let closeHandler: () => void | undefined;
        setTimeout(() => {
          closeHandler?.();
        }, 0);
        return {
          on: (event: string, callback: () => void) => {
            expect(event).toStrictEqual('close');
            closeHandler = callback;
          }
        } as ChildProcess;
      });
      const killed = childProcess.kill();
      expect(spawn).toHaveBeenCalledWith('taskkill', ['/F', '/T', '/PID', childProcess.pid.toString()], {
        windowsHide: true
      });
      await killed;
    });

    it('logs failure to kill', async () => {
      const error = new Error('KO');
      vi.mocked(spawn).mockImplementationOnce(() => {
        throw error;
      });
      await childProcess.kill();
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'process',
        processId: childProcess.pid,
        message: 'unable to kill',
        error
      });
    });
  });

  describe('linux-like', () => {
    beforeEach(() => {
      vi.mocked(Host.platform).mockReturnValue('linux');
    });

    it('first tries to kill the process tree', async () => {
      const killed = childProcess.kill();
      expect(process.kill).toHaveBeenCalledWith(-childProcess.pid);
      expect(process.kill).not.toHaveBeenCalledWith(childProcess.pid);
      await killed;
    });

    it('kills the process only if the tree cannot be killed', async () => {
      vi.mocked(process.kill).mockImplementationOnce(() => {
        throw new Error('NOPE');
      });
      const killed = childProcess.kill();
      expect(process.kill).toHaveBeenCalledWith(-childProcess.pid);
      expect(process.kill).toHaveBeenCalledWith(childProcess.pid);
      await killed;
    });

    it('logs failure to kill', async () => {
      const error = new Error('KO');
      vi.mocked(process.kill).mockImplementation(() => {
        throw error;
      });
      await childProcess.kill();
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'process',
        processId: childProcess.pid,
        message: 'unable to kill',
        error
      });
    });
  });
});
