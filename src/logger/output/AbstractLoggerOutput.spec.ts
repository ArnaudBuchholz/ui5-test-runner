import { it, expect, beforeEach, vi, describe } from 'vitest';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types';
import { LogLevel } from '../types.js';
import { ANSI_YELLOW, ANSI_WHITE, ANSI_RED, ANSI_MAGENTA } from '../../terminal/ansi.js';
import { Platform } from '../../Platform.js';

class TestLoggerOutput extends AbstractLoggerOutput {
  constructor() {
    super({
      reportDir: './tmp'
    } as Configuration);
  }

  public override addToReport(rawText: string): void {
    super.addToReport(rawText);
  }
  override addTextToLoggerOutput(): void {}
}

vi.setSystemTime(new Date('2025-12-10T00:00:00.000Z'));
const loggerOuput = new TestLoggerOutput();
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
    const expectedString = `   ${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
    expect(Platform.writeFileSync).toHaveBeenCalledWith(
      'tmp/output.txt',
      Platform.stripVTControlCharacters(expectedString),
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
    const expectedString = `${ANSI_YELLOW}/!\\${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (error)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.error,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `${ANSI_RED}(X)${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (fatal)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'job',
      level: LogLevel.fatal,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `${ANSI_MAGENTA}o*!${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
  });

  it('render usual traces (edge case: timestamp occurs before the logger start)', () => {
    loggerOuput.addAttributesToLoggerOutput({
      timestamp: Date.now() - 60_000,
      source: 'job',
      level: LogLevel.info,
      message: 'test'
    } as InternalLogAttributes);
    const expectedString = `   ${ANSI_YELLOW}00:00${ANSI_WHITE} test\n`;
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
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
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
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
    expect(addTextToLoggerOutput).toHaveBeenCalledWith(
      expectedString,
      Platform.stripVTControlCharacters(expectedString)
    );
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
});
