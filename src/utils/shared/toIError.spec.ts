import { it, describe, expect } from 'vitest';
import { toIError } from './toIError.js';

describe('Error input', () => {
  it('maps name, message, and stack from a plain Error', () => {
    const error = new Error('something went wrong');
    const result = toIError(error);
    expect(result.name).toBe('Error');
    expect(result.message).toBe('something went wrong');
    expect(result.stack).toBe(error.stack);
  });

  it('preserves custom error name for subclasses', () => {
    class CustomError extends Error {
      override get name() {
        return 'CustomError';
      }
    }
    const result = toIError(new CustomError('oops'));
    expect(result.name).toBe('CustomError');
    expect(result.message).toBe('oops');
  });

  it('omits cause when the error has no cause', () => {
    const result = toIError(new Error('no cause'));
    expect(result.cause).toBeUndefined();
  });

  it('recursively converts an Error cause', () => {
    const cause = new Error('root cause');
    const error = new Error('wrapper', { cause });
    const result = toIError(error);
    expect(result.cause).toEqual({
      name: 'Error',
      message: 'root cause',
      stack: cause.stack
    });
  });

  it('recursively converts a non-Error cause', () => {
    const error = new Error('wrapper', { cause: 'string cause' });
    const result = toIError(error);
    expect(result.cause?.message).toBe('"string cause"');
  });

  it('handles deeply nested causes', () => {
    const root = new Error('root');
    const mid = new Error('mid', { cause: root });
    const top = new Error('top', { cause: mid });
    const result = toIError(top);
    expect(result.cause?.cause?.message).toBe('root');
  });
});

describe('AggregateError input', () => {
  it('maps errors array from an AggregateError', () => {
    const error1 = new Error('first');
    const error2 = new Error('second');
    const aggregate = new AggregateError([error1, error2], 'multiple errors');
    const result = toIError(aggregate);
    expect(result.name).toBe('AggregateError');
    expect(result.message).toBe('multiple errors');
    expect(result.errors).toHaveLength(2);
    expect(result.errors?.[0]?.message).toBe('first');
    expect(result.errors?.[1]?.message).toBe('second');
  });

  it('converts non-Error entries inside AggregateError.errors', () => {
    const aggregate = new AggregateError([42, 'oops'], 'mixed');
    const result = toIError(aggregate);
    expect(result.errors?.[0]?.message).toBe('42');
    expect(result.errors?.[1]?.message).toBe('"oops"');
  });

  it('omits errors field on a plain Error', () => {
    const result = toIError(new Error('plain'));
    expect(result.errors).toBeUndefined();
  });
});

describe('non-Error input', () => {
  it('wraps a string in an Error', () => {
    const result = toIError('raw string');
    expect(result.name).toBe('Error');
    expect(result.message).toBe('"raw string"');
  });

  it('wraps a number in an Error', () => {
    const result = toIError(404);
    expect(result.message).toBe('404');
  });

  it('wraps null in an Error', () => {
    const result = toIError(null);
    expect(result.message).toBe('null');
  });

  it('wraps undefined in an Error with an empty message', () => {
    // JSON.stringify(undefined) === undefined, so new Error(undefined) yields message ''
    const result = toIError();
    expect(result.message).toBe('');
  });

  it('wraps a plain object in an Error using JSON.stringify', () => {
    const result = toIError({ code: 42, reason: 'timeout' });
    expect(result.message).toBe('{"code":42,"reason":"timeout"}');
  });
});
