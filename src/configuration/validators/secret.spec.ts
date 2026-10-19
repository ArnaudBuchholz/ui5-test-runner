import { describe, it, expect } from 'vitest';
import { secret } from './secret.js';
import { OptionValidationError } from '../OptionValidationError.js';
import { SecretValue } from '../../types/SecretValue.js';
import { invalidValues, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import type { Configuration } from '../Configuration.js';

const OPTION = { description: 'Secret option', name: 'secret', type: 'secret' } as const;
const CONFIGURATION = {} as Configuration;

describe('validators/secret', () => {
  it('☒ "password" ➜ SecretValue("password")', () => {
    const result = secret(OPTION, 'password', CONFIGURATION);
    expect(result).toBeInstanceOf(SecretValue);
    expect((result as SecretValue).reveal()).toBe('password');
  });

  for (const { value } of [...invalidValues, { value: '' }, ...noBooleans, ...noIntegers, ...noNumbers]) {
    it(`☐ ${JSON.stringify(value) ?? String(value)}`, () => {
      expect(() => secret(OPTION, value, CONFIGURATION)).toThrow(OptionValidationError);
    });
  }
});
