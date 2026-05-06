import { toIError } from '../utils/shared/toIError.js';
import { state } from './state.js';

const uncaughtError = (error: unknown) => {
  if (state.uncaughtErrors === undefined) {
    state.uncaughtErrors = [];
  }
  state.uncaughtErrors.push(toIError(error));
};

window.addEventListener('error', uncaughtError);
window.addEventListener('unhandledrejection', uncaughtError);
