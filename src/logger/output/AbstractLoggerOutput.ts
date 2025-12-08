import { Platform } from '../../Platform.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import { ANSI_BLUE, ANSI_MAGENTA, ANSI_RED, ANSI_WHITE, ANSI_YELLOW } from '../../terminal/ansi.js';

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
  }

  protected render(attributes: InternalLogAttributes): string | void {
    const { level, timestamp, source, message, data, error } = attributes;
    if (source !== 'progress' && source !== 'metric' && level !== LogLevel.debug) {
      return [
        icons[level],
        ANSI_YELLOW,
        formatDiff(timestamp - this._startedAt),
        ' ',
        ANSI_WHITE,
        message,
        data ? JSON.stringify(data) : '',
        error ? `${ANSI_RED}${(error as Error).name} ${(error as Error).message}` : '',
        ANSI_YELLOW,
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

  abstract addTextToLoggerOutput(lines: string): void;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- They must belong to the signature
  protected renderAttributes(attributes: InternalLogAttributes): boolean {
    return true;
  }

  addAttributesToLoggerOutput(attributes: InternalLogAttributes): void {
    if (this.renderAttributes(attributes)) {
      const rendered = this.render(attributes);
      if (rendered) {
        this.addTextToLoggerOutput(rendered);
      }
    }
  }

  closeLoggerOutput(): void {}
}
