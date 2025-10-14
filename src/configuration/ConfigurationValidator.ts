// import { options } from './Config.js';
import type { Configuration } from './Configuration.js';

export class ConfigurationValidator {
  static async validate(configuration: object): Promise<Configuration> {
    if (!('cwd' in configuration)) {
      throw new Error('cwd is required');
    }
    return configuration as Configuration;
  }
}
