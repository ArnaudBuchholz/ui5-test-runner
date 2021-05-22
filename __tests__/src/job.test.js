const { dirname, join } = require('path')

const jobPath = '../../src/job.js'
const cwdPath = '/test/project'
const cwd = () => cwdPath
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

describe('src/job', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('provides default values', () => {
    global.process = { cwd, argv: [] }
    const job = require(jobPath)
    expect(normalizePath(job.cwd)).toStrictEqual(cwdPath)
    expect(job.port).toStrictEqual(0)
    expect(job.ui5).toStrictEqual('https://ui5.sap.com/1.87.0')
    expect(job.browser.startsWith(dirname(dirname(__dirname)))).toStrictEqual(true)
    expect(normalizePath(job.browser).endsWith('defaults/chromium.js')).toStrictEqual(true)
    expect(normalizePath(job.webapp)).toStrictEqual('/test/project/webapp')
    expect(job.keepAlive).toStrictEqual(false)
  })

  it('parses parameters', () => {
    global.process = { cwd, argv: ['node', 'ui5-test-runner', '-cwd:../project2', '-port:8080', '-keepAlive:true'] }
    const job = require(jobPath)
    expect(normalizePath(job.cwd)).toStrictEqual('/test/project2')
    expect(job.port).toStrictEqual(8080)
    expect(job.keepAlive).toStrictEqual(true)
    expect(normalizePath(job.webapp)).toStrictEqual('/test/project2/webapp')
  })

  it('ignores unknown parameters', () => {
    global.process = { cwd, argv: ['node', 'ui5-test-runner', '-cwd2:../project2'] }
    const job = require(jobPath)
    expect(normalizePath(job.cwd)).toStrictEqual('/test/project')
  })

  afterAll(() => {
    delete global.process
  })
})