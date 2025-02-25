const { mock: mockChildProcess } = require('child_process')
const { join } = require('path')
const { start } = require('./start')

jest.mock('ps-tree', () => (_, cb) => cb(null, [{
  PID: 1
}, {
  PID: 2
}]))
jest.spyOn(process, 'kill')

describe('src/start', () => {
  let job
  let returnUrlAnswerAfter // ms
  const VALID_URL = 'http://localhost/valid'
  const INVALID_URL = 'http://localhost/invalid'
  let startExecuted = false

  beforeEach(() => {
    process.kill.mockClear()
    returnUrlAnswerAfter = 500 // ms
    job = {
      cwd: __dirname,
      startTimeout: 5000,
      startWaitUrl: VALID_URL,
      startCommand: 'start'
    }
    mockChildProcess({
      api: 'exec',
      scriptPath: 'start',
      exec: () => { startExecuted = true },
      close: false
    })
    let firstFetch
    global.fetch = async (url) => {
      if (firstFetch === undefined) {
        firstFetch = Date.now()
        throw new Error('E_CONNECT failed')
      } else if (Date.now() - firstFetch < returnUrlAnswerAfter) {
        throw new Error('E_CONNECT failed')
      }
      if (url === VALID_URL) {
        return { status: 200 }
      }
      if (url === INVALID_URL) {
        return { status: 404 }
      }
    }
  })

  it('runs command', async () => {
    await start(job)
    expect(startExecuted).toStrictEqual(true)
  })

  it('detects equivalent script cwd\'s package.json', async () => {
    job.cwd = join(__dirname, '..')
    job.startCommand = 'test'
    let executed = false
    mockChildProcess({
      api: 'exec',
      scriptPath: 'npm',
      args: ['run', 'test'],
      exec: () => { executed = true },
      close: false
    })
    await start(job)
    expect(executed).toStrictEqual(true)
  })

  it('runs command despite cwd\'s package.json', async () => {
    job.cwd = join(__dirname, '..')
    job.startCommand = 'test2'
    let executed = false
    mockChildProcess({
      api: 'exec',
      scriptPath: 'test2',
      exec: () => { executed = true },
      close: false
    })
    await start(job)
    expect(executed).toStrictEqual(true)
  })

  describe('waiting for URL to be available', () => {
    it('detects command termination and fails', async () => {
      job.startCommand = 'close'
      mockChildProcess({
        api: 'exec',
        scriptPath: 'close',
        exec: () => {},
        close: true
      })
      returnUrlAnswerAfter = 5000
      job.startCommandTimeout = 5000
      await expect(start(job)).rejects.toThrowError(/Start command failed with exit code/)
    })

    it('times out after expected limit and fails', async () => {
      returnUrlAnswerAfter = 5000
      job.startCommandTimeout = 500
      await expect(start(job)).rejects.toThrowError(/Timeout while waiting for/)
    })

    it('times out after expected limit and fails (wrong URL)', async () => {
      job.startCommandTimeout = 1000
      job.startWaitUrl = INVALID_URL
      await expect(start(job)).rejects.toThrowError(/Timeout while waiting for/)
    })
  })

  it('stops the command by killing all children processes', async () => {
    const started = await start(job)
    await started.stop()
    expect(process.kill).toHaveBeenCalledTimes(2)
    expect(process.kill).toHaveBeenCalledWith(1, 'SIGKILL')
    expect(process.kill).toHaveBeenCalledWith(2, 'SIGKILL')
  })
})
