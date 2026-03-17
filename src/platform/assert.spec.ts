import { it, expect, vi, beforeEach } from 'vitest';
import { assert } from './assert.js';
import { AssertionError } from 'node:assert/strict';
import { logger } from './logger.js';

vi.spyOn(logger, 'fatal');

beforeEach(() => {
  vi.clearAllMocks();
});

it('does nothing when the condition is true', () => {
  expect(() => assert(true)).not.toThrow();
});

it('throws an AssertionError when the condition is false', () => {
  expect(() => assert(false)).toThrow(new AssertionError({ message: 'Assertion failed' }));
});

it('throws an AssertionError with a custom message when the condition is false', () => {
  expect(() => assert(false, 'test')).toThrow(new AssertionError({ message: 'test' }));
});

it('logs the error when the condition is false as fatal', () => {
  expect(() => assert(false, 'test')).toThrow(new AssertionError({ message: 'test' }));
  expect(logger.fatal).toHaveBeenCalledWith({
    source: 'assert',
    message: 'test',
    error: new AssertionError({ message: 'test' })
  });
});
