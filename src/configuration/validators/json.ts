import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const json: OptionValidator<'json'> = (option, value) => {
  if (isJsonObject(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    throw OptionValidationError.createInvalidValue(option);
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isJsonObject(parsed)) {
      throw OptionValidationError.createInvalidValue(option);
    }
    return parsed;
  } catch (error) {
    if (error instanceof OptionValidationError) {
      throw error;
    }
    throw OptionValidationError.createConfigInvalidJson(option, value, error);
  }
};
