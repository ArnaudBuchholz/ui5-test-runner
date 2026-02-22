import { Host } from '../Host.js';
import { Thread } from '../Thread.js';
import type { Configuration } from '../../configuration/Configuration.js';

export type LogErrorAttributes = {
  name: string;
  message: string;
  stack?: string;
  cause?: LogErrorAttributes;
  errors?: LogErrorAttributes[];
};

type GenericLogSource = 'exit' | 'exit/handle' | 'http' | 'job' | 'logger' | 'metric' | 'npm' | 'process' | 'puppeteer';

export type LogSource = GenericLogSource | 'page' | 'progress';

export type LogAttributes = {
  message: string;
  error?: unknown;
  data?: object;
  processId?: number;
} & (
  | {
      source: GenericLogSource;
    }
  | {
      source: 'page';
      data: {
        uid: string;
        [key: string]: unknown;
      };
    }
  | {
      source: 'progress';
      data: {
        uid: string;
        value: number;
        max: number;
        remove?: true;
      };
    }
  | {
      source: 'assert';
      error: Error;
    }
);

export const LogLevel = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface ILogger {
  start(configuration: Configuration): void;
  debug(attributes: LogAttributes): void;
  info(attributes: LogAttributes): void;
  warn(attributes: LogAttributes): void;
  error(attributes: LogAttributes): void;
  fatal(attributes: LogAttributes): void;
  stop(): Promise<void>;
}

export type InternalLogAttributes = {
  /** Time stamp (UNIX epoch) */
  timestamp: number;
  /** level */
  level: LogLevel;
  /** process id */
  processId: number;
  /** thread id */
  threadId: number;
  /** indicates if this is the main thread */
  isMainThread: boolean;
} & LogAttributes;

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

export type ReadySource = 'allCompressed' | 'output';

/** To be used on the broadcast channel */
export type LogMessage =
  | {
      command: 'terminate';
    }
  | {
      command: 'ready';
      source: ReadySource;
    }
  | {
      command: 'terminal-resized';
      width: number;
    }
  | ({
      command: 'log';
    } & InternalLogAttributes);
