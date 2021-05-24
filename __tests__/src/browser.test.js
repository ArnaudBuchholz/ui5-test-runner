jest.mock('child_process')
const { _hook: hook } = require('child_process')
const { start, stop } = require('../../src/browsers')

const jobPath = '../../src/job.js'
const cwdPath = '/test/project'
const cwd = () => cwdPath

describe('src/job', () => {
  let log

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
  })

  beforeEach(() => {
    jest.resetModules()
  })

  it('starts returns a promise resolved on stop', () => {
    hook.once('new', childProcess => {
      stop('test.html')
    })
    return start('test.html')
  })

  it('stops automatically after the page timeout', () => {
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
    global.process = { cwd, argv: ['node', 'ui5-test-runner', '-pageTimeout:100'] }
    const job = require(jobPath)
    expect(job.pageTimeout).toStrictEqual(100)
    return Promise.all([
      start('test.html'),
      waitingForMessage
    ])
  })

  afterAll(() => {
    log.mockRestore()
  })
})
