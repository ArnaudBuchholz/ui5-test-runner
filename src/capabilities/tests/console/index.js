'use strict'

const { $browsers } = require('../../../symbols')
const { join } = require('path')
const { stat } = require('fs/promises')
const { stop } = require('../../../browsers')
const { buildCsvReader } = require('../../../csv-reader')
const assert = require('assert/strict')

module.exports = {
  label: 'Console logs',
  for: capabilities => Array.isArray(capabilities.traces) && capabilities.traces.includes('console'),
  url: 'console/index.html',
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
    const expectedLogs = [{
      type: 'log',
      text: 'A simple string'
    }, {
      type: 'log',
      text: /^complex parameters 1 true / // Not sure how objects are handled
    }, {
      type: 'warning',
      text: 'A warning'
    }, {
      type: 'error',
      text: 'An error'
    }, {
      type: 'info',
      text: 'An info'
    }]
    let logIndex = -1
    for await (const log of logsReader) {
      assert.strictEqual(typeof log.timestamp, 'string', 'timestamp exists')
      assert.ok(log.timestamp.match(/^[0-9]+$/), 'timestamp is a number')
      const expectedLog = expectedLogs[++logIndex]
      Object.keys(expectedLog).forEach(property => {
        const expectedValue = expectedLog[property]
        if (typeof expectedValue === 'string') {
          assert.strictEqual(log[property], expectedValue, `${property} matching`)
        } else {
          assert.ok(log[property].match(expectedValue), `${property} matching`)
        }
      })
    }
  }
}
