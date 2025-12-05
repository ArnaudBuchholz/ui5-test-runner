import { stripVTControlCharacters } from 'node:util';
import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';

export class StaticLoggerOutput extends AbstractLoggerOutput {
  addTextToLoggerOutput(lines: string) {
    const raw = stripVTControlCharacters(lines);
    this.addToReport(raw);
    Platform.writeOnTerminal(raw);
  }
}
