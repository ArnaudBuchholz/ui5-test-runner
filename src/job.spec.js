const { dirname, join } = require('path')
const jobFactory = require('./job')
const cwd = '/test/project'
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

describe('job', () => {
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
    expect(job.browserArgs).toEqual(['--visible'])
  })

  it('fixes invalid browserRetry value', () => {
    const job = jobFactory.fromCmdLine(cwd, [0, 0, '-browserRetry: -1'])
    expect(job.browserRetry).toStrictEqual(1)
  })

  describe('Using ui5-test-runner.json', () => {
    const content = `{
      "!pageTimeout": 900000,
      "globalTimeout": 3600000,
      "failFast": true,
      "libs": [{
        "relative": "a",
        "source": "b"
      }]
    }`

    it('preloads settings', () => {
      const cwd = join(__dirname, '../cwd')
      const job = jobFactory.fromCmdLine(cwd, [0, 0, '-globalTimeout:900000'])
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(900000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'a',
        source: join(cwd, 'b')
      }])
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    })
    it('preloads and overrides command line settings from ui5-test-runner.json', () => {
      const cwd = join(__dirname, '../cwd')
      const job = jobFactory.fromCmdLine(cwd, [0, 0, '-pageTimeout:60000', '-libs:c=d'])
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(3600000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'c',
        source: join(cwd, 'd')
      }])
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    })
  })

  describe('Path parameters validation', () => {
    it('webapp', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, [0, 0, '-webapp:$NOT_EXISTING$'])).toThrow()
    })

    it('browser', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, [0, 0, '-browser:$NOT_EXISTING$/cmd.js'])).toThrow()
    })

    it('testsuite', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, [0, 0, '-testsuite:$NOT_EXISTING$/testsuite.html'])).toThrow()
    })

    it('lib', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, [0, 0, '-libs:c=$NOT_EXISTING$/c'])).toThrow()
    })
  })
})
