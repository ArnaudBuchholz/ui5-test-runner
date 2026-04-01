import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { IUIController, UIEvent } from '../../../types/UserInterfaceController.js';
import type { LogStorageQuery } from '../ILogStorage.js';
import type { LogMetrics } from '../LogMetrics.js';
import { getInitialLogMetrics } from '../LogMetrics.js';

const FIVE_MINUTES = 300_000 as const;

const RELATIVE_TIMERANGE_SETTINGS = [
  {
    label: '5 minutes',
    key: FIVE_MINUTES
  },
  {
    label: '15 minutes',
    key: 900_000
  },
  {
    label: '30 minutes',
    key: 1_800_000
  },
  {
    label: '1 hour',
    key: 3_600_000
  },
  {
    label: '3 hours',
    key: 10_800_000
  }
] as const;

const AUTO_REFRESH_SETTINGS = [
  {
    label: '5 seconds',
    key: 5000
  },
  {
    label: '10 seconds',
    key: 10_000
  },
  {
    label: '30 seconds',
    key: 30_000
  },
  {
    label: '60 seconds',
    key: 60_000
  }
] as const;

export type Settings = {
  relativeTimerange: typeof RELATIVE_TIMERANGE_SETTINGS;
  autorefresh: typeof AUTO_REFRESH_SETTINGS;
};

export type State = {
  timerangeType: 'relative' | 'absolute';
  relativeTimerange: (typeof RELATIVE_TIMERANGE_SETTINGS)[number]['key'];
  absoluteTimerangeFrom: number; /* EPOCH */
  absoluteTimerangeTo: number; /* EPOCH */
  autorefresh: 'off' | (typeof AUTO_REFRESH_SETTINGS)[number]['key'];
  filter: string;
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now' | 'auto_refresh_on' | 'auto_refresh_off';

export class LogViewerController implements IUIController<Settings, State, Actions> {
  static create(): LogViewerController {
    return new this();
  }

  protected _state: State = {
    timerangeType: 'relative',
    relativeTimerange: 300_000,
    absoluteTimerangeFrom: 0,
    absoluteTimerangeTo: 0,
    autorefresh: 'off',
    filter: '',
    logs: [],
    metrics: getInitialLogMetrics()
  };

  protected contructor() {}

  protected _updateCb: (event: Partial<State>) => void = () => {};

  protected _update(stateDiff: Partial<State>) {
    Object.assign(this._state, stateDiff);
    this._updateCb(stateDiff);
  }

  protected async _executeQuery(
    query: LogStorageQuery
  ): Promise<{ metrics: LogMetrics; logs: InternalLogAttributes[] }> {
    const parameters = new URLSearchParams();
    for (const key in query) {
      const property = key as keyof LogStorageQuery;
      if (Object.prototype.hasOwnProperty.call(query, property) && query[property]) {
        parameters.set(key, query[property].toString());
      }
    }
    const response = await fetch('/query?' + parameters.toString());
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const { metrics, logs } = (await response.json()) as { metrics: LogMetrics; logs: InternalLogAttributes[] };
    return { metrics, logs };
  }

  protected async _checkInitialQuery() {
    const { metrics, logs } = await this._executeQuery({});
    const now = Date.now();
    const stateDiff: Partial<State> = {
      absoluteTimerangeFrom: metrics.minTimestamp,
      absoluteTimerangeTo: now,
      metrics,
      logs
    };
    if (metrics.minTimestamp <= now - FIVE_MINUTES) {
      stateDiff.timerangeType = 'absolute';
    }
    this._update(stateDiff);
  }

  connect(update: (event: Partial<State>) => void) {
    this._updateCb = update;
    void this._checkInitialQuery();
    return {
      initialState: this._state,
      settings: {
        relativeTimerange: RELATIVE_TIMERANGE_SETTINGS,
        autorefresh: AUTO_REFRESH_SETTINGS
      }
    };
  }

  interaction(event: UIEvent<State, Actions>) {
    const { action, ...stateDiff } = event;
    Object.assign(this._state, stateDiff);
    if (action !== undefined) {
      void this[action]();
    }
  }

  protected async refresh_now() {
    const query: LogStorageQuery = {};
    if (this._state.timerangeType === 'absolute') {
      query.from = this._state.absoluteTimerangeFrom;
      query.to = this._state.absoluteTimerangeTo;
    } else {
      query.from = Date.now() - this._state.relativeTimerange;
    }
    if (this._state.filter) {
      query.filter = this._state.filter;
    }
    const stateDiff = await this._executeQuery(query);
    this._update(stateDiff);
  }

  protected auto_refresh_on() {}

  protected auto_refresh_off() {}
}
