import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const percent: OptionValidator<'percent'> = (option, value) => {
  if (typeof value === 'string') {
    const match = /^(\d*(:?\.\d*)?)%$/.exec(value);
    if (match) {
      const [, digits = '0'] = match;
      let float = Number.parseFloat(digits);
      if (float >= 0 && float <= 100) {
        value = float;
      }
    }
  }
  if (typeof value === 'number' && !Number.isNaN(value) && value >= 0 && value <= 100) {
    return value;
  }
  throw new OptionValidationError(option);
};
