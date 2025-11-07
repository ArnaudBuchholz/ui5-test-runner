import { regexp } from './regexp.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';

checkValidator({
  validator: regexp,
  option: {
    description: 'Regexp option',
    name: 'regexp',
    type: 'regexp'
  },
  valid: [
    { value: 'abc', expected: /abc/ },
    { value: /abc/, expected: /abc/ },
    { value: '/abc/gi', expected: /abc/gi },
  ],
  invalid: [
    ...noBooleans,
    ...noNumbers,
    ...noIntegers,
    { value: '' },
    { value: '*' },
  ]
});
