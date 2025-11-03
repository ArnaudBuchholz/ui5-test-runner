import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

export const looksLikeAnUrl = (value: string): boolean => !!/^https?:\/\/[^ "]+$/.test(value);

export const url: OptionValidator<'url'> = (option, value) => {
  if (typeof value === 'string' && looksLikeAnUrl(value)) {
    return value;
  }
  throw new OptionValidationError(option);
};
