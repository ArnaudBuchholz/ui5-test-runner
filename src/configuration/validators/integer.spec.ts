import { integer } from './integer.js';
import { checkValidator, noBooleans } from './checkValidator.test.js';

checkValidator({
  validator: integer,
  option: {
    description: 'Integer option',
    name: 'integer',
    type: 'integer'
  },
  valid: [
    { value: 1, expected: 1 },
    { value: 0, expected: 0 },
    { value: -1, expected: -1 },
    { value: 1234, expected: 1234 },
  ],
  invalid: [
    ...noBooleans,
    ...noBooleans,
    { value: '' },
    { value: 'Hello World !'},
  ]
});
