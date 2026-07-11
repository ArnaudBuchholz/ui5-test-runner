import { it, describe, expect, beforeEach } from 'vitest';
import { UI5_TEST_RUNNER } from './contants.js';
import { patchLocalStorage } from './localStorage.js';

const PARALLEL_CONFIG = { config: { browser: '', parallel: 2 }, state: { done: false, type: undefined }, results: [] };
const SERIAL_CONFIG = { config: { browser: '', parallel: 1 }, state: { done: false, type: undefined }, results: [] };

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorage
  });
  // @ts-expect-error -- not optional due to window.d.ts
  delete window[UI5_TEST_RUNNER];
});

describe('when parallel <= 1', () => {
  it('does not replace localStorage', () => {
    Object.assign(window, { [UI5_TEST_RUNNER]: SERIAL_CONFIG });
    const original = window.localStorage;
    patchLocalStorage();
    expect(window.localStorage).toBe(original);
  });

  it('does not replace localStorage when config is absent', () => {
    Object.assign(window, { state: { done: false, type: undefined }, results: [] });
    const original = window.localStorage;
    patchLocalStorage();
    expect(window.localStorage).toBe(original);
  });
});

describe('when parallel > 1', () => {
  beforeEach(() => {
    Object.assign(window, { [UI5_TEST_RUNNER]: PARALLEL_CONFIG });
    patchLocalStorage();
  });

  it('replaces localStorage with an in-memory store that starts empty', () => {
    expect(window.localStorage).toHaveLength(0);
  });

  it('setItem / getItem round-trips', () => {
    window.localStorage.setItem('key', 'value');
    expect(window.localStorage.getItem('key')).toBe('value');
  });

  it('getItem returns null for missing keys', () => {
    expect(window.localStorage.getItem('missing')).toBeNull();
  });

  it('removeItem deletes a key', () => {
    window.localStorage.setItem('key', 'value');
    window.localStorage.removeItem('key');
    expect(window.localStorage.getItem('key')).toBeNull();
  });

  it('clear removes all keys', () => {
    window.localStorage.setItem('a', '1');
    window.localStorage.setItem('b', '2');
    window.localStorage.clear();
    expect(window.localStorage).toHaveLength(0);
  });

  it('length reflects the number of stored keys', () => {
    expect(window.localStorage).toHaveLength(0);
    window.localStorage.setItem('x', '1');
    expect(window.localStorage).toHaveLength(1);
    window.localStorage.setItem('y', '2');
    expect(window.localStorage).toHaveLength(2);
  });

  it('key returns the key at the given index', () => {
    window.localStorage.setItem('first', 'v');
    expect(window.localStorage.key(0)).toBe('first');
  });

  it('key returns null for out-of-range index', () => {
    expect(window.localStorage.key(0)).toBeNull();
  });

  const listener = () => {};

  it('addEventListener throws', () => {
    expect(() => window.localStorage.addEventListener('storage', listener)).toThrow(
      '[ui5-test-runner] localStorage.addEventListener is not supported in parallel mode'
    );
  });

  it('removeEventListener throws', () => {
    expect(() => window.localStorage.removeEventListener('storage', listener)).toThrow(
      '[ui5-test-runner] localStorage.addEventListener is not supported in parallel mode'
    );
  });
});
