/* global QUnit */

// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false



QUnit.module('Puppeteer device emulation')

// Expected values match puppeteer's "iPhone X" known device, requested via --device in the batch config
QUnit.test('the page is emulated as an iPhone X', function (assert) {
  assert.ok(/iPhone/.test(navigator.userAgent), `navigator.userAgent reports an iPhone (got: "${navigator.userAgent}")`)
  assert.strictEqual(window.innerWidth, 375, 'window.innerWidth matches the iPhone X viewport width')
  assert.ok(navigator.maxTouchPoints > 0, 'touch support is emulated')
})

if (!QUnit.config.started) {
  QUnit.start()
}

