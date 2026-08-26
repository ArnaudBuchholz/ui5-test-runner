import { describe, it, expect } from 'vitest';
import { getPageTimeout, getBatchTimeout, isGloballyTimedOut } from './timeout.js';
import type { Configuration } from '../../configuration/Configuration.js';

const NO_TIMEOUT = {} as Configuration;
const NOW = Date.now();
const ELAPSED_START = NOW - 5000; // 5 seconds ago

describe('getPageTimeout', () => {
  it('returns 0 when no timeout is configured', () => {
    expect(getPageTimeout(NO_TIMEOUT, NOW)).toStrictEqual(0);
  });

  it('returns pageTimeout when only pageTimeout is set', () => {
    const configuration = { pageTimeout: 10_000 } as Configuration;
    expect(getPageTimeout(configuration, NOW)).toStrictEqual(10_000);
  });

  it('returns remaining globalTimeout when only globalTimeout is set', () => {
    const configuration = { globalTimeout: 10_000 } as Configuration;
    const result = getPageTimeout(configuration, NOW);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(10_000);
  });

  it('returns pageTimeout when smaller than remaining globalTimeout', () => {
    const configuration = { pageTimeout: 1000, globalTimeout: 60_000 } as Configuration;
    expect(getPageTimeout(configuration, NOW)).toStrictEqual(1000);
  });

  it('returns remaining globalTimeout when smaller than pageTimeout', () => {
    const configuration = { pageTimeout: 60_000, globalTimeout: 10_000 } as Configuration;
    const result = getPageTimeout(configuration, ELAPSED_START);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(60_000);
  });
});

describe('getBatchTimeout', () => {
  it('returns 0 when no timeout is configured', () => {
    expect(getBatchTimeout(NO_TIMEOUT, NOW)).toStrictEqual(0);
  });

  it('returns batchTimeout when only batchTimeout is set', () => {
    const configuration = { batchTimeout: 10_000 } as Configuration;
    expect(getBatchTimeout(configuration, NOW)).toStrictEqual(10_000);
  });

  it('returns remaining globalTimeout when only globalTimeout is set', () => {
    const configuration = { globalTimeout: 10_000 } as Configuration;
    const result = getBatchTimeout(configuration, NOW);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(10_000);
  });

  it('returns batchTimeout when smaller than remaining globalTimeout', () => {
    const configuration = { batchTimeout: 1000, globalTimeout: 60_000 } as Configuration;
    expect(getBatchTimeout(configuration, NOW)).toStrictEqual(1000);
  });

  it('returns remaining globalTimeout when smaller than batchTimeout', () => {
    const configuration = { batchTimeout: 60_000, globalTimeout: 10_000 } as Configuration;
    const result = getBatchTimeout(configuration, ELAPSED_START);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(60_000);
  });
});

describe('isGloballyTimedOut', () => {
  it('returns false when no globalTimeout is configured', () => {
    expect(isGloballyTimedOut(NO_TIMEOUT, ELAPSED_START)).toStrictEqual(false);
  });

  it('returns false when globalTimeout has not elapsed', () => {
    const configuration = { globalTimeout: 60_000 } as Configuration;
    expect(isGloballyTimedOut(configuration, NOW)).toStrictEqual(false);
  });

  it('returns true when globalTimeout has elapsed', () => {
    const configuration = { globalTimeout: 1000 } as Configuration;
    expect(isGloballyTimedOut(configuration, ELAPSED_START)).toStrictEqual(true);
  });
});
