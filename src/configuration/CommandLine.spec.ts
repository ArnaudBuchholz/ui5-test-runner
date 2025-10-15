import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandLine } from './CommandLine.js';
import type { CommandLineConfiguration } from './CommandLine.js';
import { OptionValidationError } from './OptionValidationError.js';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import type { Configuration } from './Configuration.js';

const CWD = '/usr/test';

const validateConfiguration = vi
  .spyOn(ConfigurationValidator, 'validate')
  .mockImplementation(async (configuration) => configuration as Configuration);

beforeEach(() => {
  validateConfiguration.mockClear();
});

it('forwards partial config to ConfigurationValidator', async () => {
  await CommandLine.buildConfigurationFrom(CWD, []);
  expect(validateConfiguration).toHaveBeenCalled();
});

it('returns the result of finalizeConfig', async () => {
  const uniqueObject = { uid: Date.now() } as unknown as Configuration;
  validateConfiguration.mockResolvedValueOnce(uniqueObject);
  const result = await CommandLine.buildConfigurationFrom(CWD, []);
  expect(result).toStrictEqual(uniqueObject);
});

it('copies cwd', async () => {
  await expect(CommandLine.buildConfigurationFrom(CWD, [])).resolves.toStrictEqual({
    cwd: CWD
  });
});

it('fails on unknown long option', async () => {
  await expect(CommandLine.buildConfigurationFrom(CWD, ['--unknown'])).rejects.toThrowError('Unknown option');
});

const testCases: {
  label: string;
  args: string[];
  expected:
    | Omit<CommandLineConfiguration, 'errors'>
    | { error: string; option: string }
    | { errors: { message: string; option: string }[] };
}[] = [
  {
    label: 'sets boolean option',
    args: ['--help'],
    expected: {
      help: true
    }
  },
  {
    label: 'sets boolean option (with value)',
    args: ['--help', 'true'],
    expected: {
      help: 'true'
    }
  },
  {
    label: 'sets boolean option (with value)',
    args: ['--help', 'false'],
    expected: {
      help: 'false'
    }
  },
  {
    label: 'sets multiple option (long name)',
    args: ['--url', 'a', 'b'],
    expected: {
      url: ['a', 'b']
    }
  },
  {
    label: 'sets multiple option (short name)',
    args: ['-u', 'a', 'b'],
    expected: {
      url: ['a', 'b']
    }
  },
  {
    label: 'ignores multiple option when no value is passed',
    args: ['--url'],
    expected: {}
  },
  {
    label: 'supports more than one declaration of multiple option',
    args: ['-u', 'a', '--url', 'b'],
    expected: {
      url: ['a', 'b']
    }
  },
  {
    label: 'knows which option has been set explicitely',
    args: ['--cwd', '/usr/overridden'],
    expected: {
      cwd: '/usr/overridden',
      cwdSet: true
    }
  },
  {
    label: 'translates option names from lowerCamelCase to kebabCase',
    args: ['--report-dir', 'overridden'],
    expected: {
      reportDir: 'overridden',
      reportDirSet: true
    }
  },
  {
    label: 'fails if a string option does not receive a value',
    args: ['--cwd', '--url', 'a'],
    expected: {
      error: 'Missing value',
      option: 'cwd'
    }
  },
  {
    label: 'fails if a non boolean option does not receive a value',
    args: ['--page-timeout', '--url', 'a'],
    expected: {
      error: 'Missing value',
      option: 'pageTimeout'
    }
  },
  {
    label: 'aggregate the errors',
    args: ['--page-timeout', '--cwd', '--url', 'a'],
    expected: {
      errors: [
        {
          message: 'Missing value',
          option: 'pageTimeout'
        },
        {
          message: 'Missing value',
          option: 'cwd'
        }
      ]
    }
  }
];

for (const { label, args, expected } of testCases) {
  it(label, async () => {
    if ('error' in expected) {
      try {
        await CommandLine.buildConfigurationFrom(CWD, args);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(OptionValidationError);
        const optionValidationError = error as OptionValidationError;
        expect(optionValidationError.message).toStrictEqual(expected.error);
        expect(optionValidationError.option.name).toStrictEqual(expected.option);
      }
    } else if ('errors' in expected) {
      try {
        await CommandLine.buildConfigurationFrom(CWD, args);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        if (error instanceof AggregateError) {
          expect(error.errors.length).toStrictEqual(expected.errors.length);
          for (let index = 0; index < expected.errors.length; ++index) {
            const { message, option } = expected.errors[index]!;
            const errorItem = error.errors[index];
            expect(errorItem).toBeInstanceOf(OptionValidationError);
            expect(errorItem.message).toStrictEqual(message);
            expect(errorItem.option.name).toStrictEqual(option);
          }
        }
      }
    } else {
      await expect(CommandLine.buildConfigurationFrom(CWD, args)).resolves.toStrictEqual(
        Object.assign(
          {
            cwd: CWD
          },
          expected
        )
      );
    }
  });
}

describe('positional arguments', () => {
  it('recognizes URLs', async () => {
    await expect(CommandLine.buildConfigurationFrom(CWD, ['https://server.domain/path'])).resolves.toStrictEqual({
      cwd: CWD,
      url: ['https://server.domain/path']
    });
  });

  const shortcuts = ['capabilities', 'version', 'help'];
  for (const shortcut of shortcuts) {
    it(`provides shortcut for ${shortcut}`, async () => {
      await expect(CommandLine.buildConfigurationFrom(CWD, [shortcut])).resolves.toStrictEqual({
        cwd: CWD,
        [shortcut]: true
      });
    });
  }

  it('fails with a specific error otherwise', async () => {
    try {
      await CommandLine.buildConfigurationFrom(CWD, ['unknown']);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(OptionValidationError);
      const optionValidationError = error as OptionValidationError;
      expect(optionValidationError.message).toStrictEqual('Unable to process: unknown');
      expect(optionValidationError.option.name).toStrictEqual('positional');
    }
  });
});

describe('handling ConfigurationValidator error(s)', () => {
  it('returns ConfigurationValidator error', async () => {
    const validationError = new Error('error');
    validateConfiguration.mockRejectedValueOnce(validationError);
    try {
      await CommandLine.buildConfigurationFrom(CWD, []);
      expect.unreachable();
    } catch (error) {
      expect(error).toStrictEqual(error);
    }
  });

  it('returns ConfigurationValidator errors', async () => {
    const aggregatedValidationErrors = new AggregateError([new Error('error1'), new Error('error2')], 'message');
    validateConfiguration.mockRejectedValueOnce(aggregatedValidationErrors);
    try {
      await CommandLine.buildConfigurationFrom(CWD, []);
      expect.unreachable();
    } catch (error) {
      expect(error).toStrictEqual(aggregatedValidationErrors);
    }
  });

  it('aggregates ConfigurationValidator error', async () => {
    const validationError = new Error('error');
    validateConfiguration.mockRejectedValueOnce(validationError);
    try {
      await CommandLine.buildConfigurationFrom(CWD, ['--cwd', '--url']);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      if (error instanceof AggregateError) {
        expect(error.errors.length).toStrictEqual(2);
        expect(error.errors[1]).toStrictEqual(validationError);
      }
    }
  });

  it('aggregates ConfigurationValidator errors', async () => {
    const aggregatedValidationErrors = new AggregateError([new Error('error1'), new Error('error2')], 'message');
    validateConfiguration.mockRejectedValueOnce(aggregatedValidationErrors);
    try {
      await CommandLine.buildConfigurationFrom(CWD, ['--cwd', '--url']);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      if (error instanceof AggregateError) {
        expect(error.errors.length).toStrictEqual(3);
        expect(error.errors[1]).toStrictEqual(aggregatedValidationErrors.errors[0]);
        expect(error.errors[2]).toStrictEqual(aggregatedValidationErrors.errors[1]);
      }
    }
  });
});
