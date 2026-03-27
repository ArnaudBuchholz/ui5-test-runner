import type { State } from './types.js';

const DEFAULT_STATE: State = {
  timeRange: { mode: 'relative', preset: '15m' },
  autoRefresh: false,
  autoRefreshInterval: 10,
  lastRefresh: null,
  filterExpression: '',
  searchText: '',
  filterError: null,
  selectedEntryIndex: null,
  entries: [],
  metrics: null,
  isLive: false
};

let currentState: State = { ...DEFAULT_STATE };

const listeners: ((state: State) => void)[] = [];

export function getState(): State {
  return currentState;
}

export function setState(patch: Partial<State>): void {
  currentState = { ...currentState, ...patch };
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function subscribe(listener: (state: State) => void): void {
  listeners.push(listener);
  listener(currentState);
}
