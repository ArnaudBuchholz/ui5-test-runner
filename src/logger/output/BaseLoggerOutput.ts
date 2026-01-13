import { FileSystem, Path, Terminal } from '../../system/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import { ANSI_BLUE, ANSI_MAGENTA, ANSI_RED, ANSI_WHITE, ANSI_YELLOW } from '../../terminal/ansi.js';
import { ProgressBar } from '../../terminal/ProgressBar.js';
import { formatDuration } from '../../utils/string.js';

const icons = {
  [LogLevel.debug]: ANSI_BLUE + '<o>',
  [LogLevel.info]: '   ',
  [LogLevel.warn]: ANSI_YELLOW + '/!\\',
  [LogLevel.error]: ANSI_RED + '(X)',
  [LogLevel.fatal]: ANSI_MAGENTA + 'o*!'
} as const;

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
        ANSI_YELLOW,
        this.formatTimestamp(timestamp),
        ANSI_WHITE,
        ' ',
        message,
        data ? ` ${JSON.stringify(data)}` : '',
        error ? ` ${ANSI_RED}${(error as Error).name} ${(error as Error).message}` : '',
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

  private _lastStatus = '';
  private _progressMap: { [uid in string]?: ProgressBar } & { '': ProgressBar } = { '': new ProgressBar() };
  private _startedAtMap: { [uid in string]?: ReturnType<typeof Date.now> } = {};

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
        this._startedAtMap[uid] = Date.now();
        this.addToReport(`   ${this.formatTimestamp(attributes.timestamp)} >> ${attributes.message} [${uid}]
`);
      }
      progress.update(attributes);
      if (attributes.data.remove) {
        delete this._progressMap[uid];
        const startedAt = this._startedAtMap[uid];
        delete this._startedAtMap[uid];
        if (startedAt) {
          const duration = Date.now() - startedAt;
          this
            .addToReport(`   ${this.formatTimestamp(attributes.timestamp)} << ${attributes.message} (${formatDuration(duration)}) [${uid}]
`);
        }
      }
      if (!uid && progress.label !== this._lastStatus) {
        this._lastStatus = progress.label;
        this.addToReport(`
   ${this.formatTimestamp(attributes.timestamp)}|${this._lastStatus}
   -----+${''.padStart(this._lastStatus.length, '-')}
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
