'use strict'

const assert = require('assert')
const { screenshot } = require('../../../browsers')
const { stat } = require('fs/promises')

module.exports = {
  label: 'Screenshot',
  for: capabilities => !!capabilities.screenshot,
  url: 'screenshot/index.html',
  endpoint: async function (_, url) {
    const { job } = this
    const fileName = await screenshot(job, url, 'screenshot')
    const fileInfo = await stat(fileName)
    assert.ok(fileInfo.isFile(), 'The file was generated')
    assert.ok(fileInfo.size > 1024, 'The file contains something')
  }
}
