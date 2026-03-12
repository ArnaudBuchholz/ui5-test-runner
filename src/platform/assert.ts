import { AssertionError } from 'node:assert/strict';
import { __developmentMode } from './constants.js';
import { logger } from './logger/proxy.js';

export const assert: (condition: boolean, message?: string) => asserts condition = (
  condition,
  message = 'Assertion failed'
) => {
  if (!condition) {
    const error = new AssertionError({ message });
    /* v8 ignore next -- @preserve */
    if (__developmentMode) {
      let { stack } = error;
      stack = stack ? stack.split('\n').slice(1).join('\n') : '';
      logger?.fatal({ source: 'assert', message: (message ?? 'Assertion failed') + stack, error });
    } else {
      logger?.fatal({ source: 'assert', message: message ?? 'Assertion failed', error });
    }
    throw error;
  }
};
