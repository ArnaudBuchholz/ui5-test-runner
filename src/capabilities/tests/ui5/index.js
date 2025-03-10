'use strict'

const assert = require('assert')

module.exports = [{
  label: 'UI5 focus handling',
  for: capabilities => !capabilities.modules.includes('jsdom'), // does not work on JSDOM
  url: 'ui5/focus.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['is-focus-set'], true)
  }
}, {
  label: 'UI5 language handling (EN)',
  for: capabilities => capabilities.modules.includes('puppeteer'),
  url: 'ui5/language.html',
  args: ['--language en'],
  endpoint: ({ body }) => {
    assert.strictEqual(body.message, 'No matching items found.')
  }
}, {
  label: 'UI5 language handling (DE)',
  for: capabilities => capabilities.modules.includes('puppeteer'),
  url: 'ui5/language.html',
  args: ['--language de'],
  endpoint: ({ body }) => {
    assert.strictEqual(body.message, 'Keine passenden Elemente gefunden.')
  }
}, {
  label: 'UI5 language handling (FR)',
  for: capabilities => capabilities.modules.includes('puppeteer'),
  url: 'ui5/language.html',
  args: ['--language fr'],
  endpoint: ({ body }) => {
    assert.strictEqual(body.message, 'Aucun élément concordant trouvé.')
  }
}]
