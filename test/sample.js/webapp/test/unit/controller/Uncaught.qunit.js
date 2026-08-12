'use strict'

QUnit.module('QUnit Uncaught test')

QUnit.test('ok', (assert) => {
  assert.ok(true)
})

throw new Error('Should be detected')
