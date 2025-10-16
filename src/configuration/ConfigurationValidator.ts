import type { Configuration } from './Configuration.js';
import { indexedOptions } from './indexedOptions.js';
import { OptionValidationError } from './OptionValidationError.js';

export const ConfigurationValidator = {
  // eslint-disable-next-line @typescript-eslint/require-await -- implementation will evolve
  async validate(configuration: object): Promise<Configuration> {
    if (!('cwd' in configuration)) {
      throw new OptionValidationError(indexedOptions.cwd, 'Required option');
    }
    return configuration as Configuration;
  }
};
