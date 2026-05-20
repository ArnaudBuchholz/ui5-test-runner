import { describe, it, expect } from 'vitest';
import { formatDuration } from './format.js';

describe('formatDuration', () => {
  it('formats 0ms', () => expect(formatDuration(0)).toBe('0ms'));
  it('formats 42ms', () => expect(formatDuration(42)).toBe('42ms'));
  it('formats 999ms', () => expect(formatDuration(999)).toBe('999ms'));
  it('formats 1000ms as 1s', () => expect(formatDuration(1000)).toBe('1s'));
  it('formats 1499ms as 1s (rounds down)', () => expect(formatDuration(1499)).toBe('1s'));
  it('formats 1500ms as 2s (rounds up)', () => expect(formatDuration(1500)).toBe('2s'));
  it('formats 12000ms as 12s', () => expect(formatDuration(12_000)).toBe('12s'));
  it('formats 59999ms as 60s (rounds up, still under 60000 threshold)', () =>
    expect(formatDuration(59_999)).toBe('60s'));
  it('formats 60000ms as 1m 0s', () => expect(formatDuration(60_000)).toBe('1m 0s'));
  it('formats 61000ms as 1m 1s', () => expect(formatDuration(61_000)).toBe('1m 1s'));
  it('formats 90000ms as 1m 30s', () => expect(formatDuration(90_000)).toBe('1m 30s'));
  it('formats 3661000ms as 61m 1s', () => expect(formatDuration(3_661_000)).toBe('61m 1s'));
});
