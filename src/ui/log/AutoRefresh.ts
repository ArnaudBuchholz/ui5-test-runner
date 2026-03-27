import type { AutoRefreshInterval } from './types.js';

export interface AutoRefreshController {
  start: (interval: AutoRefreshInterval, callback: () => void) => void;
  stop: () => void;
}

export function createAutoRefreshController(): AutoRefreshController {
  let timerId: ReturnType<typeof setInterval> | null = null;

  return {
    start(interval, callback) {
      if (timerId !== null) {
        clearInterval(timerId);
      }
      timerId = setInterval(callback, interval * 1000);
    },
    stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }
  };
}
