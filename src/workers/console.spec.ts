import { it, expect, vi } from 'vitest';
import { Platform } from '../Platform.js';

const spyOnLog = vi.spyOn(console, 'log').mockImplementation(() => {}); // No output

vi.mock('../Platform.js', async () => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Simpler this way
const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: any) => channel.onmessage(data);

it('closes the broadcast channel when the terminate signal is received', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, { data: { terminate: true } });
  expect(channel.close).toHaveBeenCalled();
});

it('logs traces coming in (no filtering for now)', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, {
    data: {
      level: 'debug',
      timestamp: Date.now(),
      processId: 0,
      threadId: 0,
      message: 'Hello World !'
    }
  });
  expect(spyOnLog).toHaveBeenCalled();
});
