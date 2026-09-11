import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Configuration } from '../../configuration/Configuration.js';
import { Thread, logger } from '../../platform/index.js';
import { __lastRegisteredExitAsyncTask } from '../../platform/mock.js';

vi.mock('reserve', () => ({ serve: vi.fn() }));
vi.mock('./reserve.js', () => ({ buildREserveConfiguration: vi.fn(() => ({})) }));
vi.mock('../../reserveLogger.js', () => ({ logReserve: vi.fn() }));

import { serve } from 'reserve';

const PORT = 8080;
const CONFIGURATION = {} as Configuration;

const makeReserveServer = () => {
  const handlers: Record<string, (payload?: unknown) => void> = {};
  const srv = {
    on: vi.fn((event: string, callback: (payload?: unknown) => void) => {
      handlers[event] = callback;
      return srv;
    }),
    close: vi.fn().mockResolvedValue(undefined),
    __emit: (event: string, payload?: unknown) => handlers[event]?.(payload)
  };
  return srv;
};

// Helper to get the current mocked channel after a module reset
const getChannel = () =>
  vi.mocked(Thread.createBroadcastChannel).mock.results.at(-1)?.value as ReturnType<
    typeof Thread.createBroadcastChannel
  >;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('Server.start', () => {
  it('registers an Exit async task named server', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    getChannel().onmessage({ data: { command: 'ready', port: PORT } } as never);
    await promise;
    expect(__lastRegisteredExitAsyncTask.name).toBe('server');
  });

  it('creates a worker with the correct module path', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    getChannel().onmessage({ data: { command: 'ready', port: PORT } } as never);
    await promise;
    expect(Thread.createWorker).toHaveBeenCalledWith('modes/test/Server', expect.any(Object));
  });

  it('resolves with the port when ready message is received', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    getChannel().onmessage({ data: { command: 'ready', port: PORT } } as never);
    await expect(promise).resolves.toBe(PORT);
  });

  it('rejects with failed to start when error message is received', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    getChannel().onmessage({ data: { command: 'error' } } as never);
    await expect(promise).rejects.toThrow('failed to start');
  });

  it('invokes Server.stop when the registered Exit task stop is called', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    const channel = getChannel();
    channel.onmessage({ data: { command: 'ready', port: PORT } } as never);
    await promise;
    // Calling the exit task stop triggers Server.stop internally (line 34)
    channel.onmessage = undefined as never;
    const stopViaCallback = __lastRegisteredExitAsyncTask.stop();
    channel.onmessage({ data: { command: 'terminated' } } as never);
    await expect(stopViaCallback).resolves.toBeUndefined();
  });

  it('calls assert when an unexpected message command is received (assert throws via logger.fatal)', async () => {
    const { Server } = await import('./Server.js');
    const promise = Server.start(CONFIGURATION);
    // Drive an unexpected command — hits the else branch (line 44); assert throws ExitShutdownError via logger.fatal
    expect(() => getChannel().onmessage({ data: { command: 'terminated' } } as never)).toThrow();
    expect(logger.fatal).toHaveBeenCalled();
    // Resolve the start promise to avoid open handles (the promise resolvers are still pending)
    getChannel().onmessage({ data: { command: 'ready', port: PORT } } as never);
    await promise;
  });
});

describe('Server.stop', () => {
  it('posts terminate and resolves when terminated is received', async () => {
    const { Server } = await import('./Server.js');
    const startPromise = Server.start(CONFIGURATION);
    const channel = getChannel();
    // Resolve start first
    channel.onmessage({ data: { command: 'ready', port: PORT } } as never);
    await startPromise;

    // Clear the start-time handler before stop, because postMessage echoes synchronously
    // and the echo would otherwise trigger assert(false) in the start handler's else branch
    channel.onmessage = undefined as never;
    const stopPromise = Server.stop();
    channel.onmessage({ data: { command: 'terminated' } } as never);
    await expect(stopPromise).resolves.toBeUndefined();
    expect(channel.close).toHaveBeenCalled();
  });

  it('is idempotent: terminate is posted only once when stop is called twice', async () => {
    const { Server } = await import('./Server.js');
    const startPromise = Server.start(CONFIGURATION);
    const channel = getChannel();
    channel.onmessage({ data: { command: 'ready', port: PORT } } as never);
    await startPromise;

    channel.onmessage = undefined as never;
    const stop1 = Server.stop();
    const stop2 = Server.stop(); // second call is idempotent, returns immediately
    channel.onmessage({ data: { command: 'terminated' } } as never);
    await stop1;
    await stop2;

    // postMessage called once for terminate
    const terminateCalls = vi
      .mocked(channel.postMessage)
      .mock.calls.filter(([message]) => (message as { command: string }).command === 'terminate');
    expect(terminateCalls).toHaveLength(1);
  });

  it('ignores non-terminated messages during stop and resolves only on terminated', async () => {
    const { Server } = await import('./Server.js');
    const startPromise = Server.start(CONFIGURATION);
    const channel = getChannel();
    channel.onmessage({ data: { command: 'ready', port: PORT } } as never);
    await startPromise;

    channel.onmessage = undefined as never;
    const stopPromise = Server.stop();
    // Drive a non-terminated message — hits the early return (line 63)
    channel.onmessage({ data: { command: 'ready', port: 9999 } } as never);
    // Promise should still be pending; now drive terminated to resolve
    channel.onmessage({ data: { command: 'terminated' } } as never);
    await expect(stopPromise).resolves.toBeUndefined();
  });
});

describe('workerMain', () => {
  it('creates a broadcast channel and logs Starting server...', async () => {
    vi.mocked(serve as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('skip');
    });
    const { workerMain } = await import('./Server.js');
    workerMain(CONFIGURATION);
    expect(Thread.createBroadcastChannel).toHaveBeenCalledWith('server');
    expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: 'Starting server...' }));
  });

  it('posts ready with port when reserve server emits ready', async () => {
    const srv = makeReserveServer();
    vi.mocked(serve as unknown as ReturnType<typeof vi.fn>).mockReturnValue(srv);
    const { workerMain } = await import('./Server.js');
    workerMain(CONFIGURATION);
    const channel = getChannel();
    srv.__emit('ready', { port: PORT });
    expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', port: PORT });
  });

  it('posts error when reserve server emits error', async () => {
    const srv = makeReserveServer();
    vi.mocked(serve as unknown as ReturnType<typeof vi.fn>).mockReturnValue(srv);
    const { workerMain } = await import('./Server.js');
    workerMain(CONFIGURATION);
    const channel = getChannel();
    srv.__emit('error');
    expect(channel.postMessage).toHaveBeenCalledWith({ command: 'error' });
  });

  it('closes the server and posts terminated when terminate message is received', async () => {
    const srv = makeReserveServer();
    vi.mocked(serve as unknown as ReturnType<typeof vi.fn>).mockReturnValue(srv);
    const { workerMain } = await import('./Server.js');
    workerMain(CONFIGURATION);
    const channel = getChannel();
    // Drive terminate (the echo from postMessage is handled differently in workerMain - it checks command === 'terminate')
    channel.onmessage({ data: { command: 'terminate' } } as never);
    // close returns resolved promise, so flush with a tick
    await Promise.resolve();
    await Promise.resolve();
    expect(srv.close).toHaveBeenCalled();
    expect(channel.postMessage).toHaveBeenCalledWith({ command: 'terminated' });
  });

  it('logs error and posts error when serve throws', async () => {
    vi.mocked(serve as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('bad config');
    });
    const { workerMain } = await import('./Server.js');
    workerMain(CONFIGURATION);
    const channel = getChannel();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'An error occurred while configuring' })
    );
    expect(channel.postMessage).toHaveBeenCalledWith({ command: 'error' });
  });
});
