import { AssertionError } from 'node:assert/strict';
import type { ILogger } from './logger/types.js';

let logger: ILogger | undefined;

export const assert: (condition: boolean, message?: string) => asserts condition = (
  condition,
  message = 'Assertion failed'
) => {
  if (!condition) {
    const error = new AssertionError({ message });
    logger?.fatal({ source: 'assert', message: 'Assertion failed', error });
    throw error;
  }
};

const breakDependencyLoopToLogger = async () => {
  const module = await import('./logger.js');
  logger = module.logger;
};

void breakDependencyLoopToLogger();
