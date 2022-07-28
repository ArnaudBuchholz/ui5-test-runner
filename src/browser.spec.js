const output = require('./output')
const { join } = require('path')
const { _hook: hook } = require('child_process')
const jobFactory = require('./job')
const { probe, start, stop, screenshot } = require('./browsers')
const { readFile, writeFile } = require('fs/promises')

const cwd = '/test/project'
describe('src/browser', () => {
  let job

  beforeAll(() => {
    job = jobFactory.fromCmdLine(cwd, ['-url:about:blank', `-tstReportDir:${join(__dirname, '../tmp/browser')}`])
  })

  afterAll(() => {
    hook.removeAllListeners('new')
  })

  describe('probe', () => {
    it('starts the command with a specific url', async () => {
      hook.on('new', async childProcess => {
        const config = JSON.parse((await readFile(childProcess.args[0])).toString())
        expect(config.url).toStrictEqual('about:blank')
        await writeFile(config.capabilities, '{}')
        childProcess.close()
      })
      await probe(job)
      expect(job.browserCapabilities.console).toStrictEqual(false)
    })

    it('reads browser capabilities', async () => {
      hook.on('new', async childProcess => {
        const config = JSON.parse((await readFile(childProcess.args[0])).toString())
        await writeFile(config.capabilities, JSON.stringify({
          screenshot: false,
          console: true
        }))
        childProcess.close()
      })
      await probe(job)
      expect(job.browserCapabilities.console).toStrictEqual(true)
    })

    it('handles dependency modules', async () => {
      hook.on('new', async childProcess => {
        if (childProcess.scriptPath === 'npm') {
        } else {
          const config = JSON.parse((await readFile(childProcess.args[0])).toString())
          await writeFile(config.capabilities, JSON.stringify({
            modules: ['test']
          }))
        }
        childProcess.close()
      })
      await probe(job)
      expect(job.browserCapabilities.modules.test).toStrictEqual(true)
    })
  })

  return

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
})
