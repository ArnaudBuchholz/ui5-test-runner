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
    name: 'browser',
    short: 'b',
    type: 'browser',
    browserExposed: true,
    batchForwarded: true,
    description: 'browser selection',
    default: 'puppeteer'
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
    name: 'debugKeepBrowserOpen',
    type: 'boolean',
    description: 'keeps the browser open after the tests completed'
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
    batchForwarded: true,
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
    name: 'noNpmInstall',
    type: 'boolean',
    batchForwarded: true,
    description: 'prevent any NPM install'
  },
  {
    name: 'npmInstall',
    type: 'string',
    description: 'npm install strategy for missing packages',
    default: 'global'
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
  browser: 'puppeteer',
  ci: !process.stdout.isTTY,
  config: 'ui5-test-runner.json',
  cwd: process.cwd(),
  localhost: 'localhost',
  npmInstall: 'global',
  outputInterval: 30_000,
  parallel: 2,
  reportDir: 'report',
  startTimeout: 30_000,
  startWaitMethod: 'GET',
  testsuite: 'test/testsuite.qunit.html',
  ui5: 'https://ui5.sap.com',
  webapp: 'webapp'
} as const;
