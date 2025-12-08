import { stripVTControlCharacters } from 'node:util';
import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { ANSI_HIDE_CURSOR, ANSI_SHOW_CURSOR } from '../../terminal/ansi.js';

// const TICKS = ['|', '/', '-', '\\'];
// let interactiveIntervalId: ReturnType<typeof setInterval> | undefined;

export class InteractiveLoggerOutput extends AbstractLoggerOutput {
  private _noColor: boolean;

  constructor(configuration: Configuration) {
    super(configuration);
    this._noColor = !!process.env['NO_COLOR'];
    Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
  }

  addTextToLoggerOutput(lines: string): void {
    const raw = stripVTControlCharacters(lines);
    this.addToReport(raw);
    Platform.writeOnTerminal(this._noColor ? raw : lines);
  }

  override closeLoggerOutput(): void {
    Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
  }
}
