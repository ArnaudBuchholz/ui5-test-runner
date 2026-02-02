import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';
import type { Configuration } from '../../../configuration/Configuration';
import { Terminal } from '../../Terminal.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';

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
    expect(Terminal.write).toHaveBeenCalledWith(Terminal.HIDE_CURSOR);
  });

  it('restores cursor on close', () => {
    loggerOutput.closeLoggerOutput();
    expect(Terminal.write).toHaveBeenCalledWith(Terminal.SHOW_CURSOR);
  });
});

describe('output handling', () => {
  const loggerOutput = new InteractiveLoggerOutput(
    {
      reportDir: './tmp',
      outputInterval: 250
    } as Configuration,
    Date.now()
  );

  describe('before tick', () => {
    it('does not output text', () => {
      loggerOutput.addTextToLoggerOutput('formatted', 'raw');
      expect(Terminal.write).not.toHaveBeenCalled();
    });

    it('stores progress info to display', () => {
      loggerOutput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'main',
        data: {
          uid: '',
          max: 100,
          value: 50
        }
      } as InternalLogAttributes);
      loggerOutput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'page with a long URL that goes beyond 40 characters (including progress bar)',
        data: {
          uid: 'page1',
          max: 100,
          value: 20
        }
      } as InternalLogAttributes);
      expect(Terminal.write).not.toHaveBeenCalled();
    });
  });

  describe('on tick', () => {
    it('renders text', async () => {
      await vi.advanceTimersToNextTimerAsync(); // tick
      expect(Terminal.write).toHaveBeenCalledWith('formatted');
    });

    it('flushes the text after rendering once', async () => {
      await vi.advanceTimersToNextTimerAsync(); // tick
      expect(Terminal.write).not.toHaveBeenCalledWith('formatted');
    });

    it('renders page progress', async () => {
      await vi.advanceTimersToNextTimerAsync(); // tick
      expect(Terminal.write).toHaveBeenCalledWith(
        '   [##--------] 20% page with a long URL that goes beyond 40 characters (including progress bar)\n'
      );
    });

    it('renders main progress (with animated tick)', async () => {
      await vi.advanceTimersToNextTimerAsync(); // tick
      expect(Terminal.write).toHaveBeenCalledWith(`${Terminal.YELLOW}[|]${Terminal.WHITE}[#####-----] 50% main\n`);
    });

    it('clears the progress lines on tick', async () => {
      await vi.advanceTimersToNextTimerAsync(); // tick
      expect(Terminal.write).toHaveBeenCalledWith(Terminal.SETCOLUMN(0));
      expect(Terminal.write).toHaveBeenCalledWith(Terminal.UP(2) + Terminal.ERASE_TO_END);
    });
  });

  describe('screen resize', () => {});
});
