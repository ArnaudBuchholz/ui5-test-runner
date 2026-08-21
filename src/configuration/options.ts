export const options = [
  {
    name: 'cwd',
    short: 'c',
    type: 'fs-entry',
    description: 'set working directory',
    default: process.cwd()
  },
  {
    name: 'webapp',
    type: 'fs-entry',
    typeModifiers: new Set(['safe-default'] as const),
    description: 'base folder of the UI5 application',
    default: 'webapp'
  },
  {
    name: 'testsuite',
    type: 'string',
    description: 'path of the testsuite file',
    default: 'test/testsuite.qunit.html'
  },
  {
    name: 'agentDetectionInterval',
    type: 'timeout',
    browserExposed: true,
    description: 'initial polling interval when detecting a test framework after page load',
    default: 100
  },
  {
    name: 'agentDetectionMaxInterval',
    type: 'timeout',
    browserExposed: true,
    description: 'maximum polling interval when detecting a test framework after page load',
    default: 1000
  },
  {
    name: 'agentDetectionTimeout',
    type: 'timeout',
    browserExposed: true,
    description: 'maximum time to wait for a test framework to be detected after page load',
    default: 5000
  },
  {
    name: 'agentNoTestsTimeout',
    type: 'timeout',
    browserExposed: true,
    description: 'time to wait after QUnit.done fires with no tests before declaring the page done',
    default: 5000
  },
  {
    name: 'alternateNpmPath',
    type: 'fs-entry',
    batchForwarded: true,
    description: 'alternate NPM package path'
  },
  {
    name: 'batch',
    type: 'string',
    multiple: true,
    description: 'batch item specification (folder, config file, or regex pattern)'
  },
  {
    name: 'batchId',
    type: 'string',
    description: 'identifier for the batch item'
  },
  {
    name: 'batchLabel',
    type: 'string',
    description: 'display label for the batch item'
  },
  {
    name: 'browser',
    short: 'b',
    type: 'browser',
    browserExposed: true,
    batchForwarded: true,
    description: 'browser selection',
    default: 'puppeteer'
  },
  {
    name: 'browserViewportHeight',
    short: 'H',
    type: 'integer',
    description: 'height of the browser viewport in pixels',
    default: 1080
  },
  {
    name: 'browserViewportWidth',
    short: 'W',
    type: 'integer',
    description: 'width of the browser viewport in pixels',
    default: 1920
  },
  {
    name: 'browserVisible',
    short: 'V',
    type: 'boolean',
    description: 'control if the browser should be visible during the tests',
    default: false
  },
  {
    name: 'ci',
    type: 'boolean',
    batchForwarded: true,
    description: 'forces CI mode (no interactive output)',
    default: !process.stdout.isTTY
  },
  {
    name: 'config',
    type: 'fs-entry',
    typeModifiers: new Set(['file', 'safe-default'] as const),
    description: 'read options from a configuration file',
    default: 'ui5-test-runner.json'
  },
  {
    name: 'coverage',
    type: 'boolean',
    description: 'enable code coverage',
    default: false
  },
  {
    name: 'coverageCheckBranches',
    short: 'ccb',
    type: 'percent',
    description: 'minimum branch coverage threshold (0 = no check)',
    default: 0
  },
  {
    name: 'coverageCheckFunctions',
    short: 'ccf',
    type: 'percent',
    description: 'minimum function coverage threshold (0 = no check)',
    default: 0
  },
  {
    name: 'coverageCheckLines',
    short: 'ccl',
    type: 'percent',
    description: 'minimum line coverage threshold (0 = no check)',
    default: 0
  },
  {
    name: 'coverageCheckStatements',
    short: 'ccs',
    type: 'percent',
    description: 'minimum statement coverage threshold (0 = no check)',
    default: 0
  },
  {
    name: 'coverageReportDir',
    short: 'crd',
    type: 'fs-entry',
    typeModifiers: new Set(['overwrite'] as const),
    description: 'directory for the final coverage report',
    default: 'coverage'
  },
  {
    name: 'coverageReporters',
    short: 'cr',
    type: 'string',
    multiple: true,
    description: 'istanbul-lib-report reporters to use',
    default: ['lcov', 'cobertura']
  },
  {
    name: 'coverageSettings',
    short: 'cs',
    type: 'fs-entry',
    typeModifiers: new Set(['file', 'safe-default'] as const),
    description: 'path to the Istanbul configuration file (.nycrc.json)',
    default: '.nycrc.json'
  },
  {
    name: 'coverageSourceDir',
    type: 'fs-entry',
    typeModifiers: new Set(['safe-default'] as const),
    description: 'directory containing the source files used for coverage reporting'
  },
  {
    name: 'coverageTempDir',
    short: 'ctd',
    type: 'fs-entry',
    typeModifiers: new Set(['overwrite'] as const),
    description: 'temporary directory for coverage data',
    default: '.nyc_output'
  },
  {
    name: 'debugKeepBrowserOpen',
    type: 'boolean',
    description: 'keeps the browser open after the tests completed'
  },
  {
    name: 'dumpConfig',
    type: 'boolean',
    description: 'dump the resolved configuration as JSON and exit'
  },
  {
    name: 'end',
    type: 'string',
    description: 'command to be executed after the tests'
  },
  {
    name: 'endTimeout',
    type: 'timeout',
    description: 'maximum waiting time for the end command to execute'
  },
  {
    name: 'failFast',
    short: 'f',
    type: 'boolean',
    batchForwarded: true,
    description: 'stop the whole execution after the first failing page'
  },
  {
    name: 'failOpaFast',
    short: 'fo',
    type: 'boolean',
    batchForwarded: true,
    description: 'stop the OPA page execution after the first failing test'
  },
  {
    name: 'globalTimeout',
    short: 't',
    type: 'timeout',
    batchForwarded: true,
    description: 'limit the tests execution time, fail remaining pages if it takes longer than the timeout'
  },
  {
    name: 'help',
    type: 'boolean',
    description: 'display help'
  },
  {
    name: 'if',
    type: 'string',
    description: 'skip execution if the expression evaluates to falsy'
  },
  {
    name: 'keepAlive',
    short: 'k',
    type: 'boolean',
    description: 'keep the server alive'
  },
  {
    name: 'localhost',
    type: 'string',
    batchForwarded: true,
    description: 'hostname for legacy URL',
    default: 'localhost'
  },
  {
    name: 'log',
    type: 'fs-entry',
    typeModifiers: new Set(['file'] as const),
    description: 'read and dump log file using jsonl format'
  },
  {
    name: 'logDump',
    type: 'boolean',
    description: 'dump all traces to stdout instead of opening a browser (requires --log)'
  },
  {
    name: 'logFilter',
    short: 'lf',
    type: 'string',
    description: 'JavaScript expression (using punyexpr) to filter logs for dumping with --log-dump'
  },
  {
    name: 'noNpmInstall',
    type: 'boolean',
    batchForwarded: true,
    description: 'prevent any NPM install'
  },
  {
    name: 'npmAllowInstallScripts',
    type: 'boolean',
    batchForwarded: true,
    description: 'allow postinstall scripts when installing missing packages',
    default: false
  },
  {
    name: 'npmInstall',
    type: 'string',
    description: 'npm install strategy for missing packages',
    default: 'global'
  },
  {
    name: 'npmInstallMinReleaseAge',
    type: 'integer',
    batchForwarded: true,
    description: 'minimum release age (in days) required before installing a package',
    default: 3
  },
  {
    name: 'npmInstallPrefix',
    type: 'fs-entry',
    description: 'path used as --prefix when npmInstall is set to prefix'
  },
  {
    name: 'outputInterval',
    short: 'oi',
    type: 'timeout',
    batchForwarded: true,
    description: 'interval for reporting progress on non interactive output (CI/CD)',
    default: 30_000
  },
  {
    name: 'pageFilter',
    short: 'pf',
    type: 'regexp',
    batchForwarded: true,
    description: 'filter pages to execute'
  },
  {
    name: 'pageParams',
    short: 'pp',
    type: 'string',
    batchForwarded: true,
    description: 'add parameters to page URL'
  },
  {
    name: 'pageTimeout',
    short: 'pt',
    type: 'timeout',
    batchForwarded: true,
    description: 'fails a page if it takes longer than this timeout'
  },
  {
    name: 'parallel',
    short: 'p',
    type: 'integer',
    browserExposed: true,
    batchForwarded: true,
    description: 'number of parallel executions',
    default: 2
  },
  {
    name: 'port',
    type: 'integer',
    description: 'port to use'
  },
  {
    name: 'reportDir',
    short: 'r',
    type: 'fs-entry',
    typeModifiers: new Set(['overwrite'] as const),
    description: 'directory to output test reports',
    default: 'report'
  },
  {
    name: 'serveOnly',
    short: 's',
    type: 'boolean',
    description: 'serve only'
  },
  {
    name: 'start',
    type: 'string',
    description: 'command to be executed before the tests'
  },
  {
    name: 'startTimeout',
    type: 'timeout',
    description: 'maximum waiting time for the start command to become ready',
    default: 30_000
  },
  {
    name: 'startWaitMethod',
    type: 'string',
    description: 'HTTP method used when polling the startWaitUrl',
    default: 'GET'
  },
  {
    name: 'startWaitUrl',
    type: 'url',
    description: 'URL to poll after the start command is executed'
  },
  {
    name: 'ui5',
    type: 'url',
    description: 'UI5 url',
    default: 'https://ui5.sap.com'
  },
  {
    name: 'url',
    short: 'u',
    type: 'url',
    multiple: true,
    description: 'URL of the page to test'
  },
  {
    name: 'version',
    type: 'boolean',
    description: 'display version'
  }
] as const;

export const defaults = {
  agentDetectionInterval: 100,
  agentDetectionMaxInterval: 1000,
  agentDetectionTimeout: 5000,
  agentNoTestsTimeout: 5000,
  browser: 'puppeteer',
  browserViewportHeight: 1080,
  browserViewportWidth: 1920,
  browserVisible: false,
  ci: !process.stdout.isTTY,
  config: 'ui5-test-runner.json',
  coverage: false,
  coverageCheckBranches: 0,
  coverageCheckFunctions: 0,
  coverageCheckLines: 0,
  coverageCheckStatements: 0,
  coverageReportDir: 'coverage',
  coverageReporters: ['lcov', 'cobertura'],
  coverageSettings: '.nycrc.json',
  coverageTempDir: '.nyc_output',
  cwd: process.cwd(),
  localhost: 'localhost',
  npmAllowInstallScripts: false,
  npmInstall: 'global',
  npmInstallMinReleaseAge: 3,
  outputInterval: 30_000,
  parallel: 2,
  reportDir: 'report',
  startTimeout: 30_000,
  startWaitMethod: 'GET',
  testsuite: 'test/testsuite.qunit.html',
  ui5: 'https://ui5.sap.com',
  webapp: 'webapp'
} as const;
