import { describe, it, expect } from 'vitest';
import {
  resolveTimeRange,
  formatTimestamp,
  formatDatetimeLocal,
  parseDatetimeLocal,
  formatFileSize,
  getPresetLabel
} from './timeRange.js';
import type { AbsoluteTimeRange, RelativeTimeRange } from './types.js';

describe('resolveTimeRange', () => {
  it('returns fixed from/to for absolute range', () => {
    const range: AbsoluteTimeRange = { mode: 'absolute', from: 1000, to: 2000 };
    expect(resolveTimeRange(range)).toEqual({ from: 1000, to: 2000 });
  });

  it('returns a range within the last 15 minutes for the 15m preset', () => {
    const before = Date.now();
    const range: RelativeTimeRange = { mode: 'relative', preset: '15m' };
    const result = resolveTimeRange(range);
    const after = Date.now();

    expect(result.to).toBeGreaterThanOrEqual(before);
    expect(result.to).toBeLessThanOrEqual(after);
    expect(result.to - result.from).toBeCloseTo(15 * 60 * 1000, -2);
  });

  it('returns a range within the last 1 hour for the 1h preset', () => {
    const range: RelativeTimeRange = { mode: 'relative', preset: '1h' };
    const result = resolveTimeRange(range);
    expect(result.to - result.from).toBeCloseTo(60 * 60 * 1000, -2);
  });
});

describe('formatTimestamp', () => {
  it('formats epoch to local datetime string', () => {
    const epoch = new Date('2026-03-26T14:07:00.123').getTime();
    const result = formatTimestamp(epoch);
    // Should contain date and time parts
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);
  });
});

describe('formatDatetimeLocal', () => {
  it('formats epoch for datetime-local input', () => {
    const epoch = new Date('2026-03-26T14:07:00').getTime();
    const result = formatDatetimeLocal(epoch);
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('parseDatetimeLocal', () => {
  it('parses a datetime-local string to epoch', () => {
    const epoch = new Date('2026-03-26T14:07:00').getTime();
    const formatted = formatDatetimeLocal(epoch);
    expect(parseDatetimeLocal(formatted)).toBe(epoch);
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1500)).toBe('1.5KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1_468_006)).toBe('1.4MB');
  });
});

describe('getPresetLabel', () => {
  it('returns Last 15 minutes for 15m', () => {
    expect(getPresetLabel('15m')).toBe('Last 15 minutes');
  });

  it('returns Last 1 hour for 1h', () => {
    expect(getPresetLabel('1h')).toBe('Last 1 hour');
  });
});
