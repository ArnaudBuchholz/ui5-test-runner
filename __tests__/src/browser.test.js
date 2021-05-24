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
    job = jobFactory.fromCmdLine(cwd, [0, 0, `-tstReportDir:${join(__dirname, '../tmp')}`])
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

  it('ignores unstarted pages', () => {
    stop(job, 'unknown.html')
  })

  afterAll(() => {
    log.mockRestore()
  })
})
