import { FileSystem, Path, Terminal } from '../../index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import { ProgressBar } from '../../../utils/ProgressBar.js';
import { formatDuration } from '../../../utils/string.js';
import { assert } from '../../assert.js';

const icons = {
  [LogLevel.debug]: Terminal.BLUE + '<o>',
  [LogLevel.info]: '   ',
  [LogLevel.warn]: Terminal.YELLOW + '/!\\',
  [LogLevel.error]: Terminal.RED + '(X)',
  [LogLevel.fatal]: Terminal.RED + 'o*!'
} as const;

type PageProgress = {
  bar: ProgressBar;
  type: 'unknown' | 'qunit' | 'opa';
  errors: number;
};

export abstract class BaseLoggerOutput {
  protected readonly _configuration: Configuration;
  protected readonly _startedAt: number;

  constructor(configuration: Configuration, startedAt: number) {
    this._configuration = configuration;
    this._startedAt = startedAt;
  }

  protected formatTimestamp(timestamp: number) {
    return formatDuration(timestamp - this._startedAt);
  }

  protected render(attributes: InternalLogAttributes): string | void {
    const { level, timestamp, source, message, data, error } = attributes;
    // TODO: adjust for LogLevel.debug based on configuration (--debug-verbose)
    if (source !== 'progress' && source !== 'metric' && level !== LogLevel.debug) {
      return [
        icons[level],
        Terminal.MAGENTA,
        this.formatTimestamp(timestamp),
        Terminal.WHITE,
        ' ',
        message,
        data ? ` ${JSON.stringify(data)}` : '',
        error ? ` ${Terminal.RED}${(error as Error).name} ${(error as Error).message}` : '',
        '\n'
      ].join('');
    }
  }

  addToReport(rawText: string): void {
    FileSystem.writeFileSync(Path.join(this._configuration.reportDir, 'output.txt'), rawText, {
      encoding: 'utf8',
      flag: 'a'
    });
  }

  private _pageProgressMap: { [uid in string]?: PageProgress } = {};

  get pageProgressMap() {
    return this._pageProgressMap;
  }

  private _overallProgress = new ProgressBar();
  private _lastOverallStatus = '';

  get overallProgress() {
    return this._overallProgress;
  }

  private _startedAtMap: { [uid in string]?: ReturnType<typeof Date.now> } = {};

  protected renderAttributes(attributes: InternalLogAttributes): boolean {
    if (attributes.source === 'progress') {
      const uid = attributes.data.uid;
      let pageProgress: PageProgress | undefined;
      let progressBar: ProgressBar;
      if (uid === '') {
        progressBar = this._overallProgress;
      } else {
        pageProgress = this._pageProgressMap[uid];
        if (!pageProgress) {
          pageProgress = {
            bar: new ProgressBar(),
            type: 'unknown',
            errors: 0
          };
          this._pageProgressMap[uid] = pageProgress;
          this._startedAtMap[uid] = Date.now();
          this.addToReport(`   ${this.formatTimestamp(attributes.timestamp)} >> ${attributes.message} [${uid}]
  `);
        }
        progressBar = pageProgress.bar;
      }
      progressBar.update(attributes);
      if ('remove' in attributes.data) {
        delete this._pageProgressMap[uid];
        const startedAt = this._startedAtMap[uid];
        delete this._startedAtMap[uid];
        assert(startedAt !== undefined);
        const duration = Date.now() - startedAt;
        this
          .addToReport(`   ${this.formatTimestamp(attributes.timestamp)} << ${attributes.message} (${formatDuration(duration)}) [${uid}]
`);
      }
      if (!uid && progressBar.label !== this._lastOverallStatus) {
        this._lastOverallStatus = progressBar.label;
        this.addToReport(`
   ${this.formatTimestamp(attributes.timestamp)}|${this._lastOverallStatus}
   -----+${''.padStart(this._lastOverallStatus.length, '-')}
`);
      }
      return false;
    }
    return true;
  }

  addAttributesToLoggerOutput(attributes: InternalLogAttributes): void {
    if (this.renderAttributes(attributes)) {
      const rendered = this.render(attributes);
      if (rendered) {
        const raw = Terminal.stripVTControlCharacters(rendered);
        this.addTextToLoggerOutput(rendered, raw);
        this.addToReport(raw);
      }
    }
  }

  abstract terminalResized(width: number): void;
  abstract addTextToLoggerOutput(formatted: string, raw: string): void;
  abstract closeLoggerOutput(): void;
}
