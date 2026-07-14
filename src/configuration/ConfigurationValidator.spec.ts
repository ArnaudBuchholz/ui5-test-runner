import { it, expect, describe, vi, beforeEach } from 'vitest';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import { OptionValidationError } from './OptionValidationError.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import type { Option, OptionType } from './Option.js';
import { defaults } from './options.js';
import type { Configuration } from './Configuration.js';
import { Modes } from '../modes/Modes.js';
import type { OptionValidator } from './validators/OptionValidator.js';
import { FileSystem } from '../platform/index.js';

for (const key of Object.keys(validators)) {
  validators[key as OptionType] = vi.fn((option: Option, value: unknown) => value) as OptionValidator<OptionType>;
}

const CONFIG_FILE_PATH = '/project/ui5-test-runner.json' as const;
const CONFIG_FILE_DIR = '/project' as const;

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
    expect(Object.hasOwnProperty.call(configuration, 'parallel')).toStrictEqual(false);
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
    await expect(ConfigurationValidator.validate({ unknown: 1 })).rejects.toThrow(
      OptionValidationError.createUnknown('unknown')
    );
  });

  it('rejects the configuration if it contains several unknown keys', async () => {
    await expect(ConfigurationValidator.validate({ unknown: 1, unknown2: 2 })).rejects.toThrow(
      new AggregateError(
        [OptionValidationError.createUnknown('unknown'), OptionValidationError.createUnknown('unknown2')],
        'Unknown keys'
      )
    );
  });

  it('rejects short option name', async () => {
    await expect(ConfigurationValidator.validate({ c: '/test/user' })).rejects.toThrow(
      OptionValidationError.createShortName(indexedOptions.cwd)
    );
  });

  it('rejects kebab-case option name', async () => {
    await expect(ConfigurationValidator.validate({ 'page-timeout': 10 })).rejects.toThrow(
      OptionValidationError.createKebabCase(indexedOptions.pageTimeout)
    );
  });

  it('calls the corresponding option validator', async () => {
    await ConfigurationValidator.validate({ cwd: '/test/user', pageTimeout: 10 });
    expect(validators['fs-entry']).toHaveBeenCalledWith(indexedOptions.cwd, '/test/user', expect.any(Object));
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
    expect(ConfigurationValidator.computeMode(config({ url: ['http://localhost:8080'] }))).toBe(Modes.remote);
  });

  it('sets to help when help is used', () => {
    expect(ConfigurationValidator.computeMode(config({ help: true }))).toBe(Modes.help);
  });

  it('sets to log when log is used', () => {
    expect(ConfigurationValidator.computeMode(config({ log: '/usr/abz/file.log.gz' }))).toBe(Modes.log);
  });

  it('sets to version when version is used', () => {
    expect(ConfigurationValidator.computeMode(config({ version: true }))).toBe(Modes.version);
  });

  it('sets to legacy otherwise', () => {
    expect(ConfigurationValidator.computeMode(config({}))).toBe(Modes.legacy);
  });
});

describe('merge (config file loading)', () => {
  beforeEach(() => {
    vi.mocked(FileSystem.readFile).mockReset();
  });

  describe('no-op cases', () => {
    it('skips loading when config is empty string', async () => {
      const result = await ConfigurationValidator.validate({ config: '' });
      expect(FileSystem.readFile).not.toHaveBeenCalled();
      expect(result.pageTimeout).toBeUndefined();
    });
  });

  describe('file reading errors', () => {
    it('throws an OptionValidationError for config when the file cannot be read', async () => {
      vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('ENOENT'));
      let capturedError: unknown;
      try {
        await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      } catch (error) {
        capturedError = error;
      }
      expect.assert(capturedError instanceof OptionValidationError);
      expect(capturedError.option).toStrictEqual(indexedOptions.config);
      expect(capturedError.message).toContain(`cannot read config file ${CONFIG_FILE_PATH}`);
    });
  });

  describe('parsing errors', () => {
    it('throws an OptionValidationError for config when the file is not valid JSON', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue('not json');
      let capturedError: unknown;
      try {
        await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      } catch (error) {
        capturedError = error;
      }
      expect.assert(capturedError instanceof OptionValidationError);
      expect(capturedError.option).toStrictEqual(indexedOptions.config);
      expect(capturedError.message).toContain(`config file ${CONFIG_FILE_PATH} is not valid JSON`);
    });

    it('throws an OptionValidationError for config when the file is a JSON array', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue('[]');
      await expect(ConfigurationValidator.validate({ config: CONFIG_FILE_PATH })).rejects.toThrow(
        OptionValidationError.createConfigNotObject(indexedOptions.config, CONFIG_FILE_PATH)
      );
    });

    it('throws an OptionValidationError for config when the file is a JSON scalar', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue('42');
      await expect(ConfigurationValidator.validate({ config: CONFIG_FILE_PATH })).rejects.toThrow(
        OptionValidationError.createConfigNotObject(indexedOptions.config, CONFIG_FILE_PATH)
      );
    });
  });

  describe('key validation', () => {
    it('throws when the config file contains an unknown key', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ unknown: 1 }));
      await expect(ConfigurationValidator.validate({ config: CONFIG_FILE_PATH })).rejects.toThrow(
        OptionValidationError.createUnknown('unknown')
      );
    });

    it('throws when the config file uses a kebab-case key', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ 'page-timeout': 30_000 }));
      await expect(ConfigurationValidator.validate({ config: CONFIG_FILE_PATH })).rejects.toThrow(
        OptionValidationError.createKebabCase(indexedOptions.pageTimeout)
      );
    });

    it('throws when the config file uses a short option name', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ c: '/some/path' }));
      await expect(ConfigurationValidator.validate({ config: CONFIG_FILE_PATH })).rejects.toThrow(
        OptionValidationError.createShortName(indexedOptions.cwd)
      );
    });
  });

  describe('CLI wins (no ! prefix)', () => {
    it('does not override a CLI option with the config file value', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ pageTimeout: 99_000 }));
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH, pageTimeout: 30_000 });
      expect(result.pageTimeout).toStrictEqual(30_000);
    });

    it('fills in an option not set on CLI from the config file', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ pageTimeout: 99_000 }));
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(result.pageTimeout).toStrictEqual(99_000);
    });
  });

  describe('! forcing', () => {
    it('overwrites a CLI option when the config file key is forced', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ '!pageTimeout': 99_000 }));
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH, pageTimeout: 30_000 });
      expect(result.pageTimeout).toStrictEqual(99_000);
    });

    it('sets a forced option that was not set on CLI', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ '!pageTimeout': 99_000 }));
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(result.pageTimeout).toStrictEqual(99_000);
    });
  });

  describe('cwd for path resolution', () => {
    it('injects the config file directory as cwd for the second validation pass', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ pageTimeout: 5000 }));
      await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      // The second validate() call must receive cwd = the config file's directory
      expect(validators['fs-entry']).toHaveBeenCalledWith(indexedOptions.cwd, CONFIG_FILE_DIR, expect.any(Object));
    });

    it('uses the absolute cwd from the config file when explicitly set', async () => {
      const customCwd = '/custom/cwd';
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ cwd: customCwd }));
      await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(validators['fs-entry']).toHaveBeenCalledWith(indexedOptions.cwd, customCwd, expect.any(Object));
    });

    it('resolves a relative cwd in the config file against the config file directory', async () => {
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ cwd: 'sub/dir' }));
      await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(validators['fs-entry']).toHaveBeenCalledWith(
        indexedOptions.cwd,
        `${CONFIG_FILE_DIR}/sub/dir`,
        expect.any(Object)
      );
    });
  });

  describe('recursive merging', () => {
    it('propagates keys from a nested config file to the top level', async () => {
      const NESTED_CONFIG_PATH = '/project/nested/ui5-test-runner.json' as const;
      vi.mocked(FileSystem.readFile).mockImplementation((path) => {
        if (path === CONFIG_FILE_PATH) {
          return Promise.resolve(JSON.stringify({ config: NESTED_CONFIG_PATH }) as never);
        }
        // nested file sets pageTimeout
        return Promise.resolve(JSON.stringify({ pageTimeout: 99_000 }) as never);
      });
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(result.pageTimeout).toStrictEqual(99_000);
    });

    it('CLI value wins over a key from a nested config file', async () => {
      const NESTED_CONFIG_PATH = '/project/nested/ui5-test-runner.json' as const;
      vi.mocked(FileSystem.readFile).mockImplementation((path) => {
        if (path === CONFIG_FILE_PATH) {
          return Promise.resolve(JSON.stringify({ config: NESTED_CONFIG_PATH }) as never);
        }
        return Promise.resolve(JSON.stringify({ pageTimeout: 99_000 }) as never);
      });
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH, pageTimeout: 30_000 });
      expect(result.pageTimeout).toStrictEqual(30_000);
    });

    it('parent config file value wins over a nested config file value', async () => {
      const NESTED_CONFIG_PATH = '/project/nested/ui5-test-runner.json' as const;
      vi.mocked(FileSystem.readFile).mockImplementation((path) => {
        if (path === CONFIG_FILE_PATH) {
          return Promise.resolve(JSON.stringify({ pageTimeout: 55_000, config: NESTED_CONFIG_PATH }) as never);
        }
        return Promise.resolve(JSON.stringify({ pageTimeout: 99_000 }) as never);
      });
      const result = await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      expect(result.pageTimeout).toStrictEqual(55_000);
    });
  });

  describe('depth limit', () => {
    it('throws an OptionValidationError for config when nesting exceeds the maximum depth', async () => {
      // Every read returns a config that points to another config file
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ config: CONFIG_FILE_PATH }));
      let capturedError: unknown;
      try {
        await ConfigurationValidator.validate({ config: CONFIG_FILE_PATH });
      } catch (error) {
        capturedError = error;
      }
      expect.assert(capturedError instanceof OptionValidationError);
      expect(capturedError.option).toStrictEqual(indexedOptions.config);
      expect(capturedError.message).toContain('config file nesting exceeded maximum depth');
    });
  });
});
