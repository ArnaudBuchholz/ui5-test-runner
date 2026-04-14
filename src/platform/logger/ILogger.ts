import type { Configuration } from '../../configuration/Configuration.js';
import type { LogAttributes } from './types.js';

export interface ILogger {
  start(configuration: Configuration): void;
  debug(attributes: LogAttributes): void;
  info(attributes: LogAttributes): void;
  warn(attributes: LogAttributes): void;
  error(attributes: LogAttributes): void;
  fatal(attributes: LogAttributes): void;
  stop(): Promise<void>;
}
