'use strict'

const { join } = require('path')
const { spawn } = require('process')

module.exports = (...args) => {
  const process = spawn('node', [join(__dirname, '../node_modules/nyc/bin/nyc.js'), ...args], {
    stdio: 'inherit'
  })
  let done
  const promise = new Promise(resolve => { done = resolve })
  process.on('close', done)
  return promise
}
