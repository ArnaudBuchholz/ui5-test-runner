import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const regexp: OptionValidator<'regexp'> = (option, value) => {
  if (typeof value === 'object' && value instanceof RegExp) {
    return value;
  }
  if (typeof value !== 'string' || !value) {
    throw new OptionValidationError(option);
  }
  try {
    const match = /^\/(.+)\/(\w*)$/.exec(value);
    if (match) {
      const [, pattern = '', flags = ''] = match;
      return new RegExp(pattern, flags);
    }
    return new RegExp(value);
  } catch (error) {
    throw new OptionValidationError(option, 'Invalid regexp', error);
  }
};
