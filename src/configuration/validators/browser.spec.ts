import { browser } from './browser.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';

checkValidator({
  validator: browser,
  option: {
    description: 'Browser option',
    name: 'browser',
    type: 'browser'
  },
  valid: [
    { value: 'puppeteer', expected: 'puppeteer' },
    { value: '$/puppeteer.js', expected: 'puppeteer' }
  ],
  invalid: [...noIntegers, ...noBooleans, ...noNumbers, { value: 'pupetteer' }]
});
