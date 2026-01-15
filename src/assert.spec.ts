import { it, expect, vi, beforeEach } from 'vitest';
import { assert } from './platform/assert.js';
import { AssertionError } from 'node:assert/strict';
import { logger } from './platform/index.js';

vi.spyOn(logger, 'fatal');

beforeEach(() => {
  vi.clearAllMocks();
});

it('does nothing when the condition is true', () => {
  expect(() => assert(true)).not.toThrowError();
});

it('throws an AssertionError when the condition is false', () => {
  expect(() => assert(false, 'test')).toThrowError(new AssertionError({ message: 'test' }));
});

it('logs the error when the condition is false as fatal', () => {
  expect(() => assert(false, 'test')).toThrowError(new AssertionError({ message: 'test' }));
  expect(logger.fatal).toHaveBeenCalledWith({
    source: 'assert',
    message: 'Assertion failed',
    error: new AssertionError({ message: 'test' })
  });
});
