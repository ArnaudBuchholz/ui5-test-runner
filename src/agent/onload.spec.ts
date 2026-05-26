import { it, expect, beforeEach, vi } from 'vitest';
import { DETECTION_TIMEOUT } from './onload.js';
import { state } from './state.js';
import type { JsUnitTestSuite } from './suite.js';
import { installQUnit } from './qunit.test.js';
import { setTimeout } from 'node:timers/promises';

declare global {
  interface Window {
    jsUnitTestSuite: new () => JsUnitTestSuite;
  }
}

beforeEach(() => {
  delete window.suite;
  delete window.QUnit;
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

it('detects QUnit', async () => {
  const hooks = installQUnit();
  window.dispatchEvent(new Event('load'));
  await vi.waitFor(() => {
    expect(hooks.begin).not.toBeUndefined();
    expect(hooks.log).not.toBeUndefined();
    expect(hooks.testDone).not.toBeUndefined();
    expect(hooks.done).not.toBeUndefined();
    expect(state.type).toStrictEqual('QUnit');
  });
});

it(
  'waits until a given timeout',
  {
    timeout: 2 * DETECTION_TIMEOUT
  },
  async () => {
    window.dispatchEvent(new Event('load'));
    const timeout = DETECTION_TIMEOUT / 2;
    await setTimeout(timeout);
    installQUnit();
    await vi.waitFor(() => {
      expect(state.type).toStrictEqual('QUnit');
    });
  }
);

it(
  'fails after the timeout',
  {
    timeout: 2 * DETECTION_TIMEOUT
  },
  async () => {
    window.dispatchEvent(new Event('load'));
    await vi.waitFor(
      () => {
        expect(state.type).toStrictEqual('unknown');
        expect(state.done).toStrictEqual(true);
      },
      { timeout: 2 * DETECTION_TIMEOUT }
    );
  }
);
