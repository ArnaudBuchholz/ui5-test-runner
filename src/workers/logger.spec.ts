import { it, expect, vi } from 'vitest';
import { Platform } from '../Platform.js';
import './logger.js';

vi.mock('../Platform.js', async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- TODO: understand the error
  const actual = await importActual<typeof import('../Platform.js')>();
  console.log(actual.Platform.createGzip);
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const Platform = {
    ...actual.Platform,
    createBroadcastChannel: vi.fn(() => channel),
    workerData: { cwd: './tmp' }
  };
  console.log(Platform.createGzip);
  return { Platform };
});

/*const channel = */ Platform.createBroadcastChannel('logger');

it('opens a broadcast channel to communicate with the logger thread', async () => {
  expect(Platform.createBroadcastChannel).toBeCalledTimes(2);
  expect(Platform.createBroadcastChannel).toHaveBeenNthCalledWith(1, 'logger');
  expect(Platform.createBroadcastChannel).toHaveBeenNthCalledWith(2, 'logger');
});
