import { it, expect } from 'vitest';
import './qunit.js';

let begin: Parameters<typeof QUnit.begin>[0];
let testStart: Parameters<typeof QUnit.testStart>[0];
let log: Parameters<typeof QUnit.log>[0];
let testDone: Parameters<typeof QUnit.testDone>[0];
let done: Parameters<typeof QUnit.done>[0];

window.QUnit = {
  begin(callback) {
    begin = callback;
  },
  testStart(callback) {
    testStart = callback;
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

it('install hooks', () => {
  expect(begin).not.toBeUndefined();
  expect(testStart).not.toBeUndefined();
  expect(log).not.toBeUndefined();
  expect(testDone).not.toBeUndefined();
  expect(done).not.toBeUndefined();
});
