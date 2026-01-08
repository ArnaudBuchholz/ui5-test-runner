import { it, expect, describe, vi } from 'vitest';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import { OptionValidationError } from './OptionValidationError.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import type { Option, OptionType } from './Option.js';
import { defaults } from './options.js';
import type { Configuration } from './Configuration.js';
import { Modes } from '../modes/Modes.js';
import type { OptionValidator } from './validators/OptionValidator.js';

for (const key of Object.keys(validators)) {
  validators[key as OptionType] = vi.fn((option: Option, value: unknown) => value) as OptionValidator<OptionType>;
}

describe('defaults', () => {
  it('adds defaults', async () => {
    const configuration = await ConfigurationValidator.validate({});
    expect(configuration.cwd).not.toBeUndefined();
  });

  it('can dump defaults using JSON.stringify', async () => {
    const configuration = await ConfigurationValidator.validate({});
    expect(JSON.stringify(configuration, ['cwd'])).toContain('"cwd":');
  });

  it('does not expose it as own property', async () => {
    const configuration = await ConfigurationValidator.validate({});
    expect(Object.hasOwnProperty.call(configuration, 'cwd')).toStrictEqual(false);
  });

  it('allows override', async () => {
    const configuration = await ConfigurationValidator.validate({ cwd: '/test/user' });
    expect(configuration.cwd).toStrictEqual('/test/user');
  });

  it('knows if overridden using Object.hasOwnProperty', async () => {
    const configuration = await ConfigurationValidator.validate({ cwd: '/test/user' });
    expect(Object.hasOwnProperty.call(configuration, 'cwd')).toStrictEqual(true);
  });
});

describe('validation', () => {
  it('rejects the configuration if it contains an unknown key', async () => {
    await expect(ConfigurationValidator.validate({ unknown: 1 })).rejects.toThrowError(
      OptionValidationError.createUnknown('unknown')
    );
  });

  it('rejects the configuration if it contains several unknown keys', async () => {
    await expect(ConfigurationValidator.validate({ unknown: 1, unknown2: 2 })).rejects.toThrowError(
      new AggregateError(
        [OptionValidationError.createUnknown('unknown'), OptionValidationError.createUnknown('unknown2')],
        'Unknown keys'
      )
    );
  });

  it('rejects short option name', async () => {
    await expect(ConfigurationValidator.validate({ c: '/test/user' })).rejects.toThrowError(
      new OptionValidationError(indexedOptions.cwd, 'Do not use short name')
    );
  });

  it('rejects kebab-case option name', async () => {
    await expect(ConfigurationValidator.validate({ 'page-timeout': 10 })).rejects.toThrowError(
      new OptionValidationError(indexedOptions.pageTimeout, 'Do not use kebab-case')
    );
  });

  it('calls the corresponding option validator', async () => {
    await ConfigurationValidator.validate({ cwd: '/test/user', pageTimeout: 10 });
    expect(validators.folder).toHaveBeenCalledWith(indexedOptions.cwd, '/test/user', expect.any(Object));
    expect(validators.timeout).toHaveBeenCalledWith(indexedOptions.pageTimeout, 10, expect.any(Object));
  });

  it('calls the corresponding validator (multiple)', async () => {
    await ConfigurationValidator.validate({
      cwd: '/test/user',
      url: ['http://localhost:8080', 'http://localhost:8081']
    });
    expect(validators.url).toHaveBeenCalledWith(indexedOptions.url, 'http://localhost:8080', expect.any(Object));
    expect(validators.url).toHaveBeenCalledWith(indexedOptions.url, 'http://localhost:8081', expect.any(Object));
  });

  it('converts the unique multiple value into an array', async () => {
    const validated = await ConfigurationValidator.validate({
      cwd: '/test/user',
      url: 'http://localhost:8080'
    });
    expect(validators.url).toHaveBeenCalledWith(indexedOptions.url, 'http://localhost:8080', expect.any(Object));
    expect(validated.url).toStrictEqual(['http://localhost:8080']);
  });

  it.skip('may return multiple errors');
});

describe('mode', () => {
  const config = (options: Partial<Configuration>) => Object.assign(Object.create(defaults), options) as Configuration;

  it('sets to remote when url is used', () => {
    expect(ConfigurationValidator.computeMode(config({ url: ['http://localhost:8080 '] }))).toBe(Modes.remote);
  });

  it('sets to help when help is used', () => {
    expect(ConfigurationValidator.computeMode(config({ help: true }))).toBe(Modes.help);
  });

  it('sets to version when version is used', () => {
    expect(ConfigurationValidator.computeMode(config({ version: true }))).toBe(Modes.version);
  });

  it('sets to legacy otherwise', () => {
    expect(ConfigurationValidator.computeMode(config({}))).toBe(Modes.legacy);
  });
});
