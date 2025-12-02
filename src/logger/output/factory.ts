import { Platform } from '../../Platform.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { ILoggerOutput } from './ILoggerOutput.js';
import { InteractiveLoggerOutput } from './InteractiveOutput.js';
import { StaticLoggerOutput } from './StaticOutput.js';

export const LoggerOutputFactory = {
  build(configuration: Configuration): ILoggerOutput {
    const { ci } = configuration;
    return !ci && Platform.isTextTerminal
      ? new InteractiveLoggerOutput(configuration)
      : new StaticLoggerOutput(configuration);
  }
};
