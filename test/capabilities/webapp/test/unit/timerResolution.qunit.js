const config = location.hash || '100-1000-8';
const [DELAY, WAIT, EXPECTED_MIN_STEPS] = config.split('-').map(Number);
const steps = [];

// QUnit.config.reorder = false;

QUnit.test('Check the timer resolution', (assert) => {
  const done = assert.async();
  setInterval(() => {
    steps.push(Date.now())
  }, DELAY)
  setTimeout(() => {
    assert.ok(steps.length >= EXPECTED_MIN_STEPS);
    done();
  }, WAIT);
});
