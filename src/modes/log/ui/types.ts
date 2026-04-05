import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { LogMetrics } from '../LogMetrics.js';
import type { RELATIVE_TIMERANGE_SETTINGS, AUTO_REFRESH_SETTINGS } from './constants.js';

export type Settings = {
  relativeTimerange: typeof RELATIVE_TIMERANGE_SETTINGS;
  autorefresh: typeof AUTO_REFRESH_SETTINGS;
};

export type State = {
  timerangeType: 'relative' | 'absolute';
  relativeTimerange: (typeof RELATIVE_TIMERANGE_SETTINGS)[number]['key'];
  absoluteTimerangeFrom: number; /* EPOCH */
  absoluteTimerangeTo: number; /* EPOCH */
  autorefresh: boolean;
  autorefreshInterval: (typeof AUTO_REFRESH_SETTINGS)[number]['key'];
  /**
   * - Almost any JavaScript expression is supported (some operators like the coalesce and the assignment ones missing)
   * - The `level` member is converted to string to make it more readable, based on the `LogLevel` type described in `src/platform/logger/types.ts`
   * - The `data` member may contain anything, yet when a filter is created with a non-existing member, it does not fail the expression. For instance, `data.unknown.not_a_member === undefined` returns `true` and does not fail if `data` or `unknown` do not exist.
   * - Examples:
   *   - `processId === 16616`
   *   - `level === "info" && source === "job" && (message.includes("page") || message.includes("test"))`
   */
  filter: string;
  readonly errorMessage: string;
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now';
