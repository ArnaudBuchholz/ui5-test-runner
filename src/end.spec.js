const { mock: mockChildProcess } = require('child_process')
const { end } = require('./end')

describe('src/end', () => {
  let job

  beforeEach(() => {
    job = {
      cwd: '/cwd',
      reportDir: '/report',
      endTimeout: 5000,
      end: 'end.js'
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
    job.end = 'end.js a b c'
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
})
