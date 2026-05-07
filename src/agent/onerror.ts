import { toIError } from '../utils/shared/toIError.js';
import { state } from './state.js';

const uncaughtError = (event: string, error: unknown) => {
  if (state.uncaughtErrors === undefined) {
    state.uncaughtErrors = [];
  }
  state.uncaughtErrors.push({
    ...toIError(error),
    event
  });
};

window.addEventListener('error', (event: ErrorEvent) => uncaughtError('error', event.error));
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
  uncaughtError('unhandledrejection', event.reason)
);
