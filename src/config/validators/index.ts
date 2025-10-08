import { OptionType } from '../IOption.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';

export const validators: { [key in OptionType]: OptionValidator } = {
  [OptionType.boolean]: boolean
};
