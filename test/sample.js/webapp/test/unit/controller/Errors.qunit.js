'use strict'

QUnit.module('QUnit Errors test')

QUnit.test('assert.strictEqual(string, string)', (assert) => {
  assert.strictEqual('a', 'b')
})

QUnit.test('assert.ok', (assert) => {
  assert.ok(false, 'should fail')
})

QUnit.test('async with expect(1)', (assert) => {
  const done = assert.async()
  assert.expect(1)
  done()
})

QUnit.test('assert.deepEqual', (assert) => {
  assert.deepEqual({ a: 1 }, { b: 1 })
})

QUnit.test('assert.deepEqual(recursive)', (assert) => {
  const a = { a: 1 }
  a.ref = a
  assert.deepEqual(a, { b: 1 })
})

QUnit.test('assert.raises', (assert) => {
  assert.raises(() => {}, 'No exception raised')
})

QUnit.test('assert.throws', (assert) => {
  assert.throws(() => {}, 'No exception thrown')
})

QUnit.test('assert.step', (assert) => {
  assert.step(1)
  assert.verifySteps([0], 'Not matching steps')
})

QUnit.test('exception', (assert) => {
  throw new Error('fail', { cause: new Error('casue') })
})
