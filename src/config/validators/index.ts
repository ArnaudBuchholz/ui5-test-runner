import { OptionType } from '../IOption.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';
import { timeout } from './timeout.js';

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  timeout
};
