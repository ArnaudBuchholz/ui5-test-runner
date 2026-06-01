import type { ServerEventName, ServerEvent } from 'reserve';

type GenericLogSource =
  | 'browser'
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

type PageLogSource = 'page' | 'browser/agent' | 'browser/console' | 'browser/network';

export type LogSource = GenericLogSource | PageLogSource | 'progress' | 'metric' | 'assert' | 'reserve';

export type OverallProgressData = {
  /** Pages executed */
  value: number;
  /** Total number of pages */
  max: number;
};

export type PageProgressData = {
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
  pageId?: number;
} & (
  | {
      source: GenericLogSource;
    }
  | {
      source: PageLogSource;
      pageId: number;
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
      pageId: undefined;
      data: OverallProgressData;
    }
  | {
      source: 'progress';
      pageId: number;
      data: PageProgressData;
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
