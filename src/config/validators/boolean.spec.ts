import { it, expect } from 'vitest';
import type { IOption } from '../IOption.js';
import { OptionType } from '../IOption.js';
import { boolean } from './boolean.js';

const OPTION = {
  description: 'Boolean option',
  name: 'bool',
  type: OptionType.boolean
} as const as IOption;

it('converts "true" to true', () => {
  expect(boolean(OPTION, 'true')).toStrictEqual(true);
});
