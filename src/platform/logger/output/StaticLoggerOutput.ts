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
    const pageIds = this.pageIds;
    if (pageIds.length > 0) {
      this.addToReport(`
   ${this.formatTimestamp(Date.now())}|Progress
   -----+--------
`);
    }
    for (const pageId of pageIds) {
      const pageProgress = this.pageProgressMap[pageId]!; // key is coming from Object.keys
      const rendered = pageProgress.bar.render(80);
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
