import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const string: OptionValidator<'string'> = (option, value) => {
  if (typeof value !== 'string' || !value) {
    throw OptionValidationError.createInvalidValue(option);
  }
  return value;
};
