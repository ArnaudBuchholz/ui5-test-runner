export type LogErrorAttributes = {
  name: string;
  message: string;
  stack?: string;
  cause?: LogErrorAttributes;
  errors?: LogErrorAttributes[];
};

const GenericLogSource = {
  metric: 'metric',
  logger: 'logger',
  npm: 'npm',
  puppeteer: 'puppeteer',
  job: 'job'
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
} & (
  | {
      source: GenericLogSource;
      data?: object;
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
};

/** To be used on the broadcast channel */
export type LogMessage =
  | {
      command: 'terminate';
    }
  | {
      command: 'ready';
      source: 'logger' | 'console';
    }
  | ({
      command: 'log';
    } & InternalLogAttributes &
      LogAttributes);
