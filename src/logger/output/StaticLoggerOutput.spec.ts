import { it, expect, beforeEach, vi } from 'vitest';
import { StaticLoggerOutput } from './StaticLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Platform } from '../../Platform.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';

vi.useFakeTimers();
vi.setSystemTime(new Date('2025-12-12T00:00:00.000Z'));
beforeEach(() => vi.clearAllMocks());

const loggerOuput = new StaticLoggerOutput({
  reportDir: './tmp',
  outputInterval: 250
} as Configuration);
const addToReport = vi.spyOn(loggerOuput, 'addToReport');

it('does not output if called on addTextToLoggerOutput', () => {
  loggerOuput.addTextToLoggerOutput();
  expect(Platform.writeOnTerminal).not.toHaveBeenCalled();
});

it('writes all output from addToReport', () => {
  loggerOuput.addToReport('hello');
  expect(Platform.writeOnTerminal).toHaveBeenCalledWith('hello');
});

it('dumps nothing when no progress', async () => {
  await vi.advanceTimersToNextTimerAsync();
  expect(addToReport).not.toHaveBeenCalled();
});

it('dumps progress report using an interval', async () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'progress',
    level: LogLevel.info,
    message: 'test1',
    data: {
      uid: 'task1',
      value: 1,
      max: 10
    }
  } as InternalLogAttributes);
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'progress',
    level: LogLevel.info,
    message: 'test2',
    data: {
      uid: 'task2',
      value: 9,
      max: 10
    }
  } as InternalLogAttributes);
  await vi.advanceTimersToNextTimerAsync();
  expect(addToReport).toHaveBeenCalledWith(`
   00:00|Progress
   -----+--------
`);
  expect(addToReport).toHaveBeenCalledWith(expect.stringContaining('10% test1\n'));
  expect(addToReport).toHaveBeenCalledWith(expect.stringContaining('90% test2\n'));
});

it('clears the interval on closeLoggerOutput', async () => {
  loggerOuput.closeLoggerOutput();
  await vi.advanceTimersToNextTimerAsync();
  expect(addToReport).not.toHaveBeenCalled();
});
