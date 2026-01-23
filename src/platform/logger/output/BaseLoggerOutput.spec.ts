import { it, expect, beforeEach, vi, describe } from 'vitest';
import { FileSystem, Terminal } from '../../index.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types';
import { LogLevel } from '../types.js';
import { ANSI_YELLOW, ANSI_WHITE, ANSI_RED, ANSI_MAGENTA } from '../../../terminal/ansi.js';

class TestLoggerOutput extends BaseLoggerOutput {
  override terminalResized(): void {}
  override addTextToLoggerOutput(): void {}
  override closeLoggerOutput(): void {}
}

vi.setSystemTime(new Date('2025-12-10T00:00:00.000Z'));
const loggerOuput = new TestLoggerOutput(
  {
    reportDir: './tmp'
  } as Configuration,
  Date.now()
);
const addTextToLoggerOutput = vi.spyOn(loggerOuput, 'addTextToLoggerOutput');
const addToReport = vi.spyOn(loggerOuput, 'addToReport');

beforeEach(() => vi.clearAllMocks());

describe('usual traces', () => {
  it('render usual traces (info)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.info,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `   ${ANSI_MAGENTA}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      'tmp/output.txt',
      Terminal.stripVTControlCharacters(expectedString),
      { encoding: 'utf8', flag: 'a' }
    );
  });

  it('render usual traces (warn)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.warn,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `${ANSI_YELLOW}/!\\${ANSI_MAGENTA}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (error)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.error,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `${ANSI_RED}(X)${ANSI_MAGENTA}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (fatal)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.fatal,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `${ANSI_RED}o*!${ANSI_MAGENTA}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (edge case: timestamp occurs before the logger start)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now() - 60_000,
      source: 'job',
      level: LogLevel.info,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `   ${ANSI_MAGENTA}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      'tmp/output.txt',
      Terminal.stripVTControlCharacters(expectedString),
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
    const expectedString = `   ${ANSI_MAGENTA}00:00${ANSI_WHITE} test {"hello":"world !"}\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      'tmp/output.txt',
      Terminal.stripVTControlCharacters(expectedString),
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
    const expectedString = `   ${ANSI_MAGENTA}00:00${ANSI_WHITE} test ${ANSI_RED}Error ko\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Terminal.stripVTControlCharacters(expectedString)
    );
    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      'tmp/output.txt',
      Terminal.stripVTControlCharacters(expectedString),
      { encoding: 'utf8', flag: 'a' }
    );
  });

  it('does not render progress traces', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'test',
      data: {}
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
});

describe('progress handling', () => {
  describe('global status', () => {
    it('detect global status change and log ', () => {
      loggerOuput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'Executing tests',
        data: {
          uid: '', // 'global' progress
          max: 0 // No progress bar
        }
      } as InternalLogAttributes);
      expect(loggerOuput.progressMap[''].label).toStrictEqual('Executing tests');
      expect(addToReport).toHaveBeenCalledWith(`
   00:00|Executing tests
   -----+---------------
`);
    });
  });

  describe('task status', () => {
    it('creates a new progress bar', () => {
      expect(loggerOuput.progressMap['task1']).toBeUndefined();
      loggerOuput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'test',
        data: {
          uid: 'task1',
          value: 0,
          max: 1
        }
      } as InternalLogAttributes);
      const progressBar = loggerOuput.progressMap['task1'];
      expect.assert(progressBar !== undefined);
      expect(progressBar.label).toStrictEqual('test');
      expect(addTextToLoggerOutput).not.toHaveBeenCalled();
    });

    it('removes the progress bar when the remove option is set', () => {
      loggerOuput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'test',
        data: {
          uid: 'task1',
          value: 0,
          max: 1
        }
      } as InternalLogAttributes);
      loggerOuput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'test',
        data: {
          uid: 'task1',
          value: 0,
          max: 1,
          remove: true
        }
      } as InternalLogAttributes);
      expect(loggerOuput.progressMap['task1']).toBeUndefined();
      expect(addTextToLoggerOutput).not.toHaveBeenCalled();
    });
  });
});
