import { it, expect, vi } from 'vitest';
import { Platform } from '../Platform.js';
import type { LogMessage, LogSource } from '../loggerTypes.js';

const spyOnLog = vi.spyOn(console, 'log').mockImplementation(() => {}); // No output

vi.mock('../Platform.js', () => {
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const Platform = {
    workerData: { configuration: { cwd: './tmp', reportDir: './tmp' } },
    join: (a: string, b: string) => `${a}/${b}`,
    createBroadcastChannel: vi.fn(() => channel),
    writeOnTerminal: vi.fn(),
    writeFileSync: vi.fn()
  };
  return { Platform };
});

const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: LogMessage) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  channel.onmessage({ data } as any);

it('closes the broadcast channel when the terminate signal is received', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, { command: 'terminate' });
  expect(channel.close).toHaveBeenCalled();
});

it('logs traces coming in (no filtering for now)', async () => {
  await import('./console.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, {
    command: 'log',
    level: 'info',
    timestamp: Date.now(),
    processId: 0,
    threadId: 0,
    source: 'test' as LogSource,
    message: 'Hello World !'
  } as LogMessage);
  expect(spyOnLog).toHaveBeenCalled();
});
