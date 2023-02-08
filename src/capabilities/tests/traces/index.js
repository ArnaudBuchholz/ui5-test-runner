'use strict'

const { $browsers } = require('../../../symbols')
const { join } = require('path')
const { stat } = require('fs/promises')
const { stop } = require('../../../browsers')
const { buildCsvReader } = require('../../../csv-reader')
const assert = require('assert')

const expectedLogs = [{
  type: 'log',
  text: 'A simple string'
}, {
  type: 'log',
  text: 'A quoted "string"'
}, {
  type: 'log',
  text: /^"?complex parameters"? 1 true / // Not sure how objects are handled
}, {
  type: 'warning',
  text: 'A warning'
}, {
  type: 'error',
  text: 'An error'
}, {
  type: /info|log/, // selenium-webdriver
  text: 'An info'
}]

function equal (value, expected, label) {
  if (typeof expected === 'string') {
    return value === expected
  }
  return !!value.match(expected)
}

function unquote (string) {
  if (string.startsWith('"') && string.endsWith('"')) {
    return string.substring(1, string.length - 1)
      .replace(/\\"/g, '"')
  }
  return string
}

module.exports = {
  label: 'Console logs',
  for: capabilities => Array.isArray(capabilities.traces) && capabilities.traces.includes('console'),
  url: 'traces/index.html',
  endpoint: async function (_, url) {
    const { job } = this
    const { reportDir } = job[$browsers][url]
    this.stopExpected = true
    await stop(this.job, url)
    const consolePath = join(reportDir, 'console.csv')
    const consoleStat = await stat(consolePath)
    if (!consoleStat.isFile()) {
      throw new Error('missing console.csv')
    }
    const logsReader = buildCsvReader(consolePath)
    let logIndex = 0
    for await (const log of logsReader) {
      assert.strictEqual(typeof log.timestamp, 'string', 'timestamp exists')
      assert.ok(log.timestamp.match(/^[0-9]+$/), 'timestamp is a number')
      const {
        type: expectedType,
        text: expectedText
      } = expectedLogs[logIndex]
      let { text } = log
      const match = text.match(/^https?[^ ]+ (\d+:\d+ )?(.*)/)
      if (match) {
        text = unquote(match[2])
      }
      if (equal(log.type, expectedType) && equal(text, expectedText)) {
        if (++logIndex === expectedLogs.length) {
          break
        }
      }
    }
    assert.strictEqual(logIndex, expectedLogs.length, 'All expected logs were found')
  }
}
