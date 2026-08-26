import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Npm } from '../../../Npm.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { getNycBin } from './nyc.js';

beforeEach(() => vi.clearAllMocks());

const CONFIGURATION = { cwd: '/test' } as unknown as Configuration;

describe('getNycBin', () => {
  it('returns the path to bin/nyc.js inside the resolved nyc package directory', async () => {
    vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
    vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
    await expect(getNycBin(CONFIGURATION)).resolves.toBe('/node_modules/nyc/bin/nyc.js');
  });

  it('calls Npm.import with the configuration and "nyc"', async () => {
    const config = { cwd: '/test-import' } as unknown as Configuration;
    vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
    vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
    await getNycBin(config);
    expect(Npm.import).toHaveBeenCalledWith(config, 'nyc');
  });

  it('calls Npm.resolvePackageDir with the configuration and "nyc"', async () => {
    const config = { cwd: '/test-resolve' } as unknown as Configuration;
    vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
    vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
    await getNycBin(config);
    expect(Npm.resolvePackageDir).toHaveBeenCalledWith(config, 'nyc');
  });

  it('caches the result for the same configuration object', async () => {
    const CONFIG = { cwd: '/cached' } as unknown as Configuration;
    vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
    vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
    const first = await getNycBin(CONFIG);
    const second = await getNycBin(CONFIG);
    expect(first).toBe(second);
  });
});
