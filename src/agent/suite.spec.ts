import { it, expect, beforeEach, vi } from 'vitest';
import { state } from './state.js';
import { suite, JsUnitTestSuite } from './suite.js';

beforeEach(() => {
  delete window.suite;
  JsUnitTestSuite.pages = undefined;
  Object.assign(state, {
    done: false,
    type: undefined,
    pages: undefined
  });
});

it('fails on suite that does not create a JsUnitTestSuite instance', () => {
  window.suite = vi.fn();
  suite();
  expect.assert(state.type === 'unknown');
});

it('supports empty suite', () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    expect(testSuite).toBeInstanceOf(JsUnitTestSuite);
  });
  suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([]);
});

it('supports multiple pages', () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    testSuite.addTestPage('test1.html');
    testSuite.addTestPage('test2.html');
  });
  suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual(['test1.html', 'test2.html']);
});

it('does not absorb errors (intercepted globally)', () => {
  const error = new Error('KO');
  window.suite = vi.fn(() => {
    throw error;
  });
  expect(() => suite()).toThrow(error);
});
