'use strict'

const { fork } = require('child_process')
const { join } = require('path')
require('dotenv').config()

const root = join(__dirname, '../..')

const waitFor = (url, timeout = 30000) => new Promise((resolve, reject) => {
  const start = Date.now()
  const loop = async () => {
    try {
      await fetch(url)
      resolve()
    } catch (e) {
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout while waiting for ${url}`))
      }
      setTimeout(loop, 250)
    }
  }
  loop()
})

const serve = async (label, port, parameters, cwd) => {
  console.log(`🛜  ${label} (${port})`)
  const [script, ...args] = parameters
  fork(script, args, { cwd, stdio: [0, 'inherit', 'inherit', 'ipc'] })
  return waitFor(`http://localhost:${port}`)
}

const ui5Serve = () => serve('ui5 serve', 8080, [
  join(root, 'node_modules/@ui5/cli/bin/ui5.cjs'), 'serve', '--config', join(root, 'test/sample.js/ui5.yaml')
])

const serveWithBasicAuthent = () => serve('reserve with basic-authent', 8081, [
  join(root, 'node_modules/reserve/dist/cli.js'), '--silent', '--config', join(root, 'test/sample.js/reserve.json')
])

const ui5ServeTs = () => serve('ui5 serve with transpiling', 8082, [
  join(root, 'test/sample.ts/ui5.cjs'), 'serve'
], join(root, 'test/sample.ts'))

const ui5ServeTsWitCoverage = () => serve('ui5 serve with transpiling and coverage', 8083, [
  join(root, 'test/sample.ts/ui5.cjs'), 'serve', '--config', 'ui5-coverage.yaml'
], join(root, 'test/sample.ts'))

const nodeVersion = parseInt(process.version.match(/v(\d+)\./)[1])

async function main () {
  if (nodeVersion >= 20) {
    await ui5Serve()
    await ui5ServeTs()
    await ui5ServeTsWitCoverage()
  }
  // Must be last to ensure synchronization
  await serveWithBasicAuthent()
}

main()
