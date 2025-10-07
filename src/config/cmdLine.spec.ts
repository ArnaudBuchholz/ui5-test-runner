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

it('sets boolean option', async () => {
  await expect(fromCmdLine(CWD, ['--help'])).resolves.toStrictEqual({
    cwd: CWD,
    help: true
  });
});

it('sets multiple option (long name)', async () => {
  await expect(fromCmdLine(CWD, ['--url', 'a', 'b'])).resolves.toStrictEqual({
    cwd: CWD,
    url: ['a', 'b']
  });
});

it('sets multiple option (short name)', async () => {
  await expect(fromCmdLine(CWD, ['-u', 'a', 'b'])).resolves.toStrictEqual({
    cwd: CWD,
    url: ['a', 'b']
  });
});
