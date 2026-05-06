import type { ILoggerService } from './ILogger.js';

export let logger: ILoggerService | undefined;

const breakDependencyLoopToLogger = async () => {
  const module = await import('../logger.js');
  logger = module.logger;
};

void breakDependencyLoopToLogger();
