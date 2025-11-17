import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes } from '../logger.js';
import { LogSource } from '../logger.js';

const start = Date.now();
const maxLogSourceSize = Object.values(LogSource).reduce((max, source) => Math.max(max, source.length), 0);

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
  if (source !== 'metric') {
    console.log(
      icon,
      formatDiff(timestamp - start),
      source.padEnd(maxLogSourceSize, ' '),
      message,
      data ? JSON.stringify(data) : '',
      error ? `${(error as Error).name} ${(error as Error).message}` : ''
    );
  }
};

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: { data: { terminate: true } | (InternalLogAttributes & LogAttributes) }) => {
  if ('terminate' in event.data) {
    channel.close();
  } else if ('message' in event.data) {
    log(event.data);
  }
};
