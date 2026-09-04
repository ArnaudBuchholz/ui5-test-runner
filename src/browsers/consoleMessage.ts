import { logger } from '../platform/index.js';
import type { ILogger } from '../platform/logger/ILogger.js';
import type { LogSource } from '../platform/logger/types.js';
import { agentLogPrefix } from '../types/AgentState.js';

const LOG_TYPES: { [key: string]: keyof ILogger } = {
  error: 'error',
  warn: 'warn',
  assert: 'warn',
  debug: 'debug'
} as const;

export const handleConsoleMessage = (type: string, text: string, pageId: number): void => {
  const logType = LOG_TYPES[type] ?? 'info';
  let source: LogSource;
  let message: string;
  if (text.startsWith(agentLogPrefix)) {
    source = 'browser/agent';
    message = text.slice(agentLogPrefix.length);
  } else {
    source = 'browser/console';
    message = text;
  }
  logger[logType]({ source, message, pageId, data: { type } });
};
