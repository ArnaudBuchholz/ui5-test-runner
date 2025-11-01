import { it, expect } from 'vitest';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import { OptionValidationError } from './OptionValidationError.js';

it('adds defaults when not set', async () => {
  const configuration = await ConfigurationValidator.validate({});
  expect(configuration.cwd).not.toBeUndefined();
});

it('rejects the configuration if it contains one unknown key', async () => {
  await expect(ConfigurationValidator.validate({ unknown: 1 })).rejects.toThrowError(
    OptionValidationError.createUnknown('unknown')
  );
});

it('rejects the configuration if it contains unknown keys', async () => {
  await expect(ConfigurationValidator.validate({ unknown: 1, unknown2: 2 })).rejects.toThrowError(
    new AggregateError(
      [OptionValidationError.createUnknown('unknown'), OptionValidationError.createUnknown('unknown2')],
      'Unknown keys'
    )
  );
});
