import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const enumeration: OptionValidator<'enumeration'> = (option, value) => {
  if (typeof value !== 'string' || !option.typeModifiers?.has(value)) {
    throw OptionValidationError.createInvalidValue(option);
  }
  return value;
};
