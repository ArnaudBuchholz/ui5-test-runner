import { Host } from '../Host.js';
import { Thread } from '../Thread.js';
import type { InternalLogAttributes, LogAttributes, LogLevel } from './types.js';

export const toInternalLogAttributes = (attributes: LogAttributes, level: LogLevel): InternalLogAttributes => {
  if (attributes.processId !== undefined) {
    return {
      timestamp: Date.now(),
      level,
      threadId: 0,
      isMainThread: false,
      ...attributes,
      processId: attributes.processId
    };
  }
  return {
    timestamp: Date.now(),
    level,
    processId: Host.pid,
    threadId: Thread.threadId,
    isMainThread: Thread.isMainThread,
    ...attributes
  };
};
