import type { Configuration } from '../../configuration/Configuration.js';
import type { BaseLoggerOutput } from './BaseLoggerOutput.js';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';
import { StaticLoggerOutput } from './StaticLoggerOutput.js';

export const LoggerOutputFactory = {
  build(configuration: Configuration): BaseLoggerOutput {
    const { ci } = configuration;
    return ci ? new StaticLoggerOutput(configuration) : new InteractiveLoggerOutput(configuration);
  }
};
