const { dirname, join } = require('path')
const { fromObject, fromCmdLine } = require('./job')
const { $valueSources } = require('./symbols')
const { UTRError } = require('./error')

const cwd = join(__dirname, '../test/project')

function buildJob (parameters) {
  return fromObject(cwd, parameters)
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
      expect(job.screenshot).toStrictEqual(true)
      expect(job.screenshotOnFailure).toStrictEqual(true)
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
          keepAlive: false,
          coverage: null,
          logServer: null
        })
        expect(job.keepAlive).toStrictEqual(false)
        expect(job.coverage).toStrictEqual(true)
        expect(job.logServer).toStrictEqual(true)
      })

      it('implements boolean switch off', () => {
        const job = buildJob({
          noCoverage: null,
          noScreenshot: null
        })
        expect(job.coverage).toStrictEqual(false)
        expect(job.screenshot).toStrictEqual(false)
      })

      it('strips out last path separator (required for reserve to match paths)', () => {
        const job = buildJob({
          cwd,
          webapp: 'webapp/'
        })
        expect(normalizePath(job.webapp).endsWith('/test/project/webapp')).toStrictEqual(true)
      })

      it('url disables coverage by default', () => {
        const job = buildJob({
          url: 'http://localhost:8080'
        })
        expect(job.url).toStrictEqual(['http://localhost:8080'])
        expect(job.coverage).toStrictEqual(false)
      })

      it('url still allows coverage', () => {
        const job = buildJob({
          url: 'http://localhost:8080',
          coverage: true
        })
        expect(job.url).toStrictEqual(['http://localhost:8080'])
        expect(job.coverage).toStrictEqual(true)
      })

      describe('multi values', () => {
        const absoluteLibPath = join(__dirname, '../test/project/webapp/lib')

        describe('url', () => {
          it('accepts multiple urls', () => {
            const job = buildJob({
              url: [
                'http://localhost:8080/page1.html',
                'http://localhost:8080/page2.html'
              ]
            })
            expect(job.url).toMatchObject([
              'http://localhost:8080/page1.html',
              'http://localhost:8080/page2.html'
            ])
          })
        })

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

        describe('env', () => {
          it('defaults when not set', () => {
            const job = buildJob({})
            expect(job.env).toMatchObject({})
          })

          it('accepts one environment variable', () => {
            const job = buildJob({
              env: ['TZ=UTC']
            })
            expect(job.env).toMatchObject({
              TZ: 'UTC'
            })
          })

          it('accepts two environment variables', () => {
            const job = buildJob({
              env: ['TZ=UTC', 'DEBUG=true']
            })
            expect(job.env).toMatchObject({
              TZ: 'UTC',
              DEBUG: 'true'
            })
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

      describe('parameters using $/', () => {
        const job = buildJob({
          cwd,
          browser: '$/selenium-webdriver.js'
        })
        expect(job.browser).toStrictEqual(join(__dirname, './defaults/selenium-webdriver.js'))
        expect(job.coverageSettings).toStrictEqual(join(__dirname, './defaults/.nycrc.json'))
        expect(job.reportGenerator).toEqual([join(__dirname, './defaults/report.js')])
      })

      describe('custom mappings', () => {
        it('offers custom mappings', () => {
          const job = buildJob({
            cwd,
            mappings: [
              '^/otherlib/(.+)=file(./otherfolder/otherlib/$1)',
              '^/ui/oDataService/v1/odata/v4/ServiceName/(.+)=url(http://localhost:18082/odata/v4/ServiceName/$1)'
            ]
          })
          expect(job.mappings).toEqual([
            {
              match: '^/otherlib/(.+)',
              file: './otherfolder/otherlib/$1'
            }, {
              match: '^/ui/oDataService/v1/odata/v4/ServiceName/(.+)',
              url: 'http://localhost:18082/odata/v4/ServiceName/$1'
            }
          ])
        })

        it('rejects invalid mapping', () => {
          expect(() => buildJob({
            cwd,
            mappings: [
              '^/otherlib/(.+)=custom(./otherfolder/otherlib/$1)'
            ]
          })).toThrowError()
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

    it('supports parameters for testsuite (stripping ?)', () => {
      expect(() => buildJob({
        testsuite: 'test/testsuite.qunit.html?a=b'
      })).not.toThrow()
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

    it('url forbids the use of ui5', () => {
      expect(() => buildJob({
        ui5: 'https://ui5.sap.com',
        url: 'http://localhost:8080'
      })).toThrow(UTRError.MODE_INCOMPATIBLE_OPTION('ui5'))
    })
  })

  describe('Using configuration files', () => {
    const project2 = join(__dirname, '../test/project2')

    describe('defaulting to ui5-test-runner.json', () => {
      it('enables option overriding at the command level', () => {
        const job = fromCmdLine(cwd, [
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
          coverage: true,
          screenshot: true,
          libs: 'project2/=../project2'
        })
        expect(job.pageTimeout).toStrictEqual(900000)
        expect(job.globalTimeout).toStrictEqual(900000)
        expect(job.coverage).toStrictEqual(false)
        expect(job.screenshot).toStrictEqual(false)
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

    describe('using --config', () => {
      it('preloads settings from any configuration file', () => {
        const job = buildJob({
          cwd: project2,
          config: join(__dirname, '../test/e2e/JS_REMOTE.json')
        })
        // Not extracting from ui5-test-runner in project2
        expect(job.failFast).toStrictEqual(false)
        expect(job.libs).toStrictEqual([])
        // But from JS_REMOTE.json
        expect(job.url).toEqual(['http://localhost:8080/test/testsuite.qunit.html'])
      })

      it('sets job.cwd relatively to the configuration file when it contains cwd', () => {
        const job = buildJob({
          config: join(__dirname, '../test/e2e/JS_LEGACY.json')
        })
        expect(job.cwd).toStrictEqual(join(__dirname, '../test/sample.js'))
      })

      it('does not override job.cwd if provided on the command line', () => {
        const job = buildJob({
          cwd: project2,
          config: join(__dirname, '../test/e2e/JS_LEGACY.json')
        })
        expect(job.cwd).toStrictEqual(project2)
      })

      it('fails if specified and it does not exist (relative)', () => {
        expect(() => buildJob({
          cwd: project2,
          config: 'unknown.json'
        })).toThrowError()
      })

      it('fails if specified and it does not exist (absolute)', () => {
        expect(() => buildJob({
          cwd: project2,
          config: join(__dirname, '../test/e2e/unknown.json')
        })).toThrowError()
      })
    })
  })

  describe('mode', () => {
    it('returns legacy by default', () => {
      expect(fromObject(cwd, {}).mode).toStrictEqual('legacy')
    })

    describe('url', () => {
      it('enables testing external projects', () => {
        expect(fromObject(cwd, {
          url: ['http://myserver.remote.url/ui5-app.html']
        }).mode).toStrictEqual('url')
      })

      // Assuming url could be  used to access 'local' server, most options are supported

      describe('incompatible options', () => {
        const incompatible = {
          testsuite: '../project2'
        }

        Object.keys(incompatible).forEach(option => {
          it(`is incompatible with ${option}`, () => {
            expect(() => fromObject(cwd, {
              url: ['http://myserver.remote.url/ui5-app.html'],
              [option]: incompatible[option]
            })).toThrow(UTRError.MODE_INCOMPATIBLE_OPTION(option))
          })
        })
      })
    })

    describe('capabilities', () => {
      it('triggers the capabilities tester', () => {
        expect(fromObject(cwd, {
          capabilities: true
        }).mode).toStrictEqual('capabilities')
      })

      it('supports cwd, port, logServer, browser, parallel, reportDir, pageTimeout, browserCloseTimeout, failFast and keepAlive', () => {
        expect(fromObject('.', {
          capabilities: true,
          cwd,
          port: 8080,
          logServer: true,
          browser: '$/selenium-webdriver.js',
          parallel: 2,
          reportDir: join(cwd, '.report'),
          pageTimeout: 1000,
          browserCloseTimeout: 1000,
          failFast: true,
          keepAlive: true
        }).mode).toStrictEqual('capabilities')
      })

      describe('incompatible options', () => {
        const incompatible = {
          libs: '../project2',
          ui5: 'http://localhost:8088/ui5',
          cache: join(cwd, '.cache'),
          webapp: 'webapp',
          testsuite: 'test/testsuite.qunit.html',
          pageFilter: '.*',
          pageParams: 'sap-ui-debug=true',
          coverage: true,
          coverageSettings: '$/.nycrc.json',
          coverageTempDir: '.nyc_output',
          coverageReportDir: 'coverage',
          coverageReporters: 'lcov',
          globalTimeout: 1000
        }

        Object.keys(incompatible).forEach(option => {
          it(`is incompatible with ${option}`, () => {
            expect(() => fromObject(cwd, {
              capabilities: true,
              [option]: incompatible[option]
            })).toThrow(UTRError.MODE_INCOMPATIBLE_OPTION(option))
          })
        })
      })
    })
  })
})
