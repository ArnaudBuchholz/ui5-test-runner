import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const integer: OptionValidator<'integer'> = (option, value) => {
  if (typeof value === 'string') {
    value = Number.parseInt(value);
  }
  if (typeof value !== 'number' || value % 1 !== 0) {
    throw OptionValidationError.createInvalidValue(option);
  }
  if (value < 0 && option.typeModifiers?.has('positive')) {
    throw OptionValidationError.createInvalidValue(option);
  }
  if (value === 0 && option.typeModifiers?.has('non-zero')) {
    throw OptionValidationError.createInvalidValue(option);
  }
  return value;
};
