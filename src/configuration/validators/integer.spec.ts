import { integer } from './integer.js';
import { checkValidator, noBooleans, noNumbers } from './checkValidator.test.js';

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
    { value: '1', expected: 1 },
    { value: '0', expected: 0 },
    { value: '-1', expected: -1 },
    { value: '1234', expected: 1234 }
  ],
  invalid: [...noBooleans, ...noNumbers, { value: '' }, { value: 'Hello World !' }]
});

const POSITIVE_OPTION = {
  description: 'Positive integer',
  name: 'positive',
  type: 'integer' as const,
  typeModifiers: new Set(['positive'] as const)
};
const NON_ZERO_OPTION = {
  description: 'Non-zero integer',
  name: 'non-zero',
  type: 'integer' as const,
  typeModifiers: new Set(['non-zero'] as const)
};
const POSITIVE_NON_ZERO_OPTION = {
  description: 'Positive non-zero integer',
  name: 'positive-non-zero',
  type: 'integer' as const,
  typeModifiers: new Set(['positive', 'non-zero'] as const)
};

checkValidator({
  validator: integer,
  option: POSITIVE_OPTION,
  valid: [
    { value: 0, expected: 0 },
    { value: 1, expected: 1 },
    { value: 42, expected: 42 }
  ],
  invalid: [{ value: -1 }, { value: '-1' }]
});

checkValidator({
  validator: integer,
  option: NON_ZERO_OPTION,
  valid: [
    { value: 1, expected: 1 },
    { value: -1, expected: -1 },
    { value: 42, expected: 42 }
  ],
  invalid: [{ value: 0 }, { value: '0' }]
});

checkValidator({
  validator: integer,
  option: POSITIVE_NON_ZERO_OPTION,
  valid: [
    { value: 1, expected: 1 },
    { value: 42, expected: 42 }
  ],
  invalid: [{ value: 0 }, { value: -1 }, { value: '0' }, { value: '-1' }]
});
