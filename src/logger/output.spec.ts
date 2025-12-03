import { it, expect, vi, beforeEach } from 'vitest';
import { Platform } from '../Platform.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import { LoggerOutputFactory } from './output/factory.js';
import { LoggerOutputRenderer } from './output/LoggerOutputRenderer.js';

const appendToLoggerOutput = vi.fn();
const closeLoggerOutput = vi.fn();
vi.spyOn(LoggerOutputFactory, 'build').mockReturnValue({
  appendToLoggerOutput,
  closeLoggerOutput
});
const render = vi.spyOn(LoggerOutputRenderer, 'render').mockReturnValue('log');

vi.useFakeTimers();

vi.mock('../Platform.js', () => {
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const Platform = {
    workerData: { configuration: { cwd: './tmp', reportDir: './tmp' } },
    createBroadcastChannel: vi.fn(() => channel)
  };
  return { Platform };
});

beforeEach(() => vi.clearAllMocks());

const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: LogMessage) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  channel.onmessage({ data } as any);

it('broadcasts an initial { ready: true }', async () => {
  await import('./output.js');
  const channel = Platform.createBroadcastChannel('logger');
  expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', source: 'output' } satisfies LogMessage);
});

it('closes the broadcast channel and the loggerOutput when the terminate signal is received', async () => {
  await import('./output.js');
  const channel = Platform.createBroadcastChannel('logger');
  postMessage(channel, { command: 'terminate' });
  expect(channel.close).toHaveBeenCalled();
  expect(closeLoggerOutput).toHaveBeenCalled();
});

it('logs traces if renderer allows it', async () => {
  await import('./output.js');
  const channel = Platform.createBroadcastChannel('logger');
  const logMessage: LogMessage = {
    command: 'log',
    timestamp: 123,
    level: LogLevel.info,
    processId: 1,
    threadId: 2,
    isMainThread: true,
    source: 'job',
    message: 'Hello World !'
  };
  postMessage(channel, logMessage);
  expect(render).toHaveBeenCalledWith(
    Platform.workerData.configuration,
    vi.getMockedSystemTime()?.getTime(),
    logMessage
  );
  expect(appendToLoggerOutput).toHaveBeenCalledWith('log');
});

it('does not log traces if renderer denies it', async () => {
  await import('./output.js');
  const channel = Platform.createBroadcastChannel('logger');
  const logMessage: LogMessage = {
    command: 'log',
    timestamp: 123,
    level: LogLevel.info,
    processId: 1,
    threadId: 2,
    isMainThread: true,
    source: 'job',
    message: 'Hello World !'
  };
  render.mockReturnValueOnce();
  postMessage(channel, logMessage);
  expect(render).toHaveBeenCalledWith(
    Platform.workerData.configuration,
    vi.getMockedSystemTime()?.getTime(),
    logMessage
  );
  expect(appendToLoggerOutput).not.toHaveBeenCalledWith('log');
});
