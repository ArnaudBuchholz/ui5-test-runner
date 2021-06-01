const { dirname } = require('path')

const jobFactory = require('../../src/job')
const cwd = '/test/project'
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

describe('src/job', () => {
  it('provides default values', () => {
    const job = jobFactory.fromCmdLine(cwd, [])
    expect(normalizePath(job.cwd)).toStrictEqual(cwd)
    expect(job.port).toStrictEqual(0)
    expect(job.ui5).toStrictEqual('https://ui5.sap.com/1.87.0')
    expect(job.browser.startsWith(dirname(dirname(__dirname)))).toStrictEqual(true)
    expect(normalizePath(job.browser).endsWith('defaults/chromium.js')).toStrictEqual(true)
    expect(normalizePath(job.webapp)).toStrictEqual('/test/project/webapp')
    expect(job.keepAlive).toStrictEqual(false)
  })

  it('parses parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-cwd:../project2', '-port:8080', '-keepAlive:true'])
    expect(normalizePath(job.cwd)).toStrictEqual('/test/project2')
    expect(job.port).toStrictEqual(8080)
    expect(job.keepAlive).toStrictEqual(true)
    expect(normalizePath(job.webapp)).toStrictEqual('/test/project2/webapp')
  })

  it('implements boolean switch', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-cwd:../project2', '-port:8080', '-keepAlive'])
    expect(job.keepAlive).toStrictEqual(true)
  })

  it('ignores unknown parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-cwd2:../project2'])
    expect(normalizePath(job.cwd)).toStrictEqual('/test/project')
  })

  it('sets keepAlive when parallel = 0', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-parallel:0'])
    expect(job.keepAlive).toStrictEqual(true)
  })

  it('sets keepAlive when parallel < 0', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-parallel:-1'])
    expect(job.keepAlive).toStrictEqual(true)
  })
})
