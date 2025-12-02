import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from '../loggerTypes.js';
import '../logger.js';
import { LogLevel } from '../loggerTypes.js';
import type { Configuration } from '../configuration/Configuration.js';
import { ANSI_BLUE, ANSI_MAGENTA, ANSI_RED, ANSI_WHITE, ANSI_YELLOW } from '../terminal/ansi.js';
import { LoggerOutputFactory } from './output/factory.js';

const STARTED_AT = Date.now();

const configuration = (Platform.workerData as { configuration: Configuration }).configuration;
const outputInstance = LoggerOutputFactory.build(configuration);

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

const log = (attributes: InternalLogAttributes & LogAttributes) => {
  const { level, timestamp, source, message, data, error } = attributes;
  if (source !== 'progress' && source !== 'metric' && level !== LogLevel.debug) {
    const output = [
      icons[level],
      ANSI_YELLOW,
      formatDiff(timestamp - STARTED_AT),
      ANSI_WHITE,
      message,
      data ? JSON.stringify(data) : '',
      error ? `${ANSI_RED}${(error as Error).name} ${(error as Error).message}` : '',
      ANSI_YELLOW
    ].join('');
    outputInstance.appendToLoggerOutput(output);
  }
};

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: { data: LogMessage }) => {
  const { data: message } = event;
  if (message.command === 'terminate') {
    channel.close();
    outputInstance.closeLoggerOutput();
  } else if (message.command === 'log') {
    log(message);
  }
};

outputInstance.appendToLoggerOutput(`       _ ____        _            _                                         
 _   _(_) ___|      | |_ ___  ___| |_      _ __ _   _ _ __  _ __   ___ _ __ 
| | | | |___ \\ _____| __/ _ \\/ __| __|____| '__| | | | '_ \\| '_ \\ / _ \\ '__|
| |_| | |___) |_____| ||  __/\\__ \\ ||_____| |  | |_| | | | | | | |  __/ |   
 \\__,_|_|____/       \\__\\___||___/\\__|    |_|   \\__,_|_| |_|_| |_|\\___|_|   \n`);

channel.postMessage({
  command: 'ready',
  source: 'output'
} satisfies LogMessage);
