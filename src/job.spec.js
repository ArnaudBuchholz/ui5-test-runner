const { dirname, join } = require('path')
const jobFactory = require('./job')
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix

const cwd = join(__dirname, '../test/project')

function buildArgs (parameters) {
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
  return args.map(value => value.toString())
}

function buildJob (parameters) {
  return jobFactory.fromCmdLine(cwd, buildArgs(parameters))
}

describe('job', () => {
  describe('testing helper (buildArgs)', () => {
    it('translates object into list of arguments', () => {
      expect(buildArgs({
        a: 1,
        b: true,
        c: 'string',
        d: [1, true, 'string'],
        '--': [1, true, 'string']
      })).toEqual(['-a', '1', '-b', 'true', '-c', 'string', '-d', '1', 'true', 'string', '--', '1', 'true', 'string'])
    })
  })

  describe('parameter parsing', () => {
    it('provides default values', () => {
      const job = buildJob({})
      expect(job.cwd).toStrictEqual(cwd)
      expect(job.port).toStrictEqual(0)
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
      expect(job.browser.startsWith(dirname(dirname(__dirname)))).toStrictEqual(true)
      expect(normalizePath(job.browser).endsWith('defaults/puppeteer.js')).toStrictEqual(true)
      expect(normalizePath(job.webapp).endsWith('/test/project/webapp')).toStrictEqual(true)
      expect(job.keepAlive).toStrictEqual(false)
    })

    it('parses parameters', () => {
      const job = buildJob({
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
        const job = buildJob({
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
        describe('libs', () => {
          it('accepts one library', () => {
            const job = buildJob({
              libs: [absoluteLibPath]
            })
            expect(job.libs).toMatchObject([{
              relative: '',
              source: absoluteLibPath
            }])
          })

          it('accepts two libraries', () => {
            const project2Path = join(__dirname, '../test/project2')
            const job = buildJob({
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

        describe('browser parameters', () => {
          it('allows passing extra parameter', () => {
            const job = buildJob({
              '--': ['--visible']
            })
            expect(job.browserArgs).toEqual(['--visible'])
          })

          it('allows passing extra parameters', () => {
            const job = buildJob({
              '--': ['--visible', '--verbose']
            })
            expect(job.browserArgs).toEqual(['--visible', '--verbose'])
          })
        })
      })
    })
  })

  describe('validation', () => {
    it('fails on negative integers', () => {
      expect(() => buildJob({
        port: -1
      })).toThrow()
    })

    describe('Path parameters validation', () => {
      const parameters = ['webapp', 'browser', 'testsuite']

      parameters.forEach(parameter => {
        it(`fails on invalid path for ${parameter}`, () => {
          expect(() => buildJob({ [parameter]: 'nope' })).toThrow()
        })
      })
    })

    describe('libs', () => {
      it('fails on invalid lib path (absolute)', () => {
        const absoluteLibPath = join(__dirname, '../test/project/webapp/lib2')
        expect(() => buildJob({
          libs: absoluteLibPath
        })).toThrow()
      })

      it('fails on invalid lib path (relative)', () => {
        expect(() => buildJob({
          libs: '../project3'
        })).toThrow()
      })
    })
  })

  describe('post processing', () => {
    it('sets keepAlive when parallel = 0', () => {
      const job = buildJob({
        parallel: 0
      })
      expect(job.keepAlive).toStrictEqual(true)
    })
  })

  describe.only('Using ui5-test-runner.json', () => {
    const project2 = join(__dirname, '../test/project2')

    it('preloads settings', () => {
      const job = buildJob({
        cwd: project2,
        globalTimeout: 900000
      })
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(900000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'lib/',
        source: join(project2, 'webapp')
      }])
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    })

    it('preloads and overrides command line settings', () => {
      const job = buildJob({
        cwd: project2,
        pageTimeout: 60000,
        globalTimeout: 900000,
        libs: 'project2/=../project2'
      })
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
})
