import { it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { qunit } from './qunit.js';
import { report } from './report.js';
import { state } from './state.js';

const id = expect.any(String) as string;
const trace = expect.any(String) as string;

beforeAll(() => {
  // Keeping the jsdom context, we need to tweak QUnit to prevent autostart
  Object.defineProperty(window.document, 'readyState', {
    get() {
      return 'unknown';
    }
  });
  // Remove useless warnings
  window.scrollTo = () => {};
});

beforeEach(async () => {
  report.reset();
  Object.assign(state, { done: false, type: undefined });
  delete window.QUnit;
  // works because of vitest.config.ts' config of qunit inline
  vi.resetModules();
  const QUnit = await import('qunit');
  window.QUnit = QUnit;
  qunit();
});

const execQunit = async () => {
  QUnit.start();
  window.dispatchEvent(new Event('load'));
  await vi.waitFor(() => expect(state.done).toBe(true));
  return report.results;
};

it('reports test results from actual QUnit execution', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.ok(true);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.passed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'passed',
      suite: ['suite1']
    }
  ]);
  expect(results.tool.name).toBe('QUnit');
  expect(results.tool.version).toBeDefined();
  expect(results.summary.start).toBeGreaterThan(0);
  expect(results.summary.stop).toBeGreaterThan(0);
});

it('documents a test failure', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.ok(false);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.failed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'failed',
      suite: ['suite1'],
      message: 'failed, expected argument to be truthy, was: false',
      trace
    }
  ]);
});

it('documents skipped tests', async () => {
  QUnit.module('suite1');
  QUnit.skip('test1', (assert) => {
    assert.ok(false);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.skipped).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'skipped',
      suite: ['suite1']
    }
  ]);
});

it('documents pending tests (QUnit.todo)', async () => {
  QUnit.module('suite1');
  QUnit.todo('test1', (assert) => {
    assert.ok(true);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.pending).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'pending',
      suite: ['suite1']
    }
  ]);
});
