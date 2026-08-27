import { describe, it, expect } from 'vitest';
import { getEffectiveTimeout, isGloballyTimedOut } from './timeout.js';

const NOW = Date.now();
const ELAPSED_START = NOW - 5000; // 5 seconds ago

describe('getEffectiveTimeout', () => {
  it('returns 0 when no timeout is configured', () => {
    expect(getEffectiveTimeout(0, 0, NOW)).toStrictEqual(0);
  });

  it('returns itemTimeout when only itemTimeout is set', () => {
    expect(getEffectiveTimeout(10_000, 0, NOW)).toStrictEqual(10_000);
  });

  it('returns remaining globalTimeout when only globalTimeout is set', () => {
    const result = getEffectiveTimeout(0, 10_000, NOW);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(10_000);
  });

  it('returns itemTimeout when smaller than remaining globalTimeout', () => {
    expect(getEffectiveTimeout(1000, 60_000, NOW)).toStrictEqual(1000);
  });

  it('returns remaining globalTimeout when smaller than itemTimeout', () => {
    const result = getEffectiveTimeout(60_000, 10_000, ELAPSED_START);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(60_000);
  });
});

describe('isGloballyTimedOut', () => {
  it('returns false when no globalTimeout is configured', () => {
    expect(isGloballyTimedOut(0, ELAPSED_START)).toStrictEqual(false);
  });

  it('returns false when globalTimeout has not elapsed', () => {
    expect(isGloballyTimedOut(60_000, NOW)).toStrictEqual(false);
  });

  it('returns true when globalTimeout has elapsed', () => {
    expect(isGloballyTimedOut(1000, ELAPSED_START)).toStrictEqual(true);
  });
});
