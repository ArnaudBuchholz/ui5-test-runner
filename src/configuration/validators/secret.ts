import { SecretValue } from '../../types/SecretValue.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const secret: OptionValidator<'secret'> = (option, value) => {
  if (typeof value !== 'string' || !value) {
    throw OptionValidationError.createInvalidValue(option);
  }
  return new SecretValue(value);
};
