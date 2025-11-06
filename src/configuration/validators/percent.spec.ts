import { percent } from './percent.js';
import { checkValidator, noBooleans } from './checkValidator.test.js';

checkValidator({
  validator: percent,
  option: {
    description: 'Percent option',
    name: 'percent',
    type: 'percent'
  },
  valid: [
    { value: 0, expected: 0 },
    { value: 1, expected: 1 },
    { value: 10, expected: 10 },
    { value: 50, expected: 50 },
    { value: 80.97, expected: 80.97 },
    { value: 100, expected: 100 },
    { value: '0%', expected: 0 },
    { value: '1%', expected: 1 },
    { value: '10%', expected: 10 },
    { value: '50%', expected: 50 },
    { value: '80.97%', expected: 80.97 },
    { value: '100%', expected: 100 }
  ],
  invalid: [
    ...noBooleans,
    { value: -1 },
    { value: -1.5 },
    { value: -101 },
    { value: 101 },
    { value: '-1%' },
    { value: '1 %' },
    { value: ' 1%' },
    { value: 'abc' }
  ]
});
