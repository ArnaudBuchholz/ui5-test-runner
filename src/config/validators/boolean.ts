import type { IOption } from '../IOption.js';
import type { OptionValidator } from './OptionValidator.js';

export const boolean: OptionValidator = async (option: IOption, value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }
  throw new Error();
}