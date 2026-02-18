import { AssertionError } from 'node:assert/strict';
import type { ILogger } from './logger/types.js';
import { __developmentMode } from './constants.js';

let logger: ILogger | undefined;

export const assert: (condition: boolean, message?: string) => asserts condition = (
  condition,
  message = 'Assertion failed'
) => {
  if (!condition) {
    const error = new AssertionError({ message });
    if (__developmentMode) {
      let { stack } = error;
      if (stack) {
        stack = stack.split('\n').slice(1).join('\n')
      } else {
        stack = ''
      }
      logger?.fatal({ source: 'assert', message: (message ?? 'Assertion failed') + stack, error });
    } else {
      logger?.fatal({ source: 'assert', message: message ?? 'Assertion failed', error });
    }
    throw error;
  }
};

const breakDependencyLoopToLogger = async () => {
  const module = await import('./logger.js');
  logger = module.logger;
};

void breakDependencyLoopToLogger();
