import type { Configuration } from './Configuration.js';
import { options, defaults } from './options.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import { OptionValidationError } from './OptionValidationError.js';
import { Modes } from './Modes.js';

const assertIfConfiguration: (value: object) => asserts value is Configuration = (value) => {
  const errors: OptionValidationError[] = [];
  for (const key of Object.keys(value)) {
    const option = indexedOptions[key];
    if (option) {
      if (key === option.short) {
        errors.push(new OptionValidationError(option, 'Do not use short name'));
      } else if (key !== option.name) {
        errors.push(new OptionValidationError(option, 'Do not use kebab-case'));
      }
    } else {
      errors.push(OptionValidationError.createUnknown(key));
    }
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Unknown keys');
  }
  const [error] = errors;
  if (error) {
    throw error;
  }
};

export const ConfigurationValidator = {
  merge(configuration: Configuration): Promise<Configuration> {
    return Promise.resolve(configuration);
  },

  computeMode(configuration: Configuration): Modes {
    if (configuration.help) {
      return Modes.help;
    }
    if (configuration.version) {
      return Modes.version;
    }
    if (configuration.url) {
      return Modes.remote;
    }
    return Modes.legacy;
  },

  async validate(configuration: object): Promise<Configuration> {
    const withDefaults = Object.assign(Object.create(defaults), configuration) as object;
    assertIfConfiguration(withDefaults);
    const merged = await this.merge(withDefaults);
    merged.mode = this.computeMode(merged);
    for (const option of options) {
      if (Object.hasOwnProperty.call(merged, option.name)) {
        Object.assign(merged, {
          [option.name]: await validators[option.type](option, merged[option.name], merged)
        });
      }
    }
    return merged;
  }
};
