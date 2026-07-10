import { describe, it, expect } from 'vitest';
import { toPlainObject, pick } from './object.js';

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
