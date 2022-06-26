'use strict'

const { check, serve, log, body } = require('reserve')
const { probe, start, screenshot, stop } = require('../src/browsers')
const { fromCmdLine } = require('../src/job')
const { join } = require('path')
const output = require('../src/output')
const EventEmitter = require('events')

const tests = [{
  label: 'Loads a page',
  for: capabilities => true,
  run: function * () {
    const listener = yield 'basic.html'
    return new Promise(resolve => listener.on('log', resolve))
  }
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
    process.exit(-1)
  }
  console.log('Capabilities :', job.browserCapabilities)

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
  await new Promise(resolve => {
    log(serve(configuration))
      .on('ready', ({ port }) => {
        job.port = port
        resolve()
      })
  })

  const filteredTests = tests.filter(test => test.for(job.browserCapabilities))
  console.log('Number of tests :', filteredTests.length)
  let errors = 0

  const next = async () => {
    if (tests.length === 0) {
      console.log('Done.')
      process.exit(errors)
    }
    const { label, run } = tests.shift()
    const test = run()
    let url = test.next().value

    const listenerIndex = listeners.length
    const listener = new EventEmitter()
    listeners.push(listener)
    if (url.includes('?')) {
      url += `&listener=${listenerIndex}`
    } else {
      url += `?listener=${listenerIndex}`
    }

    test.next(listener).value
      .then(() => true, () => false)
      .then(success => {
        console.log(success ? '' : '', label)
        if (!success) {
          ++errors
        }
      })
      .then(next)

    await start(job, `http://localhost:${job.port}/${url}`)
  }

  for (let i = 0; i < 1; ++i) {
    next()
  }
}

main().catch(reason => console.error(reason))
