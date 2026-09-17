import { json } from './json.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import { OptionValidationError } from '../OptionValidationError.js';
import { it, expect } from 'vitest';

const JSON_OPTION = {
  description: 'JSON option',
  name: 'browserOptions',
  type: 'json'
} as const;

checkValidator({
  validator: json,
  option: JSON_OPTION,
  valid: [
    { value: '{}', expected: {} },
    { value: '{"key":"value"}', expected: { key: 'value' } },
    { value: { key: 'value' }, expected: { key: 'value' } }
  ],
  invalid: [
    { value: 'not-json' },
    { value: '[]' },
    { value: '"string"' },
    { value: '42' },
    ...noBooleans,
    ...noIntegers,
    ...noNumbers
  ]
});

it('throws createConfigInvalidJson for malformed JSON', async () => {
  let capturedError: unknown;
  try {
    await json(JSON_OPTION, 'not-json', {} as never);
  } catch (error) {
    capturedError = error;
  }
  expect(capturedError).toBeInstanceOf(OptionValidationError);
  if (capturedError instanceof OptionValidationError) {
    expect(capturedError.message).toContain('not valid JSON');
  }
});
