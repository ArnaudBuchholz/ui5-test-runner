QUnit.test('Check timer resolution', (assert) => {
  const done = assert.async();
  const DELAY = 100;
  const WAIT = 1000;
  const steps = []
  setInterval(() => {
    steps.push(Date.now())
  }, DELAY)
  setTimeout(() => {
    assert.ok(steps.length > 8);
    done();
  }, WAIT);
});
