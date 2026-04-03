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
  filter: string;
  readonly errorMessage: string;
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now';
