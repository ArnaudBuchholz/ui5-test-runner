const { dirname, join } = require('path')
const jobFactory = require('./job')
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

const cwd = join(__dirname, '../test/project')

function createJob (parameters) {
  const args = []
  Object.keys(parameters).forEach(name => {
    if (name === '--') {
      return
    }
    const value = parameters[name]
    args.push(`-${name}`)
    if (value !== null) {
      if (Array.isArray(value)) {
        args.push(...value)
      } else {
        args.push(value)
      }
    }
  })
  if (parameters['--']) {
    args.push('--', ...parameters['--'])
  }
  return jobFactory.fromCmdLine(cwd, args.map(value => value.toString()))
}

describe('job', () => {
  describe('parameter parsing', () => {
    it('provides default values', () => {
      const job = createJob({})
      expect(job.cwd).toStrictEqual(cwd)
      expect(job.port).toStrictEqual(0)
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
      expect(job.browser.startsWith(dirname(dirname(__dirname)))).toStrictEqual(true)
      expect(normalizePath(job.browser).endsWith('defaults/puppeteer.js')).toStrictEqual(true)
      expect(normalizePath(job.webapp).endsWith('/test/project/webapp')).toStrictEqual(true)
      expect(job.keepAlive).toStrictEqual(false)
    })

    it('parses parameters', () => {
      const job = createJob({
        cwd: '../project2',
        port: 8080,
        keepAlive: true
      })
      expect(normalizePath(job.cwd).endsWith('/test/project2')).toStrictEqual(true)
      expect(job.port).toStrictEqual(8080)
      expect(job.keepAlive).toStrictEqual(true)
      expect(normalizePath(job.webapp).endsWith('/test/project2/webapp')).toStrictEqual(true)
    })

    describe('complex parameter parsing', () => {
      it('implements boolean flag', () => {
        const job = createJob({
          cwd: '../project2',
          port: 8080,
          keepAlive: false,
          coverage: null
        })
        expect(job.keepAlive).toStrictEqual(false)
        expect(job.coverage).toStrictEqual(true)
      })

      describe('multi values', () => {
        const absoluteLibPath = join(__dirname, '../test/project/webapp/lib')
        describe.only('lib', () => {
          it('accepts one library', () => {
            const job = createJob({
              libs: [absoluteLibPath]
            })
            expect(job.libs).toMatchObject([{
              relative: '',
              source: absoluteLibPath
            }])
          })

          it('accepts two libraries', () => {
            const project2Path = join(__dirname, '../test/project2')
            const job = createJob({
              libs: [absoluteLibPath, 'project2/=../project2']
            })
            expect(job.libs).toMatchObject([{
              relative: '',
              source: absoluteLibPath
            }, {
              relative: 'project2/',
              source: project2Path
            }])
          })
        })
      })
    })
    // it('supports complex parameter parsing')
  })

  describe('validation', () => {
    it('fails on negative integers', () => {
      expect(() => createJob({
        port: -1
      })).toThrow()
    })
  })

  describe('post processing', () => {
    it('sets keepAlive when parallel = 0', () => {
      const job = jobFactory.fromCmdLine(cwd, ['-parallel:0'])
      expect(job.keepAlive).toStrictEqual(true)
    })
  
    it('sets keepAlive when parallel < 0', () => {
      const job = jobFactory.fromCmdLine(cwd, ['-parallel:-1'])
      expect(job.keepAlive).toStrictEqual(true)
    })
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
    const job = jobFactory.fromCmdLine(cwd, ['-libs:custom/lib/=webapp/lib', '-libs:project2/=../project2'])
    expect(job.libs.length).toStrictEqual(2)
    expect(job.libs[0].relative).toStrictEqual('custom/lib/')
    expect(normalizePath(job.libs[0].source).endsWith('test/project/webapp/lib')).toStrictEqual(true)
    expect(job.libs[1].relative).toStrictEqual('project2/')
    expect(normalizePath(job.libs[1].source).endsWith('test/project2')).toStrictEqual(true)
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
    it('preloads settings', () => {
      const job = jobFactory.fromCmdLine(cwd, ['-globalTimeout:900000'])
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(900000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'lib/',
        source: join(cwd, 'webapp/lib')
      }])
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    })
    it('preloads and overrides command line settings from ui5-test-runner.json', () => {
      const job = jobFactory.fromCmdLine(cwd, ['-pageTimeout:60000', '-libs:project2/=../project2'])
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(3600000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'project2/',
        source: join(cwd, '../project2')
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
