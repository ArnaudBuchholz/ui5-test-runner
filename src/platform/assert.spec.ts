import { it, expect, vi, beforeEach } from 'vitest';
import { assert } from './assert.js';
import { ExitShutdownError } from './Exit.js';
import { logger } from './logger.js';

vi.spyOn(logger, 'fatal');

beforeEach(() => {
  vi.clearAllMocks();
});

it('does nothing when the condition is true', () => {
  expect(() => assert(true)).not.toThrow();
});

it('throws an ExitShutdownError when the condition is false', () => {
  expect(() => assert(false)).toThrow(ExitShutdownError);
});

it('throws an ExitShutdownError with a custom message when the condition is false', () => {
  expect(() => assert(false, 'test')).toThrow(ExitShutdownError);
});

it('logs the error when the condition is false as fatal', () => {
  expect(() => assert(false, 'test')).toThrow(ExitShutdownError);
  expect(logger.fatal).toHaveBeenCalledWith({
    source: 'assert',
    message: 'test',
    error: expect.any(Error) as Error
  });
});
