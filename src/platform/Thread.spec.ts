import { it, expect, vi, describe, beforeEach, beforeAll } from 'vitest';
import type { Thread as ThreadType } from './Thread.js';
import { BroadcastChannel, Worker } from 'node:worker_threads';
import { workerMain } from './Thread.test.js';
const { Thread } = await vi.importActual<{ Thread: typeof ThreadType }>('./Thread.js');

const THREAD_NAME = 'platform/Thread.test';

vi.mock(import('node:worker_threads'), () => {
  const worker = { on: vi.fn() };
  return {
    BroadcastChannel: vi.fn(),
    isMainThread: true,
    threadId: 0,
    Worker: vi.fn(function () {
      return worker;
    }) as unknown as typeof Worker
  };
});

beforeEach(() => vi.clearAllMocks());

it('provides a BroadcastChannel factory', () => {
  const channel = Thread.createBroadcastChannel('name');
  expect(channel).toBeInstanceOf(BroadcastChannel);
  expect(BroadcastChannel).toHaveBeenCalledWith('name');
});

describe('worker factory', () => {
  it('provides a Worker factory', () => {
    const data = { hello: 'World !' };
    Thread.createWorker(THREAD_NAME, data);
    expect(Worker).toHaveBeenCalledWith(expect.stringMatching(/platform\/workerBootstrap/), {
      execArgv: expect.any(Array) as string[],
      workerData: {
        data,
        path: expect.stringContaining(THREAD_NAME + '.ts') as string
      }
    });
  });

  describe('fibers (NO_WORKERS)', () => {
    beforeAll(() => vi.stubEnv('NO_WORKERS', '1'));

    it('provides a fiber factory', async () => {
      const data = { hello: 'World !' };
      Thread.createWorker(THREAD_NAME, data);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(workerMain).toHaveBeenCalledWith(data);
    });

    it('closes the fiber while listening to the exit event', () => {
      const fiber = Thread.createWorker(THREAD_NAME, {});
      const onExit = vi.fn();
      fiber.on('exit', onExit);
      expect(onExit).toHaveBeenCalledWith(0);
    });
  });
});
