import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from '../loggerTypes.js';
import '../logger.js';
import { LogSource } from '../loggerTypes.js';
import type { Configuration } from '../configuration/Configuration.js';

const STARTED_AT = Date.now();
const MAX_LOG_SOURCE_SIZE = Math.max(...Object.values(LogSource).map((source) => source.length));

const { ci, reportDir } = (Platform.workerData as { configuration: Configuration }).configuration;

const interactive = !ci && Platform.isTextTerminal;
if (!interactive) {
  const UTF8_BOM_CODE = '\uFEFF';
  Platform.writeOnTerminal(UTF8_BOM_CODE);
}

const out = (text: string): void => {
  Platform.writeFileSync(Platform.join(reportDir, 'output.txt'), text, {
    encoding: 'utf8',
    flag: 'a'
  });
  Platform.writeOnTerminal(text);
};

const formatDiff = (diffInMs: number) => {
  if (diffInMs < 0) {
    return '00:00';
  }
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes.toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
};

const log = (attributes: InternalLogAttributes & LogAttributes) => {
  const { level, timestamp, source, message, data, error } = attributes;
  const icon = {
    debug: '🐞',
    info: '  ',
    warn: '⚠️',
    error: '❌',
    fatal: '💣'
  }[level];
  if (source !== 'progress' && source !== 'metric' && level !== 'debug') {
    console.log(
      icon,
      formatDiff(timestamp - STARTED_AT),
      source.padEnd(MAX_LOG_SOURCE_SIZE, ' '),
      message,
      data ? JSON.stringify(data) : '',
      error ? `${(error as Error).name} ${(error as Error).message}` : ''
    );
  }
};

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: { data: LogMessage }) => {
  const { data: message } = event;
  if (message.command === 'terminate') {
    channel.close();
  } else if (message.command === 'log') {
    log(message);
  }
};

out(`       _ ____        _            _                                         
 _   _(_) ___|      | |_ ___  ___| |_      _ __ _   _ _ __  _ __   ___ _ __ 
| | | | |___ \\ _____| __/ _ \\/ __| __|____| '__| | | | '_ \\| '_ \\ / _ \\ '__|
| |_| | |___) |_____| ||  __/\\__ \\ ||_____| |  | |_| | | | | | | |  __/ |   
 \\__,_|_|____/       \\__\\___||___/\\__|    |_|   \\__,_|_| |_|_| |_|\\___|_|   \n`);

channel.postMessage({
  command: 'ready',
  source: 'console'
} satisfies LogMessage);
