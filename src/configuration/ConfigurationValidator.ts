// import { options } from './Config.js';
import type { Configuration } from './Configuration.js';

export const ConfigurationValidator = {
  // eslint-disable-next-line @typescript-eslint/require-await -- implementation will evolve
  async validate(configuration: object): Promise<Configuration> {
    if (!('cwd' in configuration)) {
      throw new Error('cwd is required');
    }
    return configuration as Configuration;
  }
};
