'use strict'

QUnit.module('QUnit Uncaught test')

QUnit.test('ok', (assert) => {
  const done = assert.async()
  assert.ok(true)
  Promise.reject(new Error('Should be detected'))
  setTimeout(done, 50)
})
