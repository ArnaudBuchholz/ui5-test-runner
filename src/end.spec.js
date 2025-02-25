const { mock: mockChildProcess } = require('child_process')
const { end } = require('./end')

describe('src/end', () => {
  let job

  beforeEach(() => {
    job = {
      cwd: '/cwd',
      reportDir: '/report',
      endTimeout: 5000,
      endScript: 'end.js'
    }
  })

  it('runs end command and pass job.js', async () => {
    let childProcessArgs
    mockChildProcess({
      api: 'fork',
      scriptPath: 'end.js',
      exec: (childProcess) => {
        childProcessArgs = childProcess.args
        childProcess.close()
      },
      close: false
    })
    await end(job)
    expect(childProcessArgs.map(normalizePath)).toStrictEqual([
      '/report/job.js'
    ])
  })

  it('runs end command and pass all parameters as well as job.js', async () => {
    job.endScript = 'end.js a b c'
    let childProcessArgs
    mockChildProcess({
      api: 'fork',
      scriptPath: 'end.js',
      exec: (childProcess) => {
        childProcessArgs = childProcess.args
        childProcess.close()
      },
      close: false
    })
    await end(job)
    expect(childProcessArgs.map(normalizePath)).toStrictEqual([
      'a',
      'b',
      'c',
      '/report/job.js'
    ])
  })

  it('fails with timeout if the script takes longer', async () => {
    job.endTimeout = 500
    let childProcessInstance
    mockChildProcess({
      api: 'fork',
      scriptPath: 'end.js',
      exec: (childProcess) => {
        childProcessInstance = childProcess
      },
      close: false
    })
    await expect(end(job)).rejects.toThrowError('Timeout while waiting for end script')
    expect(childProcessInstance.killed)
  })

  it('waits for the script indefinitely', async () => {
    job.endTimeout = 0
    let childProcessInstance
    mockChildProcess({
      api: 'fork',
      scriptPath: 'end.js',
      exec: (childProcess) => {
        childProcessInstance = childProcess
        childProcess.close()
      },
      close: false
    })
    await end(job)
    expect(!childProcessInstance.killed)
  })
})
