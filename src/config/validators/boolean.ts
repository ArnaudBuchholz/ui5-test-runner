import type { IOption } from '../IOption.js';
import type { OptionValidator } from './OptionValidator.js';

const BOOLEAN_TRUE = new Set<unknown>([1, 'on']);
const BOOLEAN_FALSE = new Set<unknown>([0, 'off']);

export const boolean: OptionValidator = async (option: IOption, value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (BOOLEAN_TRUE.has(value)) {
    return true;
  }
  if (BOOLEAN_FALSE.has(value)) {
    return false;
  }
  throw new Error();
};
