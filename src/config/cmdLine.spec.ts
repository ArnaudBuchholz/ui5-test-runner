import { it, expect, vi, beforeEach } from 'vitest';
import { fromCmdLine } from './cmdLine.js';

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
    cwd: CWD
  });
});

it('fails on unknown long option', async () => {
  await expect(fromCmdLine(CWD, ['--unknown'])).rejects.toThrowError('Unknown option');
});

const testCases: { label: string; args: string[]; expected: object }[] = [
  {
    label: 'sets boolean option',
    args: ['--help'],
    expected: {
      help: true
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
  }
];
// TODO: what if --cwd --url a ? error or ignore
// TODO: how to handle -- => browserArgs

for (const { label, args, expected } of testCases) {
  it(label, async () => {
    await expect(fromCmdLine(CWD, args)).resolves.toStrictEqual(
      Object.assign(
        {
          cwd: CWD
        },
        expected
      )
    );
  });
}
