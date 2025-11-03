import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const folder: OptionValidator<'folder'> = (option, value) => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  return value;
};
