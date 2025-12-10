import { Platform } from '../../Platform.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import { ANSI_BLUE, ANSI_MAGENTA, ANSI_RED, ANSI_WHITE, ANSI_YELLOW } from '../../terminal/ansi.js';
import { ProgressBar } from '../../terminal/ProgressBar.js';

const formatDiff = (diffInMs: number) => {
  if (diffInMs < 0) {
    return '00:00';
  }
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes.toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
};

const icons = {
  [LogLevel.debug]: ANSI_BLUE + '<o>',
  [LogLevel.info]: '   ',
  [LogLevel.warn]: ANSI_YELLOW + '/!\\',
  [LogLevel.error]: ANSI_RED + '(X)',
  [LogLevel.fatal]: ANSI_MAGENTA + 'o*!'
} as const;

export abstract class AbstractLoggerOutput {
  protected readonly _configuration: Configuration;
  protected readonly _startedAt: ReturnType<typeof Date.now>;

  constructor(configuration: Configuration) {
    this._configuration = configuration;
    this._startedAt = Date.now();
    this._progressMap = {
      '': new ProgressBar()
    };
  }

  protected render(attributes: InternalLogAttributes): string | void {
    const { level, timestamp, source, message, data, error } = attributes;
    // TODO: adjust for LogLevel.debug based on configuration (--debug-verbose)
    if (source !== 'progress' && source !== 'metric' && level !== LogLevel.debug) {
      return [
        icons[level],
        ANSI_YELLOW,
        formatDiff(timestamp - this._startedAt),
        ANSI_WHITE,
        ' ',
        message,
        data ? ` ${JSON.stringify(data)}` : '',
        error ? ` ${ANSI_RED}${(error as Error).name} ${(error as Error).message}` : '',
        '\n'
      ].join('');
    }
  }

  protected addToReport(rawText: string): void {
    Platform.writeFileSync(Platform.join(this._configuration.reportDir, 'output.txt'), rawText, {
      encoding: 'utf8',
      flag: 'a'
    });
  }

  abstract addTextToLoggerOutput(formatted: string, raw: string): void;

  private _lastStatus = '';
  private _progressMap: { [key in string]?: ProgressBar } & { '': ProgressBar };

  get progressMap() {
    return this._progressMap;
  }

  protected renderAttributes(attributes: InternalLogAttributes): boolean {
    if (attributes.source === 'progress') {
      const uid = attributes.data.uid;
      let progress = this._progressMap[uid];
      if (!progress) {
        progress = new ProgressBar();
        this._progressMap[uid] = progress;
      }
      progress.update(attributes);
      if (attributes.data.remove) {
        delete this._progressMap[uid];
      }
      if (!uid && progress.label !== this._lastStatus) {
        this._lastStatus = progress.label;
        this.addToReport(`
   ${formatDiff(attributes.timestamp - this._startedAt)}|${this._lastStatus}
   -----+${''.padStart(this._lastStatus.length, '-')}
`);
      }
    }
    return true;
  }

  addAttributesToLoggerOutput(attributes: InternalLogAttributes): void {
    if (this.renderAttributes(attributes)) {
      const rendered = this.render(attributes);
      if (rendered) {
        const raw = Platform.stripVTControlCharacters(rendered);
        this.addTextToLoggerOutput(rendered, raw);
        this.addToReport(raw);
      }
    }
  }

  closeLoggerOutput(): void {}
}
