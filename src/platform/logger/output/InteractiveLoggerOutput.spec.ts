import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';
import type { Configuration } from '../../../configuration/Configuration';
import { Terminal } from '../../Terminal.js';
import type { InternalLogAttributes, OverallProgressData, PageProgressData } from '../types.js';
import { LogLevel } from '../types.js';
import { stripVTControlCharacters } from 'node:util';

vi.useFakeTimers();
vi.setSystemTime(new Date('2025-12-12T00:00:00.000Z'));
beforeEach(() => vi.clearAllMocks());

describe('cursor management', () => {
  let loggerOutput: InteractiveLoggerOutput;

  it('hides cursor', () => {
    loggerOutput = new InteractiveLoggerOutput(
      {
        reportDir: './tmp',
        outputInterval: 250
      } as Configuration,
      Date.now()
    );
    expect(Terminal.hideCursor).toHaveBeenCalled();
  });

  it('restores cursor on close', () => {
    loggerOutput.closeLoggerOutput();
    expect(Terminal.showCursor).toHaveBeenCalled();
  });
});

describe('output handling (complete scenario with errors)', () => {
  let loggerOutput: InteractiveLoggerOutput;

  beforeAll(() => {
    loggerOutput = new InteractiveLoggerOutput(
      {
        reportDir: './tmp',
        outputInterval: 250
      } as Configuration,
      Date.now()
    );
    loggerOutput.addTextToLoggerOutput('formatted\n', 'raw\n');
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'main',
      data: {
        uid: '',
        max: 100,
        value: 50
      } satisfies OverallProgressData
    } as InternalLogAttributes);
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'OPA page with a long message that goes beyond 40 characters (including progress bar)',
      data: {
        uid: 'page1',
        max: 100,
        value: 20,
        type: 'opa',
        errors: 0
      } satisfies PageProgressData
    } as InternalLogAttributes);
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'Failed QUnit page',
      data: {
        uid: 'page2',
        max: 100,
        value: 40,
        type: 'qunit',
        errors: 3
      } satisfies PageProgressData
    } as InternalLogAttributes);
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'QUnit page with no error',
      data: {
        uid: 'page3',
        max: 100,
        value: 50,
        type: 'qunit',
        errors: 0
      } satisfies PageProgressData
    } as InternalLogAttributes);
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'Test suite',
      data: {
        uid: 'page4',
        max: 0,
        value: 1,
        type: 'unknown',
        errors: 0
      } satisfies PageProgressData
    } as InternalLogAttributes);
  });

  afterAll(() => {
    loggerOutput.closeLoggerOutput();
  });

  describe('before tick', () => {
    it('does not output any text', () => {
      expect(Terminal.write).not.toHaveBeenCalled();
    });
  });

  describe('on tick', () => {
    beforeEach(() => vi.advanceTimersToNextTimerAsync()); // tick

    it('renders text', () => {
      expect(Terminal.write).toHaveBeenCalledWith(expect.stringContaining('formatted\n'));
    });

    it('flushes the static text after rendering once', () => {
      expect(Terminal.write).not.toHaveBeenCalledWith(expect.stringContaining('formatted\n'));
    });

    it('renders main progress (with animated tick)', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(stripVTControlCharacters(text)).toMatch(/\[.\]\[#####-----\] 50% main \(Tests: 107\+3\/300\)/);
    });

    it('renders page 1 progress', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(
        `${Terminal.GREEN}OPA${Terminal.WHITE}[##--------] 20% OPA page with a long message that goes beyond 40 characters (including progress bar)\n`
      );
    });

    it('renders page 2 progress', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(`${Terminal.RED}3  ${Terminal.WHITE}[####------] 40% Failed QUnit page\n`);
    });

    it('renders page 3 progress', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(`${Terminal.GREEN}QNT${Terminal.WHITE}[#####-----] 50% QUnit page with no error\n`);
    });

    it('renders page 4 progress', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(`   Test suite\n`);
    });

    it('clears the progress lines on tick', () => {
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(5);
    });
  });

  describe('screen resize', () => {
    it('clears and rerenders the progress lines on resize (shorter)', () => {
      loggerOutput.terminalResized(40);
      // Because the new terminal width is shorter, we need to clean one additional line
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(8);
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(`[##--------] 20% ...ng progress bar)\n`);
      expect(text).toContain(`[####------] 40% Failed QUnit page\n`);
    });

    it('clears and rerenders the progress lines on resize (wider)', () => {
      loggerOutput.terminalResized(120);
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(5);
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(text).toContain(
        `${Terminal.GREEN}OPA${Terminal.WHITE}[##--------] 20% OPA page with a long message that goes beyond 40 characters (including progress bar)\n`
      );
      expect(text).toContain(`${Terminal.RED}3  ${Terminal.WHITE}[####------] 40% Failed QUnit page\n`);
    });
  });
});

describe('output handling (scenario without errors)', () => {
  let loggerOutput: InteractiveLoggerOutput;

  beforeAll(() => {
    loggerOutput = new InteractiveLoggerOutput(
      {
        reportDir: './tmp',
        outputInterval: 250
      } as Configuration,
      Date.now()
    );
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'main',
      data: {
        uid: '',
        max: 100,
        value: 50
      } satisfies OverallProgressData
    } as InternalLogAttributes);
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'OPA page',
      data: {
        uid: 'page1',
        max: 100,
        value: 20,
        type: 'opa',
        errors: 0
      } satisfies PageProgressData
    } as InternalLogAttributes);
  });

  afterAll(() => {
    loggerOutput.closeLoggerOutput();
  });

  describe('on tick', () => {
    beforeEach(() => vi.advanceTimersToNextTimerAsync()); // tick

    it('renders main progress (with animated tick)', () => {
      expect(Terminal.write).toHaveBeenCalled();
      const [text] = vi.mocked(Terminal.write).mock.calls[0]!;
      expect(stripVTControlCharacters(text)).toMatch(/\[.\]\[#####-----\] 50% main \(Tests: 20\/100\)/);
    });
  });
});

describe('output handling (NO_COLOR)', () => {
  let loggerOutput: InteractiveLoggerOutput;

  beforeAll(() => {
    vi.stubEnv('NO_COLOR', '1');
    loggerOutput = new InteractiveLoggerOutput(
      {
        reportDir: './tmp',
        outputInterval: 250
      } as Configuration,
      Date.now()
    );
  });

  it('renders only raw text', async () => {
    loggerOutput.addTextToLoggerOutput('formatted\n', 'raw\n');
    await vi.advanceTimersToNextTimerAsync(); // tick
    expect(Terminal.write).toHaveBeenCalledWith(expect.stringContaining('raw\n'));
  });

  it('does not render colors on the main progress', async () => {
    loggerOutput.addAttributesToLoggerOutput({
      timestamp: Date.now(),
      source: 'progress',
      level: LogLevel.info,
      message: 'main',
      data: {
        uid: '',
        max: 100,
        value: 50
      } satisfies OverallProgressData
    } as InternalLogAttributes);
    await vi.advanceTimersToNextTimerAsync(); // tick
    expect(Terminal.write).toHaveBeenCalledWith(expect.stringContaining(`[#####-----] 50% main\n`));
  });
});
