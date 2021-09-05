jest.mock('child_process')
const { join } = require('path')
const { _hook: hook } = require('child_process')
const jobFactory = require('../../src/job')
const { start, stop } = require('../../src/browsers')

const cwd = '/test/project'

describe('src/job', () => {
  let log
  let job

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    job = jobFactory.fromCmdLine(cwd, [0, 0, `-tstReportDir:${join(__dirname, '../../tmp/browser')}`])
  })

  it('starts returns a promise resolved on stop', () => {
    hook.once('new', childProcess => {
      stop(job, 'test.html')
    })
    return start(job, 'test.html')
  })

  it('stops automatically after a timeout', () => {
    let done
    const waitingForMessage = new Promise(resolve => {
      done = resolve
    })
    hook.once('new', childProcess => {
      childProcess.on('message', message => {
        if (message.command === 'stop') {
          childProcess.close()
          done()
        }
      })
    })
    job.pageTimeout = 100
    return Promise.all([
      start(job, 'test.html'),
      waitingForMessage
    ])
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
    log.mockRestore()
  })
})
