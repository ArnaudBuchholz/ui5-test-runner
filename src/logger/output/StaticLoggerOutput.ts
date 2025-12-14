import type { Configuration } from '../../configuration/Configuration.js';
import { Platform } from '../../Platform.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';

export class StaticLoggerOutput extends BaseLoggerOutput {
  private _progressReportInterval: ReturnType<typeof setInterval>;

  constructor(configuration: Configuration) {
    super(configuration);
    this._progressReportInterval = setInterval(this.progressReport.bind(this), configuration.outputInterval);
  }

  progressReport(): void {
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    if (keys.length) {
      this.addToReport(`
   ${this.formatDiff(Date.now())}|Progress
   -----+--------
`);
    }
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(80);
      this.addToReport(rendered + '\n');
    }
  }

  override addToReport(rawText: string): void {
    super.addToReport(rawText);
    Platform.writeOnTerminal(rawText);
  }

  override closeLoggerOutput(): void {
    clearInterval(this._progressReportInterval);
  }
}
