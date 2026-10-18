import type { Configuration } from '../../../configuration/Configuration.js';
import type { BaseLoggerOutput } from './BaseLoggerOutput.js';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';
import { LlmLoggerOutput } from './LlmLoggerOutput.js';
import { StaticLoggerOutput } from './StaticLoggerOutput.js';

export const LoggerOutputFactory = {
  build(configuration: Configuration, startedAt: number): BaseLoggerOutput {
    const { ci, llm } = configuration;
    if (llm) {
      return new LlmLoggerOutput(configuration, startedAt);
    }
    return ci
      ? new StaticLoggerOutput(configuration, startedAt)
      : new InteractiveLoggerOutput(configuration, startedAt);
  }
};
