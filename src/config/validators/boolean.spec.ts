import { OptionType } from '../IOption.js';
import { boolean } from './boolean.js';
import { checkValidator } from './checkValidator.test.js';

// eslint-disable sonarjs/no-empty-test-file -- tests are implemented through checkValidator

checkValidator({
  validator: boolean,
  option: {
    description: 'Boolean option',
    name: 'bool',
    type: OptionType.boolean
  },
  valid: [
    { value: true, expected: true },
    { value: 'true', expected: true },
    { value: 'on', expected: true },
    { value: 1, expected: true },
    { value: false, expected: false },
    { value: 'false', expected: false },
    { value: 'off', expected: false },
    { value: 0, expected: false },
  ],
  invalid: [{ value: null }]
});
