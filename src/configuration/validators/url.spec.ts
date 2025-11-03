import { url } from './url.js';
import { checkValidator, noBooleans, noIntegers } from './checkValidator.test.js';

checkValidator({
  validator: url,
  option: {
    description: 'url option',
    name: 'url',
    type: 'url'
  },
  valid: [{ value: 'http://localhost:8080' }],
  invalid: [...noBooleans, ...noIntegers, ...noIntegers]
});
