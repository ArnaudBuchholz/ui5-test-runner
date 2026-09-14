import { boolean } from './boolean.js';
import { checkValidator, noIntegers } from './checkValidator.test.js';

checkValidator({
  validator: boolean,
  option: {
    description: 'Boolean option',
    name: 'boolean',
    type: 'boolean'
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
  invalid: noIntegers.filter(({ value }) => ![0, 1].includes(value))
});
