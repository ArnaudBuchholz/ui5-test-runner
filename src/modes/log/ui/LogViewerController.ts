import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { IUIController, UIEvent } from '../../../types/UserInterfaceController.js';
import type { LogStorageQuery } from '../ILogStorage.js';
import type { LogMetrics } from '../LogMetrics.js';
import { getInitialLogMetrics } from '../LogMetrics.js';

const FIVE_MINUTES = 5 * 60 * 1000;

export type State = {
  timerangeType: 'relative' | 'absolute';
  relativeTimerange: '5m' | '15m' | '30m' | '1h' | '3h';
  absoluteTimerangeFrom: number; /* EPOCH */
  absoluteTimerangeTo: number; /* EPOCH */
  autorefresh: 'off' | '5s' | '10s' | '30s' | '60s';
  filter: string;
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now' | 'auto_refresh_on' | 'auto_refresh_off';

export class LogViewerController implements IUIController<State, Actions> {
  static create(): LogViewerController {
    return new this();
  }

  protected _state: State = {
    timerangeType: 'relative',
    relativeTimerange: '5m',
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

  connect(update: (event: Partial<State>) => void): void {
    this._updateCb = update;
    this._updateCb(this._state);
    void this._checkInitialQuery();
  }

  interaction(event: UIEvent<State, Actions>): void {
    console.log(event);
  }
}
