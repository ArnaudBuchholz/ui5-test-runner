import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes } from '../logger.js';

const log = (attributes: InternalLogAttributes & LogAttributes) => {
  const { level, timestamp, processId = 0, threadId = 0, message, data }  = attributes;
  const icon = {
    debug: '🐞',
    info: '🛈',
    warn: '⚠️',
    error: '❌',
    fatal: '💣'
  }[level];
  console.log(icon, timestamp, processId, threadId, message, data ? JSON.stringify(data) : '');
}

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: any) => {
  if (event.data.terminate) {
    channel.close();
  } else {
    log(event.data as InternalLogAttributes & LogAttributes);
  }
}
