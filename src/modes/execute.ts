import type { Configuration } from '../configuration/Configuration.js';
import { help } from './help.js';
import { log } from './log.js';
import type { ModeFunction } from './ModeFunction.js';
import { Modes } from './Modes.js';
import { version } from './version.js';
import { test } from './test.js';

const notImplemented = () => {
  throw new Error('Not implemented');
};

const modeFunctions: { [key in Modes]: ModeFunction } = {
  [Modes.batch]: notImplemented,
  [Modes.capabilities]: notImplemented,
  [Modes.help]: help,
  [Modes.legacy]: test,
  [Modes.log]: log,
  [Modes.remote]: test,
  [Modes.version]: version
};

export const execute = async (configuration: Configuration): Promise<void> => {
  const modeFunction = modeFunctions[configuration.mode];
  await modeFunction(configuration);
};
