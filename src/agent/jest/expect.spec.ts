import { it, expect as vitestExpect, describe } from 'vitest';
import { expect } from './expect.js';

const expectPasses = (matcher: () => void): void => {
  let error_: unknown;
  try {
    matcher();
  } catch (error) {
    error_ = error;
  }
  vitestExpect(error_).toBeUndefined();
};

describe('passing matchers', () => {
  it('toBe matches identical primitives', () => {
    expectPasses(() => expect(1).toBe(1));
  });
  it('toEqual matches deep-equal objects', () => {
    expectPasses(() => expect({ a: [1, 2] }).toEqual({ a: [1, 2] }));
  });
  it('toStrictEqual matches deep-equal arrays', () => {
    expectPasses(() => expect([1, 2]).toStrictEqual([1, 2]));
  });
  it('toBeCloseTo matches floating point sums', () => {
    expectPasses(() => expect(0.1 + 0.2).toBeCloseTo(0.3));
  });
  it('toContain matches an array member', () => {
    expectPasses(() => expect([1, 2, 3]).toContain(2));
  });
  it('toContain matches a substring', () => {
    expectPasses(() => expect('hello').toContain('ell'));
  });
});

describe('failing matchers', () => {
  it('toBe throws when primitives differ', () => {
    vitestExpect(() => expect(1).toBe(2)).toThrow(/toBe/);
  });
  it('toEqual throws when objects differ', () => {
    vitestExpect(() => expect({ a: 1 }).toEqual({ a: 2 })).toThrow();
  });
  it('toEqual throws when key sets differ', () => {
    vitestExpect(() => expect({ a: 1 }).toEqual({ a: 1, b: 2 })).toThrow();
  });
  it('toBeCloseTo throws when numbers are far apart', () => {
    vitestExpect(() => expect(0.1 + 0.2).toBeCloseTo(50)).toThrow(/toBeCloseTo/);
  });
  it('toContain throws when the member is absent', () => {
    vitestExpect(() => expect([1, 2, 3]).toContain(4)).toThrow(/toContain/);
  });
});

describe('negation', () => {
  it('not.toBe passes when values differ', () => {
    expectPasses(() => expect(1).not.toBe(2));
  });
  it('not.toBe throws when values are equal', () => {
    vitestExpect(() => expect(1).not.toBe(1)).toThrow();
  });
});

describe('async matchers', () => {
  it('resolves matches the resolved value', async () => {
    await expect(Promise.resolve(42)).resolves.toBe(42);
  });
  it('resolves throws when the resolved value differs', async () => {
    await vitestExpect(expect(Promise.resolve(42)).resolves.toBe(43)).rejects.toThrow(/toBe/);
  });
  it('rejects matches the rejection reason', async () => {
    await expect(Promise.reject(new Error('bad'))).rejects.toBeDefined();
  });
  it('rejects throws when the promise resolves', async () => {
    await vitestExpect(expect(Promise.resolve(1)).rejects.toBe(1)).rejects.toThrow(/resolved instead/);
  });
});

describe('mock matchers', () => {
  it('toHaveBeenCalled throws for a non-mock value', () => {
    vitestExpect(() => expect(1).toHaveBeenCalled()).toThrow(/not a mock/);
  });
  it('toHaveBeenCalled passes for a called mock-like value', () => {
    const mockLike = { called: true, callCount: 1, calledWith: () => true };
    expectPasses(() => expect(mockLike).toHaveBeenCalled());
  });
  it('toHaveBeenCalled passes for a mock-like function (sinon stub shape)', () => {
    const mockLike = Object.assign(() => {}, { called: true, callCount: 1, calledWith: () => true });
    expectPasses(() => expect(mockLike).toHaveBeenCalled());
  });
  it('toHaveBeenCalledTimes passes for the matching count', () => {
    const mockLike = { called: true, callCount: 2, calledWith: () => true };
    expectPasses(() => expect(mockLike).toHaveBeenCalledTimes(2));
  });
  it('toHaveBeenCalledWith passes when the arguments match', () => {
    const mockLike = { called: true, callCount: 1, calledWith: () => true };
    expectPasses(() => expect(mockLike).toHaveBeenCalledWith(1, 2));
  });
});

describe('truthiness and nullability matchers', () => {
  it('toBeNull passes for null', () => {
    expectPasses(() => expect(null).toBeNull());
  });
  it('toBeUndefined passes for undefined', () => {
    expectPasses(() => expect(undefined).toBeUndefined());
  });
  it('toBeNaN passes for NaN', () => {
    expectPasses(() => expect(Number.NaN).toBeNaN());
  });
  it('toBeTruthy passes for a truthy value', () => {
    expectPasses(() => expect('x').toBeTruthy());
  });
  it('toBeFalsy passes for a falsy value', () => {
    expectPasses(() => expect(0).toBeFalsy());
  });
  it('toBeDefined passes for a defined value', () => {
    expectPasses(() => expect(1).toBeDefined());
  });
});

describe('numeric matchers', () => {
  it('toBeGreaterThan passes', () => {
    expectPasses(() => expect(10).toBeGreaterThan(5));
  });
  it('toBeGreaterThanOrEqual passes', () => {
    expectPasses(() => expect(10).toBeGreaterThanOrEqual(10));
  });
  it('toBeLessThan passes', () => {
    expectPasses(() => expect(5).toBeLessThan(10));
  });
  it('toBeLessThanOrEqual passes', () => {
    expectPasses(() => expect(10).toBeLessThanOrEqual(10));
  });
  it('toMatch passes for a matching regexp', () => {
    expectPasses(() => expect('hello world').toMatch(/world/));
  });
});

describe('toThrow variants', () => {
  it('passes when any error is thrown and no matcher is given', () => {
    expectPasses(() =>
      expect(() => {
        throw new Error('whatever');
      }).toThrow()
    );
  });
  it('matches a regexp against the message', () => {
    expectPasses(() =>
      expect(() => {
        throw new Error('it broke');
      }).toThrow(/broke/)
    );
  });
  it('matches an exact message string', () => {
    expectPasses(() =>
      expect(() => {
        throw new Error('exact message');
      }).toThrow('exact message')
    );
  });
  it('matches an error constructor', () => {
    expectPasses(() =>
      expect(() => {
        throw new TypeError('x');
      }).toThrow(TypeError)
    );
  });
  it('not.toThrow passes when nothing is thrown', () => {
    expectPasses(() => expect(() => 0).not.toThrow());
  });
});
