import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Host } from '../../platform/index.js';
import { anonymize } from './anonymize.js';

beforeEach(() => vi.clearAllMocks());

const HOME = '/home/user';

beforeEach(() => {
  vi.mocked(Host.homedir).mockReturnValue(HOME);
});

describe('anonymizePaths', () => {
  it('replaces the home directory in a string value', () => {
    const result = anonymize({ path: `${HOME}/project` });
    expect(result).toStrictEqual({ path: '~/project' });
  });

  it('replaces multiple occurrences in the same value', () => {
    const result = anonymize({ path: `${HOME}/a:${HOME}/b` });
    expect(result).toStrictEqual({ path: '~/a:~/b' });
  });

  it('replaces occurrences across multiple fields', () => {
    const result = anonymize({ cwd: `${HOME}/project`, reportDir: `${HOME}/project/tmp` });
    expect(result).toStrictEqual({ cwd: '~/project', reportDir: '~/project/tmp' });
  });

  it('returns the original object when no home directory is present', () => {
    const input = { path: '/other/path' };
    const result = anonymize(input);
    expect(result).toStrictEqual(input);
  });

  it('handles nested objects', () => {
    const result = anonymize({ nested: { path: `${HOME}/project` } });
    expect(result).toStrictEqual({ nested: { path: '~/project' } });
  });
});
