import { describe, it, expect } from 'vitest';
import { levelIcon, levelName, formatTimestamp, epochToDateTimePickerValue, formatBytes } from './format.js';

describe('levelIcon', () => {
  it('returns 🔍 for debug (0)', () => expect(levelIcon(0)).toBe('&#128269;'));
  it('returns 💬 for info (1)', () => expect(levelIcon(1)).toBe('&#128172;'));
  it('returns ⚠️ for warn (2)', () => expect(levelIcon(2)).toBe('&#9888;&#65039;'));
  it('returns ❌ for error (3)', () => expect(levelIcon(3)).toBe('&#10060;'));
  it('returns 💣 for fatal (4)', () => expect(levelIcon(4)).toBe('&#128163;'));
});

describe('levelName', () => {
  it('returns debug for 0', () => expect(levelName(0)).toBe('debug'));
  it('returns info for 1', () => expect(levelName(1)).toBe('info'));
  it('returns warn for 2', () => expect(levelName(2)).toBe('warn'));
  it('returns error for 3', () => expect(levelName(3)).toBe('error'));
  it('returns fatal for 4', () => expect(levelName(4)).toBe('fatal'));
});

describe('formatTimestamp', () => {
  it('returns — for epoch 0', () => expect(formatTimestamp(0)).toBe('—'));

  it('returns a non-empty string for a valid epoch', () => {
    const result = formatTimestamp(1_700_000_000_000);
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('epochToDateTimePickerValue', () => {
  it('formats epoch to MM/DD/YYYY, HH:MM:SS', () => {
    // 2024-01-15 10:30:45 UTC — use a fixed offset-free check via manual construction
    const date = new Date(2024, 0, 15, 10, 30, 45); // local time
    const epoch = date.getTime();
    const result = epochToDateTimePickerValue(epoch);
    expect(result).toBe('01/15/2024, 10:30:45');
  });
});

describe('formatBytes', () => {
  it('returns 0 B for 0 bytes', () => expect(formatBytes(0)).toBe('0 B'));
  it('returns bytes for small values', () => expect(formatBytes(512)).toBe('512 B'));
  it('returns KB for 1024 bytes', () => expect(formatBytes(1024)).toBe('1.0 KB'));
  it('returns KB with one decimal for 1500 bytes', () => expect(formatBytes(1500)).toBe('1.5 KB'));
  it('returns MB for large values', () => expect(formatBytes(1_500_000)).toBe('1.4 MB'));
});
