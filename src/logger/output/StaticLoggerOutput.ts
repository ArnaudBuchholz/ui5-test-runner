import { stripVTControlCharacters } from 'node:util';
import { Platform } from '../../Platform.js';
import type { ILoggerOutput } from './ILoggerOutput.js';
import { appendToReport } from './report.js';
import type { Configuration } from '../../configuration/Configuration.js';

export class StaticLoggerOutput implements ILoggerOutput {
  private _reportDir: string;

  constructor(configuration: Configuration) {
    this._reportDir = configuration.reportDir;
  }

  appendToLoggerOutput(lines: string): void {
    appendToReport(this._reportDir, stripVTControlCharacters(lines));
    Platform.writeOnTerminal(stripVTControlCharacters(lines));
  }

  closeLoggerOutput(): void {}
}
