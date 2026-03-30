import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import type { IUIController, UIEvent } from '../../../types/UIController.js';
import type { LogMetrics } from '../LogMetrics.js';

export type State = {
  timerange:
    | { type: 'relative'
        value: '5m' | '15m' | '30m' | '1h' | '3h';
      }
    | { type: 'absolute'
        from: number; /* EPOCH */
        to: number; /* EPOCH */
      };
  autoRefresh: '5s' | '10s' | '30s' | '60s';
  filter: string;
  readonly status: 'running' | 'idle';
  readonly logs: InternalLogAttributes[];
  readonly metrics: LogMetrics;
};

export type Actions = 'refresh_now' | 'auto_refresh' | 'apply_filter';

export class LogViewerController implements IUIController<State, Actions> {
  static create(): LogViewerController {
    return new LogViewerController();
  }

  protected contructor() {
  }

  protected _handler: ((event: Partial<State>) => void) | undefined;

  connect(handler: (event: Partial<State>) => void): void {
    this._handler = handler;

  }

  input(event: UIEvent<State, Actions>): void {

  }
}
