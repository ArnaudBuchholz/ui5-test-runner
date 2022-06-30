'use strict'

const { check, serve, body } = require('reserve')
const { probe, start, screenshot, stop } = require('../src/browsers')
const { fromCmdLine } = require('../src/job')
const { join } = require('path')
const output = require('../src/output')
const EventEmitter = require('events')
const assert = require('assert')

function exit (code) {
  output.stop()
  process.exit(code)
}

const tests = [{
  label: 'Loads a page',
  for: capabilities => true,
  url: 'basic.html',
  log: () => {}
}, {
  label: 'Local storage (1)',
  for: capabilities => true,
  url: 'localStorage.html?value=1',
  log: ({ initial, modified }) => {
    assert(initial === undefined, 'The local storage starts empty')
    assert(modified === '1', 'The local storage can be used')
  }
}, {
  label: 'Local storage (2)',
  for: capabilities => true,
  url: 'localStorage.html?value=2',
  log: ({ initial, modified }) => {
    assert(initial === undefined, 'The local storage starts empty')
    assert(modified === '2', 'The local storage can be used')
  }
}, {
  label: 'timeout (100ms)',
  for: capabilities => true,
  url: 'timeout.html?rate=100&wait=1000',
  log: ({ steps }) => {
    assert(steps.length > 8, 'The right number of steps is generated')
  }
}, {
  label: 'timeout (250ms)',
  for: capabilities => true,
  url: 'timeout.html?rate=250&wait=1250',
  log: ({ steps }) => {
    assert(steps.length > 3, 'The right number of steps is generated')
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

  const next = () => {
    if (tests.length === 0) {
      if (Object.keys(job.browsers).length === 0) {
        console.log('Done.')
        exit(errors)
      }
      return
    }
    const { label, url, log } = tests.shift()

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
      stop(job, pageUrl)
      if (!succeeded) {
        ++errors
      }
      next()
    }

    listener.on('log', data => {
      try {
        log(data)
        console.log('✔️', label)
        done(true)
      } catch (e) {
        console.log('❌', label)
        console.log(e)
        done(false)
      }
    })

    start(job, pageUrl)
      .catch(() => done(false))
  }

  let parallel
  if (!job.browserCapabilities.parallel) {
    parallel = 1
  } else {
    parallel = 2
  }

  for (let i = 0; i < parallel; ++i) {
    next()
  }
}

main()
  .catch(reason => {
    console.error(reason)
    exit(-1)
  })
