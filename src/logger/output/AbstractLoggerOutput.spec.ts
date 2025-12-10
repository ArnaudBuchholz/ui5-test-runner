import { it, expect, beforeEach, vi } from 'vitest';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types';
import { LogLevel } from '../types.js';
import { ANSI_YELLOW, ANSI_WHITE, ANSI_RED } from '../../terminal/ansi.js';
import { Platform } from '../../Platform.js';

class TestLoggerOutput extends AbstractLoggerOutput {
  constructor() {
    super({
      reportDir: './tmp'
    } as Configuration);
  }

  override addTextToLoggerOutput(): void {}
}

vi.setSystemTime(new Date('2025-12-10T00:00:00.000Z'));
const loggerOuput = new TestLoggerOutput();
const addTextToLoggerOutput = vi.spyOn(loggerOuput, 'addTextToLoggerOutput');

beforeEach(() => vi.clearAllMocks());

it('render usual traces', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.info,
    message: 'test'
  } as InternalLogAttributes);
  const expectedString = `   ${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
  expect(addTextToLoggerOutput).toHaveBeenCalledWith(expectedString, Platform.stripVTControlCharacters(expectedString));
  expect(Platform.writeFileSync).toHaveBeenCalledWith(
    'tmp/output.txt',
    Platform.stripVTControlCharacters(expectedString),
    { encoding: 'utf8', flag: 'a' }
  );
});

it('render usual traces with data', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.info,
    message: 'test',
    data: { hello: 'world !' }
  } as InternalLogAttributes);
  const expectedString = `   ${ANSI_YELLOW}00:00${ANSI_WHITE} test {"hello":"world !"}\n`;
  expect(addTextToLoggerOutput).toHaveBeenCalledWith(expectedString, Platform.stripVTControlCharacters(expectedString));
  expect(Platform.writeFileSync).toHaveBeenCalledWith(
    'tmp/output.txt',
    Platform.stripVTControlCharacters(expectedString),
    { encoding: 'utf8', flag: 'a' }
  );
});

it('render usual traces with error', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.info,
    message: 'test',
    error: { name: 'Error', message: 'ko' }
  } as InternalLogAttributes);
  const expectedString = `   ${ANSI_YELLOW}00:00${ANSI_WHITE} test ${ANSI_RED}Error ko\n`;
  expect(addTextToLoggerOutput).toHaveBeenCalledWith(expectedString, Platform.stripVTControlCharacters(expectedString));
  expect(Platform.writeFileSync).toHaveBeenCalledWith(
    'tmp/output.txt',
    Platform.stripVTControlCharacters(expectedString),
    { encoding: 'utf8', flag: 'a' }
  );
});

it('does not render progress traces', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'progress',
    level: LogLevel.info,
    message: 'test'
  } as InternalLogAttributes);
  expect(addTextToLoggerOutput).not.toHaveBeenCalled();
});

it('does not render metric traces', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'metric',
    level: LogLevel.info,
    message: 'test'
  } as InternalLogAttributes);
  expect(addTextToLoggerOutput).not.toHaveBeenCalled();
});

it('does not render debug traces', () => {
  loggerOuput.addAttributesToLoggerOutput({
    timestamp: Date.now(),
    source: 'job',
    level: LogLevel.debug,
    message: 'test'
  } as InternalLogAttributes);
  expect(addTextToLoggerOutput).not.toHaveBeenCalled();
});
