import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { IUserInterfaceController } from '../../../types/IUserInterfaceController.js';
import { AbstractUserInterfaceController } from '../../../utils/AbstractUserInterfaceController.js';
import type { LogStorageQuery } from '../ILogStorage.js';
import type { LogMetrics } from '../LogMetrics.js';
import { getInitialLogMetrics } from '../LogMetrics.js';
import type { Settings, State, Actions } from './types.ts';
import { FIVE_MINUTES, FIVE_SECONDS, RELATIVE_TIMERANGE_SETTINGS, AUTO_REFRESH_SETTINGS } from './constants.js';

export class LogViewerController
  extends AbstractUserInterfaceController<Settings, State, Actions>
  implements IUserInterfaceController<Settings, State, Actions>
{
  constructor() {
    super();
    this._state = {
      timerangeType: 'relative',
      relativeTimerange: FIVE_MINUTES,
      absoluteTimerangeFrom: 0,
      absoluteTimerangeTo: 0,
      autorefresh: false,
      autorefreshInterval: FIVE_SECONDS,
      filter: '',
      errorMessage: '',
      logs: [],
      metrics: getInitialLogMetrics()
    };
    this._settings = {
      relativeTimerange: RELATIVE_TIMERANGE_SETTINGS,
      autorefresh: AUTO_REFRESH_SETTINGS
    };
  }

  protected async _executeQuery(
    query: LogStorageQuery
  ): Promise<{ metrics: LogMetrics; logs: InternalLogAttributes[] } | undefined> {
    this._update({ errorMessage: '' });
    const parameters = new URLSearchParams();
    for (const key of Object.keys(query) as (keyof LogStorageQuery)[]) {
      parameters.set(key, query[key]!.toString()); // Because of the way it is internal used, we can't have an undefined prop
    }
    const response = await fetch('/query?' + parameters.toString());
    if (!response.ok) {
      const errorMessage = (await response.text()) || `${response.status} ${response.statusText}`;
      this._update({ errorMessage });
      return undefined;
    }
    const { metrics, logs } = (await response.json()) as { metrics: LogMetrics; logs: InternalLogAttributes[] };
    return { metrics, logs };
  }

  protected async _checkInitialQuery() {
    const queryResult = await this._executeQuery({});
    if (!queryResult) {
      return;
    }
    const { metrics, logs } = queryResult;
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

  protected override _onConnect(): void {
    void this._checkInitialQuery();
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions) {
    if ('autorefresh' in stateDiff || 'autorefreshInterval' in stateDiff) {
      this._autorefresh(stateDiff);
    }
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
    if (stateDiff) {
      this._update(stateDiff);
    }
  }

  protected _autorefreshIntervalId: ReturnType<typeof setInterval> | undefined;

  protected _startAutorefresh() {
    this._autorefreshIntervalId = setInterval(() => void this.refresh_now(), this._state.autorefreshInterval);
  }

  protected _stopAutorefresh() {
    clearInterval(this._autorefreshIntervalId);
    this._autorefreshIntervalId = undefined;
  }

  protected _autorefresh({ autorefresh /* , autorefreshInterval */ }: Partial<State>) {
    if (autorefresh === false) {
      this._stopAutorefresh();
    } else if (autorefresh === true) {
      this._startAutorefresh();
    } else /* if (autorefreshInterval !== undefined) */ {
      this._stopAutorefresh();
      this._startAutorefresh();
    }
  }
}
