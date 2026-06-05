import { enumeration } from './enumeration.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';

checkValidator({
  validator: enumeration,
  option: {
    description: 'Enumeration option',
    name: 'enumeration',
    type: 'enumeration',
    typeModifiers: new Set(['hello', 'world'])
  },
  valid: [{ value: 'hello', expected: 'hello' }],
  invalid: [{ value: 'hello world' }, ...noBooleans, ...noIntegers, ...noNumbers]
});
