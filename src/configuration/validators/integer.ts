import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const integer: OptionValidator<'integer'> = (option, value) => {
  if (typeof value !== 'number' || value % 1 !== 0) {
    throw new OptionValidationError(option);
  }
  return value;
};
