import { it, expect, vi, beforeEach } from 'vitest';
import { Platform } from '../Platform.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import { LoggerOutputFactory } from './output/factory.js';
import { AbstractLoggerOutput } from './output/AbstractLoggerOutput.js';
import { workerMain } from './output.js';
import type { Configuration } from '../configuration/Configuration.js';

class TestLoggerOutput extends AbstractLoggerOutput {
  terminalResized() {}
  addTextToLoggerOutput() {}
  closeLoggerOutput(): void {}
}

const terminalResized = vi.spyOn(TestLoggerOutput.prototype, 'terminalResized');
const addTextToLoggerOutput = vi.spyOn(TestLoggerOutput.prototype, 'addTextToLoggerOutput').mockReturnValue();
const addAttributesToLoggerOutput = vi
  .spyOn(TestLoggerOutput.prototype, 'addAttributesToLoggerOutput')
  .mockReturnValue();
const closeLoggerOutput = vi.spyOn(TestLoggerOutput.prototype, 'closeLoggerOutput').mockReturnValue();
vi.spyOn(LoggerOutputFactory, 'build').mockImplementation((configuration) => new TestLoggerOutput(configuration));

beforeEach(() => {
  vi.clearAllMocks();
  workerMain({ configuration: { cwd: './tmp', reportDir: './tmp' } as Configuration });
});

it('broadcasts an initial { ready: true }', () => {
  const channel = Platform.createBroadcastChannel('logger');
  expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', source: 'output' } satisfies LogMessage);
});

it('displays an initial message', () => {
  expect(addTextToLoggerOutput).toHaveBeenCalled();
});

it('forwards log attributes to the loggerOutput', () => {
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
  channel.postMessage(logMessage);
  expect(addAttributesToLoggerOutput).toHaveBeenCalledWith(logMessage);
});

it('forwards terminal width to the loggerOutput', () => {
  const channel = Platform.createBroadcastChannel('logger');
  const logMessage: LogMessage = {
    command: 'terminal-resized',
    width: 80
  };
  channel.postMessage(logMessage);
  expect(terminalResized).toHaveBeenCalledWith(80);
});

it('closes the broadcast channel and the loggerOutput when the terminate signal is received', () => {
  const channel = Platform.createBroadcastChannel('logger');
  channel.postMessage({ command: 'terminate' });
  expect(channel.close).toHaveBeenCalled();
  expect(closeLoggerOutput).toHaveBeenCalled();
});
