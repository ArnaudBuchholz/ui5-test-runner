import { it, expect } from 'vitest';
import { split } from './string.js';

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
