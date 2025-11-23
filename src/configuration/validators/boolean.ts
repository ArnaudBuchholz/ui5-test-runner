import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

const BOOLEAN_TRUE = new Set<unknown>(['true', 'on', 1]);
const BOOLEAN_FALSE = new Set<unknown>(['false', 'off', 0]);

export const boolean: OptionValidator<'boolean'> = (option, value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (BOOLEAN_TRUE.has(value)) {
    return true;
  }
  if (BOOLEAN_FALSE.has(value)) {
    return false;
  }
  throw new OptionValidationError(option);
};
