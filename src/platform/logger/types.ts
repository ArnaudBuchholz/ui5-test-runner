import { Host, Thread } from '../index.js';

export type LogErrorAttributes = {
  name: string;
  message: string;
  stack?: string;
  cause?: LogErrorAttributes;
  errors?: LogErrorAttributes[];
};

const GenericLogSource = {
  exit: 'exit',
  http: 'http',
  job: 'job',
  logger: 'logger',
  metric: 'metric',
  npm: 'npm',
  process: 'process',
  puppeteer: 'puppeteer'
} as const;
type GenericLogSource = (typeof GenericLogSource)[keyof typeof GenericLogSource];

export const LogSource = {
  ...GenericLogSource,
  progress: 'progress'
} as const;
export type LogSource = (typeof LogSource)[keyof typeof LogSource];

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
