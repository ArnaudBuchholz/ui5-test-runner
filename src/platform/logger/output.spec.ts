import { it, expect, vi, beforeEach } from 'vitest';
import { Thread } from '../index.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import { LoggerOutputFactory } from './output/factory.js';
import { BaseLoggerOutput } from './output/BaseLoggerOutput.js';
import { workerMain } from './output.js';
import type { Configuration } from '../../configuration/Configuration.js';

class TestLoggerOutput extends BaseLoggerOutput {
  override terminalResized(): void {}
  override addTextToLoggerOutput(): void {}
  override closeLoggerOutput(): void {}
}

const terminalResized = vi.spyOn(TestLoggerOutput.prototype, 'terminalResized');
const addTextToLoggerOutput = vi.spyOn(TestLoggerOutput.prototype, 'addTextToLoggerOutput').mockReturnValue();
const addAttributesToLoggerOutput = vi
  .spyOn(TestLoggerOutput.prototype, 'addAttributesToLoggerOutput')
  .mockReturnValue();
const closeLoggerOutput = vi.spyOn(TestLoggerOutput.prototype, 'closeLoggerOutput').mockReturnValue();
vi.spyOn(LoggerOutputFactory, 'build').mockImplementation(
  (configuration) => new TestLoggerOutput(configuration, Date.now())
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  workerMain({ configuration: { cwd: './tmp', reportDir: './tmp' } as Configuration, startedAt: Date.now() });
});

it('broadcasts an initial { ready: true }', () => {
  const channel = Thread.createBroadcastChannel('logger');
  expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', source: 'output' } satisfies LogMessage);
});

it('displays an initial message', () => {
  expect(addTextToLoggerOutput).toHaveBeenCalled();
});

it('forwards log attributes to the loggerOutput after the sort window', () => {
  const channel = Thread.createBroadcastChannel('logger');
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
  channel.postMessage(logMessage);
  expect(addAttributesToLoggerOutput).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(addAttributesToLoggerOutput).toHaveBeenCalledWith(logMessage);
});

it('sorts log messages by timestamp before forwarding', () => {
  const channel = Thread.createBroadcastChannel('logger');
  const makeLog = (timestamp: number): LogMessage => ({
    command: 'log',
    timestamp,
    level: LogLevel.info,
    processId: 1,
    threadId: 2,
    isMainThread: true,
    source: 'job',
    message: `t=${timestamp}`
  });
  channel.postMessage(makeLog(200));
  channel.postMessage(makeLog(50));
  channel.postMessage(makeLog(150));
  vi.runAllTimers();
  expect(addAttributesToLoggerOutput.mock.calls.map((c) => (c[0] as { timestamp: number }).timestamp)).toStrictEqual([
    50, 150, 200
  ]);
});

it('forwards terminal width to the loggerOutput', () => {
  const channel = Thread.createBroadcastChannel('logger');
  const logMessage: LogMessage = {
    command: 'terminal-resized',
    width: 80
  };
  channel.postMessage(logMessage);
  expect(terminalResized).toHaveBeenCalledWith(80);
});

it('flushes pending messages immediately on terminate then closes', () => {
  const channel = Thread.createBroadcastChannel('logger');
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
  channel.postMessage(logMessage);
  channel.postMessage({ command: 'terminate' });
  expect(addAttributesToLoggerOutput).toHaveBeenCalledWith(logMessage);
  expect(channel.close).toHaveBeenCalled();
  expect(closeLoggerOutput).toHaveBeenCalled();
});
