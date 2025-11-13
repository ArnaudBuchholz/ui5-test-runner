import assert from 'node:assert/strict';
import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes } from '../logger.js';
import type { Configuration } from '../configuration/Configuration.js';

const log = (attributes: InternalLogAttributes & LogAttributes) => {
  const { level, timestamp, processId = 0, threadId = 0, message, data } = attributes;
  const icon = {
    debug: '🐞',
    info: '🛈',
    warn: '⚠️',
    error: '❌',
    fatal: '💣'
  }[level];
  console.log(icon, timestamp, processId, threadId, message, data ? JSON.stringify(data) : '');
};

const channel = Platform.createBroadcastChannel('logger');
channel.onmessage = (event: { data: { terminate: true } | (InternalLogAttributes & LogAttributes) }) => {
  if ('terminate' in event.data) {
    channel.close();
  } else if (!('isReady' in event.data)) {
    log(event.data);
  }
};

export const start = (configuration: Configuration) => {
  assert.ok(Platform.isMainThread, 'Call console.start only in main thread');
  Platform.createWorker('console', { configuration });
};
