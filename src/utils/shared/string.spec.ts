import { it, expect, describe } from 'vitest';
import { formatDuration, split, isStringOrStringArray } from './string.js';

describe('isStringOrStringArray', () => {
  it('returns true for a string', () => {
    expect(isStringOrStringArray('x')).toBe(true);
  });

  it('returns true for an array of strings', () => {
    expect(isStringOrStringArray(['a', 'b'])).toBe(true);
  });

  it('returns true for an empty array', () => {
    expect(isStringOrStringArray([])).toBe(true);
  });

  it('returns false for an array containing a non-string', () => {
    expect(isStringOrStringArray(['a', 1])).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isStringOrStringArray(42)).toBe(false);
  });
});

describe('split', () => {
  it('returns the whole string', () => {
    expect(split('Hello World !')).toStrictEqual(['Hello World !']);
  });

  it('returns the string per bits (1)', () => {
    expect(split('Hello World !', 5)).toStrictEqual(['Hello', ' World !']);
  });

  it('returns the string per bits (2)', () => {
    expect(split('Hello World !', 5, 1)).toStrictEqual(['Hello', ' ', 'World !']);
  });

  it('returns the string per bits (3)', () => {
    expect(split('Hello World !', 5, 1, 5)).toStrictEqual(['Hello', ' ', 'World', ' !']);
  });

  it('can go beyond the string length', () => {
    expect(split('Hello World !', 5, 1, 5, 5, 5)).toStrictEqual(['Hello', ' ', 'World', ' !', '']);
  });

  it('appends the trailing remainder when lengths do not exhaust the string', () => {
    expect(split('abcde', 2)).toStrictEqual(['ab', 'cde']);
  });
});

describe('formatDuration', () => {
  for (const { value, expected } of [
    {
      value: -1,
      expected: '00:00'
    },
    {
      value: 0,
      expected: '00:00'
    },
    {
      value: 1,
      expected: '0.001'
    },
    {
      value: 12,
      expected: '0.012'
    },
    {
      value: 123,
      expected: '0.123'
    },
    {
      value: 1234,
      expected: '00:01'
    },
    {
      value: 60_000,
      expected: '01:00'
    }
  ]) {
    it(`returns ${expected} for ${value}`, () => {
      expect(formatDuration(value)).toStrictEqual(expected);
    });
  }
});
