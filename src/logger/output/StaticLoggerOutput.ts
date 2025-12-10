import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';

export class StaticLoggerOutput extends AbstractLoggerOutput {
  addTextToLoggerOutput(formatted: string, raw: string) {
    Platform.writeOnTerminal(raw);
  }
}
