import { it, expect, vi, beforeEach } from 'vitest';
import { fromCmdLine } from './CommandLine.js';
import type { CmdLineConfig } from './CommandLine.js';
import { OptionValidationError } from './OptionValidationError.js';

const CWD = '/usr/test';

const finalizeConfig = vi.fn().mockImplementation(async (value) => value);

beforeEach(() => {
  finalizeConfig.mockClear();
});

it('forwards partial config to finalizeConfig', async () => {
  await fromCmdLine(CWD, [], { finalizeConfig });
  expect(finalizeConfig).toHaveBeenCalled();
});

it('returns the result of finalizeConfig', async () => {
  const uniqueObject = { uid: Date.now() };
  finalizeConfig.mockResolvedValueOnce(uniqueObject);
  const result = await fromCmdLine(CWD, [], { finalizeConfig });
  expect(result).toStrictEqual(uniqueObject);
});

it('copies cwd', async () => {
  await expect(fromCmdLine(CWD, [])).resolves.toStrictEqual({
    cwd: CWD,
    positionals: []
  });
});

it('fails on unknown long option', async () => {
  await expect(fromCmdLine(CWD, ['--unknown'])).rejects.toThrowError('Unknown option');
});

const testCases: {
  label: string;
  args: string[];
  expected:
    | (Omit<CmdLineConfig, 'errors' | 'positionals'> & { positionals?: string[] })
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
        await fromCmdLine(CWD, args);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(OptionValidationError);
        const optionValidationError = error as OptionValidationError;
        expect(optionValidationError.message).toStrictEqual(expected.error);
        expect(optionValidationError.option.name).toStrictEqual(expected.option);
      }
    } else if ('errors' in expected) {
      try {
        await fromCmdLine(CWD, args);
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
      await expect(fromCmdLine(CWD, args)).resolves.toStrictEqual(
        Object.assign(
          {
            cwd: CWD,
            positionals: []
          },
          expected
        )
      );
    }
  });
}
