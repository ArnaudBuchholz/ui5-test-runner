import { stripVTControlCharacters } from 'node:util';
import { Platform } from '../../Platform.js';
import type { ILoggerOutput } from './ILoggerOutput.js';
import { appendToReport } from './report.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { ANSI_HIDE_CURSOR, ANSI_SHOW_CURSOR } from '../../terminal/ansi.js';

// const TICKS = ['|', '/', '-', '\\'];
// let interactiveIntervalId: ReturnType<typeof setInterval> | undefined;

export class InteractiveLoggerOutput implements ILoggerOutput {
  private _reportDir: string;

  constructor(configuration: Configuration) {
    this._reportDir = configuration.reportDir;
    Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
  }

  appendToLoggerOutput(lines: string): void {
    appendToReport(this._reportDir, stripVTControlCharacters(lines));
    Platform.writeOnTerminal(lines);
  }

  closeLoggerOutput(): void {
    Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
  }
}
