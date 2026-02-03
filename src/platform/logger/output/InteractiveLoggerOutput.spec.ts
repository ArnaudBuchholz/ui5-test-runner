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
    expect(Terminal.hideCursor).toHaveBeenCalled();
  });

  it('restores cursor on close', () => {
    loggerOutput.closeLoggerOutput();
    expect(Terminal.showCursor).toHaveBeenCalled();
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
      loggerOutput.addAttributesToLoggerOutput({
        timestamp: Date.now(),
        source: 'progress',
        level: LogLevel.info,
        message: 'page with a short URL',
        data: {
          uid: 'page2',
          max: 100,
          value: 40
        }
      } as InternalLogAttributes);
      expect(Terminal.write).not.toHaveBeenCalled();
    });
  });

  describe('on tick', () => {
    beforeEach(() => vi.advanceTimersToNextTimerAsync()); // tick

    it('renders text', () => {
      expect(Terminal.write).toHaveBeenCalledWith('formatted');
    });

    it('flushes the text after rendering once', () => {
      expect(Terminal.write).not.toHaveBeenCalledWith('formatted');
    });

    it('renders main progress (with animated tick)', () => {
      expect(Terminal.write).toHaveBeenCalledWith(`${Terminal.CYAN}[\\]${Terminal.WHITE}[#####-----] 50% main\n`);
    });

    it('renders page 1 progress', () => {
      expect(Terminal.write).toHaveBeenCalledWith(
        '   [##--------] 20% page with a long URL that goes beyond 40 characters (including progress bar)\n'
      );
    });

    it('renders page 2 progress', () => {
      expect(Terminal.write).toHaveBeenCalledWith('   [####------] 40% page with a short URL\n');
    });

    it('clears the progress lines on tick', () => {
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(3);
    });
  });

  describe('screen resize', () => {
    it('clears and rerenders the progress lines on resize (shorter)', () => {
      loggerOutput.terminalResized(40);
      // Because the new terminal width is shorter, we need to clean one additional line
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(6);
      expect(Terminal.write).toHaveBeenCalledWith('   [##--------] 20% ...ng progress bar)\n');
      expect(Terminal.write).toHaveBeenCalledWith('   [####------] 40% ...with a short URL\n');
      expect(Terminal.write).toHaveBeenCalledWith(`${Terminal.BLUE}[-]${Terminal.WHITE}[#####-----] 50% main\n`);
    });

    it('clears and rerenders the progress lines on resize (wider)', () => {
      loggerOutput.terminalResized(120);
      expect(Terminal.eraseToEnd).toHaveBeenCalledWith(3);
      expect(Terminal.write).toHaveBeenCalledWith(
        '   [##--------] 20% page with a long URL that goes beyond 40 characters (including progress bar)\n'
      );
      expect(Terminal.write).toHaveBeenCalledWith('   [####------] 40% page with a short URL\n');
      expect(Terminal.write).toHaveBeenCalledWith(`${Terminal.BLUE}[-]${Terminal.WHITE}[#####-----] 50% main\n`);
    });
  });
});
