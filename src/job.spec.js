const { dirname, join } = require('path')
const jobFactory = require('./job')
const cwd = join(__dirname, '../test/project')
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

describe('job', () => {
  it('provides default values', () => {
    const job = jobFactory.fromCmdLine(cwd, [])
    expect(job.cwd).toStrictEqual(cwd)
    expect(job.port).toStrictEqual(0)
    expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    expect(job.browser.startsWith(dirname(dirname(__dirname)))).toStrictEqual(true)
    expect(normalizePath(job.browser).endsWith('defaults/puppeteer.js')).toStrictEqual(true)
    expect(normalizePath(job.webapp).endsWith('/test/project/webapp')).toStrictEqual(true)
    expect(job.keepAlive).toStrictEqual(false)
  })

  it('parses parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-cwd:../project2', '-port:8080', '-keepAlive:true'])
    expect(normalizePath(job.cwd).endsWith('/test/project2')).toStrictEqual(true)
    expect(job.port).toStrictEqual(8080)
    expect(job.keepAlive).toStrictEqual(true)
    expect(normalizePath(job.webapp).endsWith('/test/project2/webapp')).toStrictEqual(true)
  })

  it('implements boolean switch', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-cwd:../project2', '-port:8080', '-keepAlive'])
    expect(job.keepAlive).toStrictEqual(true)
  })

  it('ignores unknown parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-cwd2:../project2'])
    expect(normalizePath(job.cwd).endsWith('/test/project')).toStrictEqual(true)
  })

  it('sets keepAlive when parallel = 0', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-parallel:0'])
    expect(job.keepAlive).toStrictEqual(true)
  })

  it('sets keepAlive when parallel < 0', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-parallel:-1'])
    expect(job.keepAlive).toStrictEqual(true)
  })

  it('supports libs parameter (absolute)', () => {
    const absoluteLibPath = join(__dirname, '../test/project/webapp/lib')
    const job = jobFactory.fromCmdLine(cwd, [`-libs:${absoluteLibPath}`])
    expect(job.libs.length).toStrictEqual(1)
    expect(job.libs[0].relative).toStrictEqual('')
    expect(job.libs[0].source).toStrictEqual(absoluteLibPath)
  })

  it('supports multiple libs parameter (relative)', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-libs:webapp/lib', '-libs:../project2'])
    expect(job.libs.length).toStrictEqual(2)
    expect(job.libs[0].relative).toStrictEqual('')
    expect(normalizePath(job.libs[0].source).endsWith('test/project/webapp/lib')).toStrictEqual(true)
    expect(job.libs[1].relative).toStrictEqual('')
    expect(normalizePath(job.libs[1].source).endsWith('test/project2')).toStrictEqual(true)
  })

  it('supports complex libs parameter', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-libs:abs/=/any_path', '-libs:rel/=rel_path'])
    expect(job.libs.length).toStrictEqual(2)
    expect(job.libs[0].relative).toStrictEqual('abs/')
    expect(job.libs[0].source).toStrictEqual('/any_path')
    expect(job.libs[1].relative).toStrictEqual('rel/')
    expect(normalizePath(job.libs[1].source)).toStrictEqual('/test/project/rel_path')
  })

  it('ignores malformed parameters', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-ui5=abc'])
    expect(job.ui5).toStrictEqual('https://ui5.sap.com')
  })

  it('allows passing parameters to the browser instantiation command line', () => {
    const job = jobFactory.fromCmdLine(cwd, ['--', '--visible'])
    expect(job.browserArgs).toEqual(['--visible'])
  })

  it('fixes invalid browserRetry value', () => {
    const job = jobFactory.fromCmdLine(cwd, ['-browserRetry: -1'])
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
      const job = jobFactory.fromCmdLine(cwd, ['-globalTimeout:900000'])
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
      const job = jobFactory.fromCmdLine(cwd, ['-pageTimeout:60000', '-libs:c=d'])
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
      expect(() => jobFactory.fromCmdLine(cwd, ['-webapp:$NOT_EXISTING$'])).toThrow()
    })

    it('browser', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, ['-browser:$NOT_EXISTING$/cmd.js'])).toThrow()
    })

    it('testsuite', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, ['-testsuite:$NOT_EXISTING$/testsuite.html'])).toThrow()
    })

    it('lib', () => {
      const cwd = join(__dirname, '../cwd')
      expect(() => jobFactory.fromCmdLine(cwd, ['-libs:c=$NOT_EXISTING$/c'])).toThrow()
    })
  })
})
