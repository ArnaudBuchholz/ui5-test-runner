import { it, expect, beforeEach } from 'vitest';
import { qunit } from './qunit.js';
import { results } from './report.js';
import { installQUnit } from './qunit.test.js';

const hooks = installQUnit();

beforeEach(() => {
  qunit();
});

it('install hooks', () => {
  expect(hooks.begin).not.toBeUndefined();
  expect(hooks.log).not.toBeUndefined();
  expect(hooks.testDone).not.toBeUndefined();
  expect(hooks.done).not.toBeUndefined();
});

it('reports test results', async () => {
  await hooks.begin?.({ totalTests: 1, modules: [] });
  await hooks.testDone?.({ module: 'suite1', name: 'test1', runtime: 10, failed: 0, passed: 1, total: 1 });
  await hooks.done?.({ total: 1, failed: 0, passed: 1, runtime: 10 });
  expect(results).toStrictEqual({
    tool: {
      name: 'QUnit',
      version: 'undefined'
    },
    summary: {
      duration: expect.any(Number) as number,
      failed: 0,
      other: 0,
      passed: 1,
      pending: 0,
      skipped: 0,
      start: expect.any(Number) as number,
      stop: expect.any(Number) as number,
      tests: 1
    },
    tests: [
      {
        duration: 10,
        name: 'test1',
        status: 'passed',
        suite: ['suite1']
      }
    ]
  });
  expect(results.summary.start).toBeGreaterThan(0);
  expect(results.summary.stop).toBeGreaterThan(0);
});
