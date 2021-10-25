jest.mock('child_process')
jest.mock('../../src/output', () => {
  const EventEmitter = require('events')
  class Output extends EventEmitter {
    browserStart (...args) { this.emit('browserStart', ...args) }
    browserStopped (...args) { this.emit('browserStopped', ...args) }
    browserCapabilities (...args) { this.emit('browserCapabilities', ...args) }
    browserTimeout (...args) { this.emit('browserTimeout', ...args) }
    browserRetry (...args) { this.emit('browserRetry', ...args) }
    browserClosed (...args) { this.emit('browserClosed', ...args) }
    monitor (...args) { this.emit('monitor', ...args) }
  }
  return new Output()
})
const output = require('../../src/output')
const { join } = require('path')
const { _hook: hook } = require('child_process')
const jobFactory = require('../../src/job')
const { start, stop, screenshot } = require('../../src/browsers')

const cwd = '/test/project'

describe('src/browser', () => {
  let log
  let warn
  let error
  let job

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
    job = jobFactory.fromCmdLine(cwd, [0, 0, `-tstReportDir:${join(__dirname, '../../tmp/browser')}`])
  })

  it('starts returns a promise resolved on stop', () => {
    hook.once('new', childProcess => {
      setTimeout(() => stop(job, 'test.html'), 0)
    })
    return start(job, 'test.html')
  })

  it('stops automatically after a timeout', () => {
    let stopReceived
    const waitingForMessage = new Promise(resolve => {
      stopReceived = resolve
    })
    hook.once('new', childProcess => {
      childProcess.on('message.received', message => {
        if (message.command === 'stop') {
          childProcess.close()
          stopReceived()
        }
      })
    })
    job.pageTimeout = 100
    return Promise.all([
      start(job, 'test.html'),
      waitingForMessage
    ])
  })

  it('queries capabilities', () => {
    output.once('browserCapabilities', capabilities => {
      expect(capabilities.uid).toStrictEqual(123)
      stop(job, 'test.html')
    })
    hook.once('new', childProcess => {
      childProcess.on('message.received', message => {
        if (message.command === 'capabilities') {
          childProcess.emit('message', {
            command: 'capabilities',
            screenshot: true,
            consoleLog: true,
            uid: 123
          })
        }
      })
    })
    return start(job, 'test.html')
  })

  it('supports screenshot', () => {
    hook.once('new', childProcess => {
      childProcess.on('message.received', message => {
        if (message.command === 'screenshot') {
          expect(message.filename).toStrictEqual('screenshot.png')
          setTimeout(() => {
            childProcess.emit('message', message)
          }, 0)
        }
      })
      setTimeout(async () => {
        await screenshot(job, 'test.html', 'screenshot.png')
        stop(job, 'test.html')
      }, 0)
    })
    return start(job, 'test.html')
  })

  it('supports screenshot (noScreenshot)', () => {
    job.noScreenshot = true
    hook.once('new', childProcess => {
      childProcess.on('message.received', message => {
        expect(message.command).not.toStrictEqual('screenshot')
      })
      setTimeout(async () => {
        await screenshot(job, 'test.html', 'screenshot.png')
        job.noScreenshot = false
        stop(job, 'test.html')
      }, 0)
    })
    return start(job, 'test.html')
  })

  it('supports screenshot (page does not exist)', async () => {
    await expect(screenshot(job, 'test2.html', 'screenshot.png')).resolve
  })

  it('supports screenshot (page disconnected)', async () => {
    job.browserCapabilities = { screenshot: true }
    hook.once('new', childProcess => {
      childProcess.on('message.received', message => {
        expect(message.command).not.toStrictEqual('screenshot')
      })
      setTimeout(async () => {
        childProcess._connected = false
        await screenshot(job, 'test.html', 'screenshot.png')
        stop(job, 'test.html')
      }, 0)
    })
    return start(job, 'test.html')
  })

  it('retries automatically if the process crashes unexpectedly (second succeeds)', () => {
    let step = 0
    hook.once('new', childProcess => {
      step = 1
      setTimeout(() => childProcess.close(), 100)
      hook.once('new', () => {
        step = 2
        setTimeout(() => stop(job, 'test.html'))
      })
    })
    job.pageTimeout = 1000
    return start(job, 'test.html')
      .then(() => {
        expect(step).toStrictEqual(2)
      })
  })

  it('retries automatically if the process crashes unexpectedly (second also fails)', () => {
    let step = 0
    hook.once('new', childProcess => {
      step = 1
      setTimeout(() => childProcess.close(), 100)
      hook.once('new', childProcess => {
        step = 2
        setTimeout(() => childProcess.close(), 100)
      })
    })
    job.pageTimeout = 1000
    return start(job, 'test.html')
      .then(() => {
        expect(step).toStrictEqual(2)
      })
  })

  it('ignores unstarted pages', () => {
    stop(job, 'unknown.html')
  })

  afterAll(() => {
    expect(log.mock.calls.length).toStrictEqual(0)
    expect(warn.mock.calls.length).toStrictEqual(0)
    expect(error.mock.calls.length).toStrictEqual(0)
    log.mockRestore()
    warn.mockRestore()
    error.mockRestore()
  })
})
