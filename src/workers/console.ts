import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from '../loggerTypes.js';
import '../logger.js';
import { LogLevel } from '../loggerTypes.js';
import type { Configuration } from '../configuration/Configuration.js';
import { stripVTControlCharacters } from 'node:util';
import { ANSI_BLUE, ANSI_HIDE_CURSOR, ANSI_MAGENTA, ANSI_RED, ANSI_SHOW_CURSOR, ANSI_WHITE, ANSI_YELLOW } from '../terminal/ansi.js';

const STARTED_AT = Date.now();

const { ci, reportDir } = (Platform.workerData as { configuration: Configuration }).configuration;

const interactive = !ci && Platform.isTextTerminal;
if (!interactive) {
  const UTF8_BOM_CODE = '\uFEFF';
  Platform.writeOnTerminal(UTF8_BOM_CODE);
}

const writeOnReport = (text: string): void => {
  Platform.writeFileSync(Platform.join(reportDir, 'output.txt'), stripVTControlCharacters(text), {
    encoding: 'utf8',
    flag: 'a'
  });
}

const writeOnTerminal = (text: string): void => {
  if (interactive) {
    Platform.writeOnTerminal(text);
  } else {
    Platform.writeOnTerminal(stripVTControlCharacters(text));
  }
}

const writeOnAll = (text: string): void => {
  writeOnReport(text);
  writeOnTerminal(text);
};

const formatDiff = (diffInMs: number) => {
  if (diffInMs < 0) {
    return '00:00';
  }
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes.toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
};

const logs: string[] = [];

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
      ANSI_YELLOW,
    ].join('');
    if (interactive) {
      logs.push(output);
      writeOnReport(output);
    } else {
      writeOnAll(output);
    }
  }
};

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: { data: LogMessage }) => {
  const { data: message } = event;
  if (message.command === 'terminate') {
    channel.close();
    if (interactive) {
      Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
    }
  } else if (message.command === 'log') {
    log(message);
  }
};

const TICKS = ['|', '/', '-', '\\'];
let interactiveIntervalId: ReturnType<typeof setInterval> | undefined;



if (interactive) {
  Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
}

writeOnAll(`       _ ____        _            _                                         
 _   _(_) ___|      | |_ ___  ___| |_      _ __ _   _ _ __  _ __   ___ _ __ 
| | | | |___ \\ _____| __/ _ \\/ __| __|____| '__| | | | '_ \\| '_ \\ / _ \\ '__|
| |_| | |___) |_____| ||  __/\\__ \\ ||_____| |  | |_| | | | | | | |  __/ |   
 \\__,_|_|____/       \\__\\___||___/\\__|    |_|   \\__,_|_| |_|_| |_|\\___|_|   \n`);

channel.postMessage({
  command: 'ready',
  source: 'console'
} satisfies LogMessage);
