import { it, expect, vi } from 'vitest';
import { Platform } from '../Platform.js';

const spyOnLog = vi.spyOn(console, 'log').mockImplementation(() => {}); // No output

vi.mock('../Platform.js', () => {
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const Platform = {
    createBroadcastChannel: vi.fn(() => channel)
  };
  return { Platform };
});

const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: unknown) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  channel.onmessage({ data } as any);

it('closes the broadcast channel when the terminate signal is received', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, { terminate: true });
  expect(channel.close).toHaveBeenCalled();
});

it('logs traces coming in (no filtering for now)', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, {
    level: 'debug',
    timestamp: Date.now(),
    processId: 0,
    threadId: 0,
    source: 'test',
    message: 'Hello World !'
  });
  expect(spyOnLog).toHaveBeenCalled();
});
