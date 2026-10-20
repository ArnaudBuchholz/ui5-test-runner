export interface IBatchItem {
  readonly path: string;
  readonly id: string;
  readonly label: string;
  readonly args: string[];
  /** Resolved by the child runner and sent back over IPC. */
  reportDir?: string;
  start?: Date;
  end?: Date;
  statusCode?: number;
  skipped?: boolean;
  timedOut?: boolean;
  message?: string;
}
