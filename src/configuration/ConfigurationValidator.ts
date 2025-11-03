import type { Configuration } from './Configuration.js';
import { options, defaults } from './options.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import { OptionValidationError } from './OptionValidationError.js';

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
  async validate(configuration: object): Promise<Configuration> {
    const withDefaults = Object.assign(Object.create(defaults), configuration) as object;
    assertIfConfiguration(withDefaults);
    for (const option of options) {
      if (Object.hasOwnProperty.call(withDefaults, option.name)) {
        Object.assign(withDefaults, {
          [option.name]: await validators[option.type](option, withDefaults[option.name], withDefaults)
        });
      }
    }
    return withDefaults;
  }
};
