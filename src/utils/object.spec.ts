import { describe, it, expect } from 'vitest';
import { toPlainObject } from './object.js';

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
