import type { Configuration } from '../../configuration/Configuration.js';
import type { AbstractLoggerOutput } from './AbstractLoggerOutput.js';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';
import { StaticLoggerOutput } from './StaticLoggerOutput.js';

export const LoggerOutputFactory = {
  build(configuration: Configuration): AbstractLoggerOutput {
    const { ci } = configuration;
    return ci ? new StaticLoggerOutput(configuration) : new InteractiveLoggerOutput(configuration);
  }
};
