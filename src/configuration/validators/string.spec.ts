import { string } from './string.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';

checkValidator({
  validator: string,
  option: {
    description: 'String option',
    name: 'string',
    type: 'string'
  },
  valid: [
    { value: 'hello world !', expected: 'hello world !' },
  ],
  invalid: [
    { value: '' },
    ...noBooleans,
    ...noIntegers,
    ...noNumbers
  ]
});
