import { it, expect, beforeEach } from 'vitest';
import { qunit } from './qunit.js';
import { results } from './report.js';

let begin: Parameters<typeof QUnit.begin>[0];
let log: Parameters<typeof QUnit.log>[0];
let testDone: Parameters<typeof QUnit.testDone>[0];
let done: Parameters<typeof QUnit.done>[0];

window.QUnit = {
  begin(callback) {
    begin = callback;
  },
  log(callback) {
    log = callback;
  },
  testDone(callback) {
    testDone = callback;
  },
  done(callback) {
    done = callback;
  }
} as QUnit;

beforeEach(() => {
  qunit();
});

it('install hooks', () => {
  expect(begin).not.toBeUndefined();
  expect(log).not.toBeUndefined();
  expect(testDone).not.toBeUndefined();
  expect(done).not.toBeUndefined();
});

it('reports test results', async () => {
  await begin({ totalTests: 1, modules: [] });
  await testDone({ module: 'suite1', name: 'test1', runtime: 10, failed: 0, passed: 1, total: 1 });
  await done({ total: 1, failed: 0, passed: 1, runtime: 10 });
  expect(results).toStrictEqual({
    tool: {
      name: 'QUnit',
      version: 'undefined'
    },
    summary: {
      duration: 0,
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
