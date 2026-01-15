import { AssertionError } from 'node:assert/strict';
import { logger } from './logger.js';

export const assert: (condition: boolean, message?: string) => asserts condition = (
  condition,
  message = 'Assertion failed'
) => {
  if (!condition) {
    const error = new AssertionError({ message });
    logger.fatal({ source: 'assert', message: 'Assertion failed', error });
    throw error;
  }
};
