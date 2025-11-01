import type { Configuration } from './Configuration.js';
import { options } from './options.js';
import { indexedOptions } from './indexedOptions.js';
// import { validators } from './validators/index.js';
import { OptionValidationError } from './OptionValidationError.js';

const assertIfConfiguration: (value: object) => asserts value is Configuration = (value) => {
  const errors: OptionValidationError[] = [];
  for (const key of Object.keys(value)) {
    if (!(key in indexedOptions)) {
      errors.push(OptionValidationError.createUnknown(key));
    }
  }
  const [error] = errors;
  if (error) {
    throw error;
  } else if (errors.length > 0) {
    throw new AggregateError(errors, 'Unknown keys');
  }
};

export const ConfigurationValidator = {
  async validate(configuration: object): Promise<Configuration> {
    // Adds default values
    for (const option of options) {
      if ('default' in option && !(option.name in configuration)) {
        Object.assign(configuration, {
          [option.name]: option.default
        });
      }
    }
    assertIfConfiguration(configuration);
    // for (const option of options) {
    //   if (option.name in configuration) {
    //     Object.assign(configuration, {
    //       [option.name]: await validators[option.type](option, configuration[option.name], configuration)
    //     });
    //   }
    // }
    return configuration;
  }
};
