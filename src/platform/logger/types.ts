import type { ServerEventName, ServerEvent } from 'reserve';

export type LogErrorAttributes = {
  name: string;
  message: string;
  stack?: string;
  cause?: LogErrorAttributes;
  errors?: LogErrorAttributes[];
};

type GenericLogSource =
  | 'exit'
  | 'exit/handle'
  | 'thread'
  | 'http'
  | 'job'
  | 'logger'
  | 'npm'
  | 'process'
  | 'puppeteer'
  | 'server';

export type LogSource = GenericLogSource | 'page' | 'progress' | 'metric' | 'assert' | 'reserve';

export type OverallProgressData = {
  uid: '';
  /** Pages executed */
  value: number;
  /** Total number of pages */
  max: number;
};

export type PageProgressData = {
  uid: string;
  /** Tests executed */
  value: number;
  /** Total number of tests */
  max: number;
  /** Errors */
  errors: number;
  type: 'unknown' | 'qunit' | 'opa';
  remove?: true;
};

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
      source: 'metric';
      message: '';
      data: {
        cpu: object;
        mem: object;
      };
    }
  | {
      source: 'progress';
      data: OverallProgressData | PageProgressData;
    }
  | {
      source: 'assert';
      error: Error;
    }
  | {
      source: 'reserve';
      message: ServerEventName;
      data: Omit<ServerEvent, 'eventName' | 'reason'>;
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
