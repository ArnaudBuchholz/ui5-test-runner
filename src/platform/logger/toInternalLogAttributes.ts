import { Host } from '../Host.js';
import { Thread } from '../Thread.js';
import type { InternalLogAttributes, LogAttributes, LogLevel } from './types.js';

export const toInternalLogAttributes = (attributes: LogAttributes, level: LogLevel): InternalLogAttributes => {
  return attributes.processId === undefined
    ? {
        timestamp: Date.now(),
        level,
        processId: Host.pid,
        threadId: Thread.threadId,
        isMainThread: Thread.isMainThread,
        ...attributes
      }
    : {
        timestamp: Date.now(),
        level,
        threadId: 0,
        isMainThread: false,
        ...attributes,
        processId: attributes.processId
      };
};
