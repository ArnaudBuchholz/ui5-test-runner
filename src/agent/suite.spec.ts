import { it, expect, beforeEach, vi } from 'vitest';
import { state } from './state.js';
import { suite } from './suite.js';
import { setTimeout } from 'node:timers/promises';

beforeEach(() => {
  delete window.suite;
  Object.assign(state, {
    done: false,
    type: undefined
  });
});

it('fails on empty suite', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    expect(testSuite).toBeInstanceOf(JsUnitTestSuite);
  });
  await suite();
  expect.assert(state.type === 'unknown');
});

it('supports a synchronous suite', async () => {
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

it('supports an asynchronous suite', async () => {
  window.suite = vi.fn(async () => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    await setTimeout(250);
    testSuite.addTestPage('test1.html');
    await setTimeout(500);
    testSuite.addTestPage('test2.html');
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual(['test1.html', 'test2.html']);
});
