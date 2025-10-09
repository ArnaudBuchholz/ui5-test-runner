import type { IOption } from '../IOption.js';
import { OptionValidationError } from './OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

const BOOLEAN_TRUE = new Set<unknown>(['true', 'on', 1]);
const BOOLEAN_FALSE = new Set<unknown>(['false', 'off', 0]);

export const boolean: OptionValidator = (option: IOption, value: unknown) => {
  if (typeof value === 'boolean') {
    return Promise.resolve(value);
  }
  if (BOOLEAN_TRUE.has(value)) {
    return Promise.resolve(true);
  }
  if (BOOLEAN_FALSE.has(value)) {
    return Promise.resolve(false);
  }
  return Promise.reject(new OptionValidationError(option));
};
