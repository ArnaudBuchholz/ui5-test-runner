import type { ServerEventName, ServerEvent } from 'reserve';

type GenericLogSource =
  | 'browser'
  | 'exit'
  | 'exit/handle'
  | 'job'
  | 'logger'
  | 'npm'
  | 'process'
  | 'process/stdout'
  | 'process/stderr'
  | 'playwright'
  | 'puppeteer'
  | 'server'
  | 'server/unhandled'
  | 'thread';

type PageLogSource = 'browser/agent' | 'browser/console' | 'browser/network' | 'page';

export type LogSource = 'assert' | 'http' | 'metric' | 'progress' | 'reserve' | GenericLogSource | PageLogSource ;

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
      source: 'assert';
      error: Error;
    }
  | {
      source: 'http';
      data: {
        requestId: number;
        init?: object;
        status?: number;
        headers?: object;
      };
    }
  | {
      source: 'metric';
      data: {
        cpu: object;
        mem: object;
        elu: object;
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
      source: 'reserve';
      message: ServerEventName;
      data: Omit<ServerEvent, 'eventName' | 'reason'>;
    }
  | {
      source: GenericLogSource;
    }
  | {
      source: PageLogSource;
      pageId: number;
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
