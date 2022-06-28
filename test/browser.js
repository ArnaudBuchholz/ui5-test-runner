'use strict'

const { check, serve, body } = require('reserve')
const { probe, start, screenshot, stop } = require('../src/browsers')
const { fromCmdLine } = require('../src/job')
const { join } = require('path')
const output = require('../src/output')
const EventEmitter = require('events')

function exit (code) {
  output.stop()
  process.exit(code)
}

const tests = [{
  label: 'Loads a page',
  for: capabilities => true,
  url: 'basic.html',
  run: listener => new Promise(resolve => listener.on('log', () => {
    setTimeout(resolve, 5000)
  }))
}]

async function main () {
  const [,, command] = process.argv
  const job = fromCmdLine(process.cwd(), [
    `-tmpDir:${join(__dirname, '..', 'tmp')}`,
    '-url: localhost:80',
    `-browser:${command}`
  ])
  output.report(job)
  try {
    await probe(job)
  } catch (e) {
    console.error('Unable to probe', e)
    exit(-1)
  }
  console.log('Resolved capabilities :', job.browserCapabilities)

  const listeners = []

  const configuration = await check({
    mappings: [{
      method: 'POST',
      match: '/log$',
      custom: async (request, response) => {
        const listenerIndex = request.headers.referer.match(/\blistener=(\d+)/)[1]
        const listener = listeners[listenerIndex]
        listener.emit('log', JSON.parse(await body(request)))
        response.writeHead(200)
        response.end()
      }
    }, {
      match: '^/(.*)',
      file: join(__dirname, '$1')
    }]
  })
  await new Promise(resolve => serve(configuration)
    .on('ready', ({ port }) => {
      job.port = port
      resolve()
    })
  )

  const filteredTests = tests.filter(test => test.for(job.browserCapabilities))
  console.log('Number of tests :', filteredTests.length)

  let errors = 0

  const next = async () => {
    if (tests.length === 0) {
      console.log('Done.')
      exit(errors)
    }
    const { label, url, run } = tests.shift()

    const listenerIndex = listeners.length
    const listener = new EventEmitter()
    listeners.push(listener)
    let pageUrl = `http://localhost:${job.port}/${url}`
    if (url.includes('?')) {
      pageUrl += `&listener=${listenerIndex}`
    } else {
      pageUrl += `?listener=${listenerIndex}`
    }

    function done (succeeded) {
      console.log(succeeded ? '✔️' : '❌', label)
      if (!succeeded) {
        ++errors
      }
      next()
    }

    run(listener)
      .then(() => done(true), () => done(false))
    start(job, pageUrl)
      .catch(() => done(false))
  }

  for (let i = 0; i < 1; ++i) {
    next()
  }
}

main()
  .catch(reason => {
    console.error(reason)
    exit(-1)
  })
