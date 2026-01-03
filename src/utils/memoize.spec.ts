import { describe, it, expect } from 'vitest';
import { memoize } from './memoize.js';

describe('sync', () => {
  let count = 0;
  const memoized = memoize(() => ++count);

  it('executes the function only once', () => {
    expect(memoized()).toStrictEqual(1);
    expect(memoized()).toStrictEqual(1);
  });

  let failureCount = 0;
  const failure = memoize(() => {
    throw new Error('failed: ' + ++failureCount);
  });

  it('fails only once', () => {
    let caught: Error | undefined;
    try {
      failure();
      expect.unreachable();
    } catch (error) {
      caught = error as Error;
    }
    expect(() => failure()).toThrowError(caught);
  });
});

describe('async', () => {
  let count = 0;
  const memoized = memoize(() => Promise.resolve(++count));

  it('executes the function only once', async () => {
    await expect(memoized()).resolves.toStrictEqual(1);
    await expect(memoized()).resolves.toStrictEqual(1);
  });

  let failureCount = 0;
  const failure = memoize(() => Promise.reject(new Error('failed: ' + ++failureCount)));

  it('fails only once', async () => {
    let caught: Error | undefined;
    try {
      await failure();
      expect.unreachable();
    } catch (error) {
      caught = error as Error;
    }
    await expect(failure()).rejects.toThrowError(caught);
  });
});
