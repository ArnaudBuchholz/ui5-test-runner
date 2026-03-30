import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { IUIController, UIEvent } from '../../../types/UserInterfaceController.js';
import type { LogStorageQuery } from '../ILogStorage.js';
import type { LogMetrics } from '../LogMetrics.js';
import { getInitialLogMetrics } from '../LogMetrics.js';

export type State = {
  timerange:
    | { type: 'relative'; value: '5m' | '15m' | '30m' | '1h' | '3h' }
    | { type: 'absolute'; from: number; /* EPOCH */ to: number /* EPOCH */ };
  autorefresh: 'off' | '5s' | '10s' | '30s' | '60s';
  filter: string;
  readonly status: 'reading' | 'closed';
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now' | 'auto_refresh_on' | 'auto_refresh_off' | 'apply_filter';

export class LogViewerController implements IUIController<State, Actions> {
  static create(): LogViewerController {
    return new this();
  }

  protected _state: State = {
    timerange: {
      type: 'relative',
      value: '5m'
    },
    autorefresh: 'off',
    filter: '',
    logs: [],
    metrics: getInitialLogMetrics(),
    status: 'reading'
  };

  protected contructor() {}

  protected _handler: (event: Partial<State>) => void = () => {};

  protected async _executeQuery(query: LogStorageQuery): Promise<{ metrics: LogMetrics; logs: InternalLogAttributes[] }> {
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

  connect(handler: (event: Partial<State>) => void): void {
    this._handler = handler;
    this._handler(this._state);
  }

  interaction(event: UIEvent<State, Actions>): void {
    console.log(event);
  }
}
