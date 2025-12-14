import { it, expect, vi, beforeEach } from 'vitest';
import { Platform } from '../Platform.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import { LoggerOutputFactory } from './output/factory.js';
import { BaseLoggerOutput } from './output/BaseLoggerOutput.js';
import { workerMain } from './output.js';
import type { Configuration } from '../configuration/Configuration.js';

const terminalResized = vi.spyOn(BaseLoggerOutput.prototype, 'terminalResized');
const addTextToLoggerOutput = vi.spyOn(BaseLoggerOutput.prototype, 'addTextToLoggerOutput').mockReturnValue();
const addAttributesToLoggerOutput = vi
  .spyOn(BaseLoggerOutput.prototype, 'addAttributesToLoggerOutput')
  .mockReturnValue();
const closeLoggerOutput = vi.spyOn(BaseLoggerOutput.prototype, 'closeLoggerOutput').mockReturnValue();
vi.spyOn(LoggerOutputFactory, 'build').mockImplementation((configuration) => new BaseLoggerOutput(configuration));

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
