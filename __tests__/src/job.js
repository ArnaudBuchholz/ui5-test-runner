const { dirname } = require('path')

const jobFactory = require('../../src/job')
const cwd = '/test/project'
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

describe('src/job', () => {
  let error

  beforeAll(() => {
    error = jest.spyOn(console, 'error').mockImplementation()
  })

  it('provides default values', () => {
    const job = jobFactory.fromCmdLine(cwd, [])
    expect(normalizePath(job.cwd)).toStrictEqual(cwd)
    expect(job.port).toStrictEqual(0)
    expect(job.ui5).toStrictEqual('https://ui5.sap.com')
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

  it('supports libs parameter', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-libs:/any_path'])
    expect(job.libs.length).toStrictEqual(1)
    expect(job.libs[0].relative).toStrictEqual('')
    expect(job.libs[0].source).toStrictEqual('/any_path')
  })

  it('supports multiple libs parameter', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-libs:/any_path', '-libs:rel_path'])
    expect(job.libs.length).toStrictEqual(2)
    expect(job.libs[0].relative).toStrictEqual('')
    expect(job.libs[0].source).toStrictEqual('/any_path')
    expect(job.libs[1].relative).toStrictEqual('')
    expect(normalizePath(job.libs[1].source)).toStrictEqual('/test/project/rel_path')
  })

  it('supports complex libs parameter', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-libs:abs/=/any_path', '-libs:rel/=rel_path'])
    expect(job.libs.length).toStrictEqual(2)
    expect(job.libs[0].relative).toStrictEqual('abs/')
    expect(job.libs[0].source).toStrictEqual('/any_path')
    expect(job.libs[1].relative).toStrictEqual('rel/')
    expect(normalizePath(job.libs[1].source)).toStrictEqual('/test/project/rel_path')
  })

  it('ignores malformed parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-ui5=abc'])
    expect(job.ui5).toStrictEqual('https://ui5.sap.com')
  })

  it('allows passing parameters to the browser instantiation command line', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '--', '--visible'])
    expect(job.args).toStrictEqual('__URL__ __REPORT__ --visible')
  })

  it('fixes invalid browserRetry value', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation()
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-browserRetry: -1'])
    expect(job.browserRetry).toStrictEqual(1)
    expect(warn.mock.calls.length).toStrictEqual(1)
    warn.mockRestore()
  })

  afterAll(() => {
    error.mockRestore()
  })
})
