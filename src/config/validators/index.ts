import { OptionType } from '../IOption.js';
import { OptionValidator } from './OptionValidator.js';

export const validators: { [key in OptionType]: OptionValidator } = {};
