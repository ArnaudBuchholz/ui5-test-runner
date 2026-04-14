import type { ILogger } from './ILogger.js';

export let logger: ILogger | undefined;

const breakDependencyLoopToLogger = async () => {
  const module = await import('../logger.js');
  logger = module.logger;
};

void breakDependencyLoopToLogger();
