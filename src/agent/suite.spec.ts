import { it, expect, beforeEach, vi } from 'vitest';
import { state } from './state.js';
import { suite, JsUnitTestSuite } from './suite.js';
import { setTimeout } from 'node:timers/promises';

// Mute console outputs
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  delete window.suite;
  JsUnitTestSuite.pages = undefined;
  Object.assign(state, {
    done: false,
    type: undefined,
    pages: undefined
  });
});

it('fails on suite that does not create a JsUnitTestSuite instance', async () => {
  window.suite = vi.fn();
  await suite();
  expect.assert(state.type === 'unknown');
});

it('supports empty suite', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    expect(testSuite).toBeInstanceOf(JsUnitTestSuite);
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([]);
});

it('supports multiple pages (sync)', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    testSuite.addTestPage('test1.html');
    testSuite.addTestPage('test2.html');
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual(['test1.html', 'test2.html']);
});

it('supports multiple pages (async)', async () => {
  window.suite = vi.fn(async () => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    await setTimeout(50);
    testSuite.addTestPage('test1.html');
    await setTimeout(50);
    testSuite.addTestPage('test2.html');
    await setTimeout(50);
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual(['test1.html', 'test2.html']);
});

it('does not absorb errors (intercepted globally)', async () => {
  const error = new Error('KO');
  window.suite = vi.fn(() => {
    throw error;
  });
  await expect(suite()).rejects.toThrow(error);
});
