#!/usr/bin/env node

'use strict'

const { serve } = require('reserve')
const { watch } = require('fs')
const { capabilities } = require('./src/capabilities')
const { execute } = require('./src/tests')
const { fromCmdLine } = require('./src/job')
const { getOutput } = require('./src/output')
const { preload } = require('./src/ui5')
const { probe: probeBrowser } = require('./src/browsers')
const { recreateDir, allocPromise } = require('./src/tools')
const reserveConfigurationFactory = require('./src/reserve')
const start = require('./src/start')

function send (message) {
  if (process.send) {
    process.send({
      pid: process.pid,
      ...message
    })
  }
}

async function notifyAndExecuteTests (job) {
  send({ msg: 'begin' })
  try {
    await execute(job)
    let status
    if (job.failed) {
      status = -1
    } else {
      status = 0
    }
    send({ msg: 'end', status })
  } catch (error) {
    getOutput(job).genericError(error)
    send({ msg: 'error', error })
  }
}

let job
let output

async function main () {
  job = fromCmdLine(process.cwd(), process.argv.slice(2))
  output = getOutput(job)
  await recreateDir(job.reportDir)
  output.version()
  if (job.mode === 'capabilities') {
    return capabilities(job)
  }
  const configuration = await reserveConfigurationFactory(job)
  output.debug('reserve', 'configuration', configuration)
  const server = serve(configuration)
  if (job.logServer) {
    server.on('redirected', output.redirected)
  }

  const { promise: serverStarted, resolve: serverReady, reject: serverError } = allocPromise()
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      send({ msg: 'ready', port: job.port })
      output.serving(url)
      output.reportOnJobProgress()
      serverReady()
    })
    .on('error', error => {
      output.serverError(error)
      send({ msg: 'error', error })
      serverError()
    })
  await serverStarted
  let startedCommand
  if (job.start) {
    output.reportOnJobProgress()
    startedCommand = await start(job)
  }
  if (job.preload) {
    await preload(job)
  }
  if (job.serveOnly) {
    job.status = 'Serving'
    return
  }
  await probeBrowser(job)
  await notifyAndExecuteTests(job)
  if (job.watch) {
    delete job.start
    if (!job.watching) {
      output.watching(job.webapp)
      watch(job.webapp, { recursive: true }, async (eventType, filename) => {
        output.changeDetected(eventType, filename)
        if (!job.start) {
          await recreateDir(job.reportDir)
          notifyAndExecuteTests(job)
        }
      })
      job.watching = true
    }
  } else if (job.keepAlive) {
    job.status = 'Serving'
    return
  } else if (job.failed) {
    process.exitCode = -1
  }
  output.stop()
  await server.close()
  if (startedCommand) {
    await startedCommand.stop()
  }
  console.log('done ?')
}

main()
  .catch(reason => {
    if (output) {
      output.genericError(reason)
      output.stop()
    } else if (reason.name !== 'CommanderError') {
      console.error(reason)
    }
    process.exit(-1)
  })
