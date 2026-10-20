QUnit.test('Dynamic part is loaded', (assert) => {
  const done = assert.async();
  const scriptElement = document.createElement('script');
  scriptElement.src = 'unit/dynamic.js';
  scriptElement.addEventListener('load', () => {
    assert.strictEqual(window.dynamic, true);
    done();
  });
  scriptElement.addEventListener('error', () => {
    assert.ok(false, 'Dynamic script failed to load');
    done();
  });
  document.head.appendChild(scriptElement);
});
