import { it, expect, describe } from 'vitest';
import { stringify } from './stringify.js';

describe('simple values', () => {
  const simpleValues = [
    null,
    '',
    'Hello World !',
    0,
    1,
    false,
    true,
    [],
    [1, 2],
    { a: 'a' },
    { a: 'a', b: { b: 'b' } },
    [{ a: 'a' }, { a: 'a', b: { b: 'b' } }]
  ];

  for (const simpleValue of simpleValues) {
    it(JSON.stringify(simpleValue), () => {
      expect(stringify(simpleValue)).toBe(JSON.stringify(simpleValue));
    });
  }
});

describe('UI5 objects', () => {
  it('reduces UI5 objects to their simplest form', () => {
    const object = {
      getId: () => 'test',
      getMetadata: () => ({
        getName: () => 'sap.m.Button'
      })
    };
    expect(JSON.parse(stringify(object))).toStrictEqual({
      'ui5:id': 'test',
      'ui5:class': 'sap.m.Button'
    });
  });

  it('works on a complex object', () => {
    const object = {
      getId: () => 'test',
      getMetadata: () => ({
        getName: () => 'sap.m.Button'
      })
    };
    expect(
      JSON.parse(
        stringify({
          complex: object
        })
      )
    ).toStrictEqual({
      complex: {
        'ui5:id': 'test',
        'ui5:class': 'sap.m.Button'
      }
    });
  });
});

describe('circular references', () => {
  it('converts simple circular reference (object)', () => {
    const a = { a: 'a' };
    const b = { b: 'b' };
    Object.assign(a, { b });
    Object.assign(b, { a });
    expect(JSON.parse(stringify(a))).toStrictEqual({
      'circular:id': 0,
      a: 'a',
      b: {
        b: 'b',
        a: {
          'circular:ref': 0
        }
      }
    });
  });

  it('converts deep circular reference', () => {
    const a = {
      a: 'a',
      b: {
        b: 'b',
        c: ['c'] as unknown[],
        d: {
          d: 'd'
        }
      }
    } as const;
    a.b.c.push(a.b);
    Object.assign(a.b.d, { a });
    expect(JSON.parse(stringify(a))).toStrictEqual({
      'circular:id': 0,
      a: 'a',
      b: {
        'circular:id': 1,
        b: 'b',
        c: ['c', { 'circular:ref': 1 }],
        d: {
          d: 'd',
          a: {
            'circular:ref': 0
          }
        }
      }
    });
  });

  it('converts simple circular reference (array)', () => {
    const a: unknown[] = ['a'];
    const b: unknown[] = ['b'];
    a.push(b);
    b.push(a);
    expect(JSON.parse(stringify(a))).toStrictEqual({
      'circular:id': 0,
      'circular:array': ['a', ['b', { 'circular:ref': 0 }]]
    });
  });
});
