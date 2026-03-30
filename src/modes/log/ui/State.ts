import type { InternalLogAttributes } from '../../../platform/logger/types.js';
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

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [P in K]: T[P] },
    { -readonly [P in K]: T[P] },
    K
  >
}[keyof T];

type Writable<T> = Pick<T, WritableKeys<T>>;

type IsPlainObject<T> = T extends object
  ? T extends Function
    ? false
    : T extends readonly any[]
      ? false
      : true
  : false;

type DotPaths<T> = {
  [K in keyof T & (string | number)]: IsPlainObject<T[K]> extends true
    ? `${K}` | `${K}.${DotPaths<T[K]>}`
    : `${K}`
}[keyof T & (string | number)];

type LeafValues<T> =
  T extends readonly (infer U)[] ? LeafValues<U> | T :
  T extends object ? { [K in keyof T]: LeafValues<T[K]> }[keyof T] :
  T;

export type Action = 'refresh_now' | 'auto_refresh' | 'apply_filter';

type UpdateEvent = Partial<State>

type UIEvent =
  | {
      type: 'change';
      field: DotPaths<Writable<State>>;
      value: LeafValues<Writable<State>>;
    }
  | {
      type: 'action';
      action: Action;
    }
  ;

export type IController = {
  listen: (handler: (event: UpdateEvent) => void) => void;
  input: (event: UIEvent) => void;
}