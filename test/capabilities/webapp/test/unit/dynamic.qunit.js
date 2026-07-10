const scriptElement = document.createElement('script');
scriptElement.src = 'unit/dynamic.js';
document.head.appendChild(scriptElement);

QUnit.test('Dynamic part is loaded', (assert) => {
  assert.strictEqual(window.dynamic, true);
});
