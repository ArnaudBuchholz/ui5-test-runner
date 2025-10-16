import type { Option } from '../Option.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const timeout: OptionValidator<'timeout'> = (option: Option, value: unknown) => {
  if (typeof value === 'string') {
    if (value === 'none') {
      return 0;
    }
    const match = /^(\d+)(ms|s|sec|m|min)?$/.exec(value);
    if (match) {
      const [, digits = '0', specifier = ''] = match;
      let int = Number.parseInt(digits);
      if (['s', 'sec'].includes(specifier)) {
        int = int * 1000;
      }
      if (['m', 'min'].includes(specifier)) {
        int = int * 60 * 1000;
      }
      value = int;
    }
  }
  if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
    return value;
  }
  throw new OptionValidationError(option);
};
