import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import type { Configuration } from '../../configuration/Configuration.js';
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
  [LogLevel.info]: '  ',
  [LogLevel.warn]: ANSI_YELLOW + '/!\\',
  [LogLevel.error]: ANSI_RED + '(X)',
  [LogLevel.fatal]: ANSI_MAGENTA + 'o*!'
} as const;

export const LoggerOutputRenderer = {
  render(
    configuration: Configuration,
    startedAt: ReturnType<typeof Date.now>,
    attributes: InternalLogAttributes
  ): string | void {
    const { level, timestamp, source, message, data, error } = attributes;
    if (source !== 'progress' && source !== 'metric' && level !== LogLevel.debug) {
      return [
        icons[level],
        ANSI_YELLOW,
        formatDiff(timestamp - startedAt),
        ANSI_WHITE,
        message,
        data ? JSON.stringify(data) : '',
        error ? `${ANSI_RED}${(error as Error).name} ${(error as Error).message}` : '',
        ANSI_YELLOW,
        '\n'
      ].join('');
    }
  }
};
