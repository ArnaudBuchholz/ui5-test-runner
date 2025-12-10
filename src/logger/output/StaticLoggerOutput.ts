import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';

export class StaticLoggerOutput extends AbstractLoggerOutput {
  protected override addToReport(rawText: string): void {
    super.addToReport(rawText);
    Platform.writeOnTerminal(rawText);
  }

  addTextToLoggerOutput() {}
}
