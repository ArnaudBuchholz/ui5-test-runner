import { Terminal } from '../../index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';

export class StaticLoggerOutput extends BaseLoggerOutput {
  private _progressReportInterval: ReturnType<typeof setInterval>;

  constructor(configuration: Configuration, startedAt: number) {
    super(configuration, startedAt);
    this._progressReportInterval = setInterval(this.progressReport.bind(this), configuration.outputInterval);
  }

  progressReport(): void {
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    if (keys.length > 0) {
      this.addToReport(`
   ${this.formatTimestamp(Date.now())}|Progress
   -----+--------
`);
    }
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(80);
      this.addToReport(rendered + '\n');
    }
  }

  /* v8 ignore next -- @preserve */
  override terminalResized(): void {}
  override addTextToLoggerOutput(): void {}

  override addToReport(rawText: string): void {
    super.addToReport(rawText);
    Terminal.write(rawText);
  }

  override closeLoggerOutput(): void {
    clearInterval(this._progressReportInterval);
  }
}
