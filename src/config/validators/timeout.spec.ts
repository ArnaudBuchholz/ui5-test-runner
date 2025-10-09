import { it, expect } from 'vitest';
import { OptionType } from '../IOption.js';
import { timeout } from './timeout.js';
import { checkValidator } from './checkValidator.test.js';

it('is a function', () => expect(typeof timeout).toStrictEqual('function'));

checkValidator({
  validator: timeout,
  option: {
    description: 'Timeout option',
    name: 'timeout',
    type: OptionType.timeout
  },
  valid: [
    { value: 0, expected: 0 },
    { value: 1, expected: 1 },
    { value: 1234, expected: 1234 },
    { value: 'none', expected: 0 },
    { value: '0', expected: 0 },
    { value: '1', expected: 1 },
    { value: '1234', expected: 1234 },
    { value: '1234ms', expected: 1234 },
    { value: '1s', expected: 1000 },
    { value: '1sec', expected: 1000 },
    { value: '1m', expected: 60_000 },
    { value: '1min', expected: 60_000 }
  ],
  invalid: [
    { value: null },
    { value: -1 },
    { value: -1234 },
    { value: '-1234' },
    { value: '1234 ms' },
    { value: ' 1234ms' },
    { value: 'abc' }
  ]
});
