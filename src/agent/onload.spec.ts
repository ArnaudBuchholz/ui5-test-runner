import { it, expect, beforeEach, vi } from 'vitest';
import './onload.js';
import { state } from './state.js';
import type { JsUnitTestSuite } from './suite.js';

declare global {
  interface Window {
    jsUnitTestSuite: new () => JsUnitTestSuite;
  }
}

beforeEach(() => {
  delete window.suite;
  Object.assign(state, {
    done: false,
    type: undefined
  });
});

it('detects a suite', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    new JsUnitTestSuite().addTestPage('test.html');
  });
  window.dispatchEvent(new Event('load'));
  await vi.waitFor(() => {
    expect(state.loaded).toBeGreaterThan(0);
    expect.assert(state.type === 'suite');
    expect(state.pages).toStrictEqual(['test.html']);
  });
});
