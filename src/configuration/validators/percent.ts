import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const percent: OptionValidator<'percent'> = (option, value) => {
  if (typeof value === 'string') {
    // eslint-disable-next-line security/detect-unsafe-regex -- Safe enough
    const match = /^(\d{0,3}(:?\.\d{0,3})?)%$/.exec(value);
    if (match) {
      const [, digits = '0'] = match;
      const float = Number.parseFloat(digits);
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
