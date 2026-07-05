import { AssertionError } from 'node:assert/strict';
import { __developmentMode } from './constants.js';
import { logger } from './logger/proxy.js';

export const assert: (shouldBeTrue: boolean, messageIfNotTrue?: string) => asserts shouldBeTrue = (
  shouldBeTrue,
  messageIfNotTrue = 'Assertion failed'
) => {
  if (shouldBeTrue) {
    return;
  }

  const error = new AssertionError({ message: messageIfNotTrue });
  /* v8 ignore next -- @preserve */
  if (__developmentMode) {
    let { stack } = error;
    stack = stack ? stack.split('\n').slice(1).join('\n') : '';
    logger?.fatal({ source: 'assert', message: messageIfNotTrue + stack, error });
  } else {
    logger?.fatal({ source: 'assert', message: messageIfNotTrue, error });
  }
  throw error;
};
