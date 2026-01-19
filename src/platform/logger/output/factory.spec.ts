import { it, expect } from 'vitest';
import { LoggerOutputFactory } from './factory.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { StaticLoggerOutput } from './StaticLoggerOutput.js';
import { InteractiveLoggerOutput } from './InteractiveLoggerOutput.js';

it('creates an instance of StaticLoggerOutput is ci is set', () => {
  const output = LoggerOutputFactory.build({ ci: true } as Configuration, Date.now());
  expect(output).toBeInstanceOf(StaticLoggerOutput);
});

it('creates an instance of InteractiveLoggerOutput otherwise', () => {
  const output = LoggerOutputFactory.build({} as Configuration, Date.now());
  expect(output).toBeInstanceOf(InteractiveLoggerOutput);
});
