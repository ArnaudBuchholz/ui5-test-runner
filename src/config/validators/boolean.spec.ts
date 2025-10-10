import { it, expect } from 'vitest';
import { boolean } from './boolean.js';
import { checkValidator } from './checkValidator.test.js';

it('is a function', () => expect(typeof boolean).toStrictEqual('function'));

checkValidator({
  validator: boolean,
  option: {
    description: 'Boolean option',
    name: 'boolean',
    type: 'boolean',
  },
  valid: [
    { value: true, expected: true },
    { value: 'true', expected: true },
    { value: 'on', expected: true },
    { value: 1, expected: true },
    { value: false, expected: false },
    { value: 'false', expected: false },
    { value: 'off', expected: false },
    { value: 0, expected: false }
  ],
  invalid: [{ value: null }]
});
