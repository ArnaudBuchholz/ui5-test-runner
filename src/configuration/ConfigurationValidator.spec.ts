import { it, expect } from 'vitest';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import { OptionValidationError } from './OptionValidationError.js';
import { indexedOptions } from './indexedOptions.js';

it('validates that cwd is defined', async () => {
  await expect(ConfigurationValidator.validate({})).rejects.toThrowError(
    new OptionValidationError(indexedOptions.cwd, 'Required option')
  );
});
