import type { State } from './types.js';
import { saveStateToHash } from './utils/url.js';

let currentState: State = {
  report: null,
  filters: {
    suite: '',
    status: '',
    search: ''
  },
  sort: {
    criteria: 'none',
    order: 'asc'
  },
  invalidReport: false
};

const listeners: ((state: State) => void)[] = [];

export function getState(): State {
  return currentState;
}

export function setState(newState: Partial<State>) {
  currentState = { ...currentState, ...newState };
  saveStateToHash(currentState);
  for (const l of listeners) l(currentState);
}

export function subscribe(listener: (state: State) => void) {
  listeners.push(listener);
  listener(currentState);
}
