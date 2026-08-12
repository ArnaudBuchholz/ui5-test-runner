'use strict'

QUnit.module('QUnit Uncaught test')

QUnit.test('ok', (assert) => {
  assert.ok(true)
})

QUnit.test('not ok', (assert) => {
  const done = assert.async()
  assert.ok(true)
  // Spend some time to ensure the first test report is collected before the error is detected
  setTimeout(() => {
    Promise.reject(new Error('Should be detected'))
    setTimeout(done, 500)
  }, 500)
})
