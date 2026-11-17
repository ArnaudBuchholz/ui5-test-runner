import { stringify } from '../stringify.js';

const areDeepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null ||
    Array.isArray(a) !== Array.isArray(b)
  ) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        areDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    )
  );
};

const fail = (message: string): never => {
  throw new Error(message);
};

const check = (isSuccess: boolean, isNegated: boolean, message: () => string): void => {
  if (isSuccess === isNegated) {
    fail(message());
  }
};

interface MockLike {
  called: boolean;
  callCount: number;
  calledWith: (...arguments_: unknown[]) => boolean;
}

const isMockLike = (value: unknown): value is MockLike =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  'callCount' in value &&
  typeof (value as MockLike).calledWith === 'function';

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeNaN(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, numberDigits?: number): void;
  toMatch(expected: RegExp): void;
  toContain(expected: unknown): void;
  toThrow(expected?: string | RegExp | (new (...arguments_: never[]) => Error)): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(expected: number): void;
  toHaveBeenCalledWith(...arguments_: unknown[]): void;
}

export type AsyncMatchers = {
  [K in keyof Matchers]: (...arguments_: Parameters<Matchers[K]>) => Promise<void>;
};

export interface Expectation extends Matchers {
  not: Matchers;
  resolves: AsyncMatchers;
  rejects: AsyncMatchers;
}

const buildMatchers = (value: unknown, isNegated: boolean): Matchers => {
  const label = `expect(${stringify(value)})${isNegated ? '.not' : ''}`;
  const asMock = (): MockLike => {
    return isMockLike(value) ? value : fail(`${label}: value is not a mock`);
  };
  const didThrow = (expected?: string | RegExp | (new (...arguments_: never[]) => Error)): boolean => {
    try {
      (value as () => void)();
      return false;
    } catch (error) {
      const error_ = error as Error;
      if (typeof expected === 'string') {
        return error_.message === expected;
      }
      if (expected instanceof RegExp) {
        return expected.test(error_.message);
      }
      if (typeof expected === 'function') {
        return error_ instanceof expected;
      }
      return true;
    }
  };
  return {
    toBe: (expected) => check(Object.is(value, expected), isNegated, () => `${label}.toBe(${stringify(expected)})`),
    toEqual: (expected) =>
      check(areDeepEqual(value, expected), isNegated, () => `${label}.toEqual(${stringify(expected)})`),
    toStrictEqual: (expected) =>
      check(areDeepEqual(value, expected), isNegated, () => `${label}.toStrictEqual(${stringify(expected)})`),
    toBeDefined: () => check(value !== undefined, isNegated, () => `${label}.toBeDefined()`),
    toBeUndefined: () => check(value === undefined, isNegated, () => `${label}.toBeUndefined()`),
    toBeNull: () => check(value === null, isNegated, () => `${label}.toBeNull()`),
    toBeNaN: () => check(Number.isNaN(value), isNegated, () => `${label}.toBeNaN()`),
    toBeTruthy: () => check(!!value, isNegated, () => `${label}.toBeTruthy()`),
    toBeFalsy: () => check(!value, isNegated, () => `${label}.toBeFalsy()`),
    toBeGreaterThan: (expected) =>
      check((value as number) > expected, isNegated, () => `${label}.toBeGreaterThan(${expected})`),
    toBeGreaterThanOrEqual: (expected) =>
      check((value as number) >= expected, isNegated, () => `${label}.toBeGreaterThanOrEqual(${expected})`),
    toBeLessThan: (expected) =>
      check((value as number) < expected, isNegated, () => `${label}.toBeLessThan(${expected})`),
    toBeLessThanOrEqual: (expected) =>
      check((value as number) <= expected, isNegated, () => `${label}.toBeLessThanOrEqual(${expected})`),
    toBeCloseTo: (expected, numberDigits = 2) => {
      const factor = 10 ** numberDigits;
      check(
        Math.round((value as number) * factor) === Math.round(expected * factor),
        isNegated,
        () => `${label}.toBeCloseTo(${expected})`
      );
    },
    toMatch: (expected) => check(expected.test(value as string), isNegated, () => `${label}.toMatch(${expected})`),
    toContain: (expected) =>
      check(
        (value as unknown[] | string).includes(expected as never),
        isNegated,
        () => `${label}.toContain(${stringify(expected)})`
      ),
    toThrow: (expected) => check(didThrow(expected), isNegated, () => `${label}.toThrow()`),
    toHaveBeenCalled: () => check(asMock().called, isNegated, () => `${label}.toHaveBeenCalled()`),
    toHaveBeenCalledTimes: (expected) =>
      check(asMock().callCount === expected, isNegated, () => `${label}.toHaveBeenCalledTimes(${expected})`),
    toHaveBeenCalledWith: (...arguments_) =>
      check(asMock().calledWith(...arguments_), isNegated, () => `${label}.toHaveBeenCalledWith(...)`)
  };
};

const buildAsyncMatchers = (settle: () => Promise<unknown>): AsyncMatchers =>
  new Proxy({} as AsyncMatchers, {
    get:
      (_target, name: string) =>
      async (...arguments_: unknown[]) => {
        const settled = await settle();
        const matchers = buildMatchers(settled, false) as unknown as Record<string, (...a: unknown[]) => void>;
        matchers[name]!(...arguments_);
      }
  });

const resolved = (value: unknown) => () => Promise.resolve(value);

const rejected = (value: unknown) => async () => {
  try {
    await value;
  } catch (error) {
    return error;
  }
  return fail(`expect(${stringify(value)}).rejects: promise resolved instead of rejecting`);
};

export const expect = (value: unknown): Expectation => {
  const expectation = buildMatchers(value, false) as Expectation;
  Object.defineProperties(expectation, {
    not: { value: buildMatchers(value, true) },
    resolves: { value: buildAsyncMatchers(resolved(value)) },
    rejects: { value: buildAsyncMatchers(rejected(value)) }
  });
  return expectation;
};
