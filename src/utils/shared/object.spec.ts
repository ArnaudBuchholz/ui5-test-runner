import { describe, it, expect } from 'vitest';
import { toPlainObject, pick, isObject, isStringRecord } from './object.js';

describe('isObject', () => {
  it('returns true for a plain object', () => {
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isObject('x')).toBe(false);
  });
});

describe('isStringRecord', () => {
  it('returns true when every value is a string', () => {
    expect(isStringRecord({ a: 'x', b: 'y' })).toBe(true);
  });

  it('returns true for an empty object', () => {
    expect(isStringRecord({})).toBe(true);
  });

  it('returns false when a value is not a string', () => {
    expect(isStringRecord({ a: 'x', b: 1 })).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isStringRecord(null)).toBe(false);
  });
});

describe('toPlainObject', () => {
  it('returns the same object on literals', () => {
    const object = { hello: 'world!' };
    expect(toPlainObject(object)).toStrictEqual(object);
  });

  it('flattens prototype chain', () => {
    const object = Object.assign(Object.create({ hello: 'world!', value: 'inherited' }), { value: 'own' }) as object;
    expect(toPlainObject(object)).toStrictEqual({ hello: 'world!', value: 'own' });
  });
});

describe('pick', () => {
  const OBJECT = { a: 1, b: 'two', c: true };

  it('picks the specified keys', () => {
    expect(pick(OBJECT, ['a', 'c'])).toStrictEqual({ a: 1, c: true });
  });

  it('returns an empty object when keys list is empty', () => {
    expect(pick(OBJECT, [])).toStrictEqual({});
  });

  it('ignores keys not present in the object', () => {
    expect(pick(OBJECT, ['a', 'missing' as keyof typeof OBJECT])).toStrictEqual({ a: 1 });
  });
});
