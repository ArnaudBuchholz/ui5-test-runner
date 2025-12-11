import type { Configuration } from '../../configuration/Configuration.js';
import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';

export class StaticLoggerOutput extends AbstractLoggerOutput {
  private _progressReportInterval: ReturnType<typeof setInterval>;

  constructor(configuration: Configuration) {
    super(configuration);
    this._progressReportInterval = setInterval(this.progressReport.bind(this), configuration.outputInterval);
  }

  progressReport(): void {
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(80);
      this.addToReport(rendered);
    }
  }

  override addToReport(rawText: string): void {
    super.addToReport(rawText);
    Platform.writeOnTerminal(rawText);
  }

  addTextToLoggerOutput() {}

  override closeLoggerOutput(): void {
    clearInterval(this._progressReportInterval);
  }
}
