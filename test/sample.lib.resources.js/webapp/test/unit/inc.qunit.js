sap.ui.define(['sap/utr/lib/arithmetics'], function (arithmetics) {
  'use strict'

  QUnit.module('Sample Lib inc test')

  QUnit.test('Adds 1', function (assert) {
    assert.strictEqual(arithmetics.inc(0), 1)
  })
})
