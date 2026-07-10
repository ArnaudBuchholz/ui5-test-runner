QUnit.test('Local Storage value is undefined', (assert) => {
  assert.strictEqual(localStorage.value, undefined);
});

QUnit.test('Set Local Storage value to a random value', (assert) => {
  const value = Date.now().toString();
  localStorage.value = value;
  assert.strictEqual(localStorage.value, value);
});
