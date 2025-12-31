const { mock: mockChildProcess } = require('child_process')
const { join } = require('path')
const { start } = require('./start')
const os = require('os')

jest.spyOn(process, 'kill')
jest.mock('./output', () => {
  const output = new Proxy({}, {
    get (target, property) {
      if (!target[property]) {
        target[property] = jest.fn()
      }
      return target[property]
    }
  })
  return {
    getOutput: () => output
  }
})
jest.mock('os', () => ({
  platform: jest.fn()
}))

describe('src/start', () => {
  let job
  let returnUrlAnswerAfterMs
  const VALID_URL = 'http://localhost/valid'
  const INVALID_URL = 'http://localhost/invalid'
  let startExecuted = false
  let childProcessInstance

  beforeEach(() => {
    process.kill.mockClear()
    process.kill.mockImplementation(() => {})
    returnUrlAnswerAfterMs = 500
    job = {
      cwd: __dirname,
      startTimeout: 1000,
      startWaitUrl: VALID_URL,
      startCommand: 'start'
    }
    mockChildProcess({
      api: 'exec',
      scriptPath: 'start',
      exec: (childProcess) => {
        childProcessInstance = childProcess
        startExecuted = true
      },
      close: false
    })
    let firstFetch
    global.fetch = async (url) => {
      if (firstFetch === undefined) {
        firstFetch = Date.now()
        throw new Error('E_CONNECT failed')
      } else if (Date.now() - firstFetch < returnUrlAnswerAfterMs) {
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
      returnUrlAnswerAfterMs = 5000
      job.startCommandTimeout = 5000
      await expect(start(job)).rejects.toThrowError(/Start command failed with exit code/)
    })

    it('times out after expected limit and fails', async () => {
      returnUrlAnswerAfterMs = 5000
      job.startCommandTimeout = 500
      await expect(start(job)).rejects.toThrowError(/Timeout while waiting for/)
    })

    it('times out after expected limit and fails (wrong URL)', async () => {
      job.startCommandTimeout = 1000
      job.startWaitUrl = INVALID_URL
      await expect(start(job)).rejects.toThrowError(/Timeout while waiting for/)
    })
  })

  it('stops the command by killing all children processes (win32)', async () => {
    jest.mocked(os.platform).mockImplementation(() => 'win32')
    let taskkilled = false
    mockChildProcess({
      api: 'exec',
      scriptPath: 'taskkill',
      exec: () => { taskkilled = true }
    })
    const started = await start(job)
    job.startTimeout = 1000
    await started.stop()
    expect(process.kill).not.toHaveBeenCalled()
    expect(taskkilled).toStrictEqual(true)
  })

  it('stops the command by killing all children processes (!win32)', async () => {
    jest.mocked(os.platform).mockImplementation(() => 'linux')
    const started = await start(job)
    job.startTimeout = 1000
    await started.stop()
    expect(process.kill).toHaveBeenCalledWith(childProcessInstance.pid)
  })
})
