module.exports = {
  initialCwd: '/home/user1/dev/ui5-test-runner/test/project',
  browserArgs: [],
  cwd: '/home/user1/dev/ui5-test-runner/test/project',
  config: 'ui5-test-runner.json',
  port: 0,
  reportDir: '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/report',
  pageTimeout: 250,
  failFast: false,
  failOpaFast: false,
  keepAlive: false,
  logServer: false,
  parallel: 1,
  browser: '/home/user1/dev/ui5-test-runner/src/defaults/puppeteer.js',
  npmInstall: true,
  browserCloseTimeout: 2000,
  browserRetry: 1,
  outputInterval: 30000,
  offline: false,
  localhost: 'localhost',
  ci: false,
  deepProbe: false,
  probeParallel: 0,
  webapp: '/home/user1/dev/ui5-test-runner/test/project/webapp',
  pageCloseTimeout: 250,
  globalTimeout: 0,
  screenshot: true,
  screenshotOnFailure: true,
  screenshotTimeout: 5000,
  splitOpa: false,
  reportGenerator: [
    '/home/user1/dev/ui5-test-runner/src/defaults/report.js'
  ],
  progressPage: '/home/user1/dev/ui5-test-runner/src/defaults/report/default.html',
  qunitBatchSize: 0,
  coverageSettings: '/home/user1/dev/ui5-test-runner/src/defaults/.nycrc.json',
  coverageTempDir: '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/coverage/temp',
  coverageReportDir: '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/coverage/report',
  coverageReporters: [
    'lcov',
    'cobertura'
  ],
  coverageCheckBranches: 0,
  coverageCheckFunctions: 0,
  coverageCheckLines: 0,
  coverageCheckStatements: 0,
  coverageRemoteScanner: '/home/user1/dev/ui5-test-runner/src/defaults/scan-ui5.js',
  serveOnly: false,
  watch: false,
  startWaitMethod: 'GET',
  startTimeout: 5000,
  endTimeout: 15000,
  ui5: 'https://ui5.sap.com',
  disableUi5: false,
  testsuite: 'test/testsuite.qunit.html',
  coverageProxy: false,
  coverageProxyInclude: '.*',
  coverageProxyExclude: '/((test-)?resources|tests?)/',
  coverage: false,
  configContent: 'none',
  cmdLineArgs: [
    '--report-dir',
    '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/report',
    '--coverage-temp-dir',
    '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/coverage/temp',
    '--coverage-report-dir',
    '/home/user1/dev/ui5-test-runner/tmp/simulate/page-timeout/coverage/report',
    '--coverage',
    'false',
    '--parallel',
    '1',
    '--page-timeout',
    '250'
  ],
  mode: 'legacy',
  libs: [],
  env: {},
  browserCapabilities: {
    modules: [],
    screenshot: null,
    scripts: true,
    parallel: true,
    traces: [],
    console: true
  },
  browserModules: {},
  url: [
    'http://localhost:0/test/testsuite.qunit.html'
  ],
  start: '2025-11-12T15:19:23.094Z',
  failed: true,
  testPageUrls: [
    'http://localhost:0/page1.html'
  ],
  qunitPages: {
    'http://localhost:0/page1.html': {
      id: 'C2FfERHrn7E',
      start: '2025-11-12T15:19:23.126Z',
      isOpa: false,
      failed: 2,
      passed: 1,
      count: 3,
      modules: [
        {
          name: '0',
          tests: [
            {
              name: '1',
              testId: '1',
              start: '2025-11-12T15:19:23.126Z',
              end: '2025-11-12T15:19:23.126Z',
              report: {
                failed: 0,
                passed: 1
              }
            },
            {
              name: '2',
              testId: '2',
              start: '2025-11-12T15:19:23.126Z',
              end: '2025-11-12T15:19:23.366Z',
              logs: [
                {
                  result: false,
                  message: 'Page timed out'
                }
              ],
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1
              }
            },
            {
              name: '3',
              testId: '3',
              logs: [
                {
                  result: false,
                  message: 'Page timed out'
                }
              ],
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1
              }
            }
          ]
        }
      ],
      end: '2025-11-12T15:19:23.366Z',
      timedOut: true
    }
  },
  timedOut: true,
  end: '2025-11-12T15:19:23.366Z',
  testPageHashes: [
    'C2FfERHrn7E'
  ]
}
