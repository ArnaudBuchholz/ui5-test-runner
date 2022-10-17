const { dirname, join } = require('path')
const jobFactory = require('./job')
const normalizePath = path => path.replace(/\\/g, '/') // win -> unix
const { $valueSources } = require('./symbols')

const cwd = join(__dirname, '../test/project')

function buildJob (parameters) {
  return jobFactory.fromObject(cwd, parameters)
}

describe('job', () => {
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
      expect(job[$valueSources]).toMatchObject({
        cwd: 'default',
        port: 'default',
        ui5: 'default',
        browser: 'default'
      })
    })

    it('parses parameters', () => {
      const job = buildJob({
        cwd: '../project2',
        port: 8080,
        keepAlive: null,
        ui5: 'http://localhost:8088/ui5'
      })
      expect(normalizePath(job.cwd).endsWith('/test/project2')).toStrictEqual(true)
      expect(job.port).toStrictEqual(8080)
      expect(job.keepAlive).toStrictEqual(true)
      expect(job.ui5).toStrictEqual('http://localhost:8088/ui5')
      expect(normalizePath(job.webapp).endsWith('/test/project2/webapp')).toStrictEqual(true)
      expect(job[$valueSources]).toMatchObject({
        cwd: 'cli',
        port: 'cli',
        keepAlive: 'cli',
        ui5: 'cli',
        browser: 'default'
      })
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

      describe('-url disables webapp & testsuite checking', () => {
        const job = buildJob({
          testsuite: 'not_a_file',
          webapp: 'not_a_folder',
          url: 'http://localhost:8080'
        })
        expect(job.url).toStrictEqual('http://localhost:8080')
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

      describe('parameters using @/', () => {
        const job = buildJob({
          cwd,
          browser: '@/selenium-webdriver.js'
        })
        expect(job.browser).toStrictEqual(join(__dirname, '../defaults/selenium-webdriver.js'))
        expect(job.coverageSettings).toStrictEqual(join(__dirname, '../defaults/nyc.json'))
        expect(job.reportGenerator).toEqual([join(__dirname, '../defaults/report.js')])
      })
    })
  })

  describe('validation', () => {
    it('fails on negative integers', () => {
      expect(() => buildJob({
        port: -1
      })).toThrow()
    })

    it('fails on invalid URL', () => {
      expect(() => buildJob({
        ui5: 'not_an_url'
      })).toThrow()
    })

    it('fails on a missing file (does not exist)', () => {
      expect(() => buildJob({
        testsuite: 'not_a_file'
      })).toThrow()
    })

    it('fails on a missing file (points to a folder)', () => {
      expect(() => buildJob({
        testsuite: 'lib'
      })).toThrow()
    })

    it('fails on a missing folder (does not exist)', () => {
      expect(() => buildJob({
        webapp: 'not_a_folder'
      })).toThrow()
    })

    it('fails on a missing folder (points to a file)', () => {
      expect(() => buildJob({
        webapp: 'webapp/lib/README.md'
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

  describe('Using ui5-test-runner.json', () => {
    const project2 = join(__dirname, '../test/project2')

    it('enables option overriding at the command level', () => {
      const job = jobFactory.fromCmdLine(cwd, [
        '--port', '1',
        '--port', '2',
        '-k', 'true',
        '-k', 'false'
      ])
      expect(job.port).toStrictEqual(2)
      expect(job.keepAlive).toStrictEqual(false)
    })

    it('preload settings', () => {
      const job = buildJob({
        cwd: project2
      })
      expect(job.pageTimeout).toStrictEqual(900000)
      expect(job.globalTimeout).toStrictEqual(3600000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'lib/',
        source: join(project2, 'webapp')
      }])
      expect(job.browserArgs).toEqual(['-1'])
    })

    it('allows command line override', () => {
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
      expect(job.globalTimeout).toStrictEqual(900000)
      expect(job.failFast).toStrictEqual(true)
      expect(job.libs).toEqual([{
        relative: 'lib/',
        source: join(project2, 'webapp')
      }, {
        relative: 'project2/',
        source: join(cwd, '../project2')
      }])
      expect(job.ui5).toStrictEqual('https://ui5.sap.com')
    })

    it('preloads and concatenates browser settings', () => {
      const job = buildJob({
        cwd: project2,
        '--': [-2]
      })
      expect(job.browserArgs).toEqual(['-1', '-2'])
    })
  })
})
