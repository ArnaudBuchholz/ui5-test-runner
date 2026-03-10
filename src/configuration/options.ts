export const options = [
  {
    name: 'cwd',
    short: 'c',
    type: 'folder',
    description: 'set working directory',
    default: process.cwd()
  },
  {
    name: 'webapp',
    type: 'folder',
    description: 'base folder of the UI5 application',
    default: 'webapp'
  },
  {
    name: 'testsuite',
    type: 'file',
    description: 'path of the testsuite file',
    default: 'test/testsuite.qunit.html'
  },
  {
    name: 'alternateNpmPath',
    type: 'folder',
    description: 'alternate NPM package path'
  },
  {
    name: 'browser',
    short: 'b',
    type: 'browser',
    description: 'browser selection',
    default: 'puppeteer'
  },
  {
    name: 'capabilities',
    type: 'boolean',
    description: 'run browser tests'
  },
  {
    name: 'ci',
    type: 'boolean',
    description: 'forces CI mode (no interactive output)',
    default: !process.stdout.isTTY
  },
  {
    name: 'config',
    type: 'file',
    description: 'read options from a configuration file',
    default: 'ui5-test-runner.json'
  },
  {
    name: 'debugKeepBrowserOpen',
    type: 'boolean',
    description: 'keeps the browser open after the tests completed'
  },
  {
    name: 'failFast',
    short: 'f',
    type: 'boolean',
    description: 'stop the whole execution after the first failing page'
  },
  {
    name: 'failOpaFast',
    short: 'fo',
    type: 'boolean',
    description: 'stop the OPA page execution after the first failing test'
  },
  {
    name: 'globalTimeout',
    short: 't',
    type: 'timeout',
    description: 'limit the tests execution time, fail remaining pages if it takes longer than the timeout'
  },
  {
    name: 'help',
    type: 'boolean',
    description: 'display help'
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
    description: 'hostname for legacy URL',
    default: 'localhost'
  },
  {
    name: 'log',
    type: 'file',
    description: 'read and dump log file using jsonl format'
  },
  {
    name: 'logServer',
    short: 'l',
    type: 'boolean',
    description: 'log inner server traces'
  },
  {
    name: 'noNpmInstall',
    type: 'boolean',
    description: 'prevent any NPM install'
  },
  {
    name: 'outputInterval',
    short: 'oi',
    type: 'timeout',
    description: 'interval for reporting progress on non interactive output (CI/CD)'
  },
  {
    name: 'pageFilter',
    short: 'pf',
    type: 'regexp',
    description: 'filter pages to execute'
  },
  {
    name: 'pageParams',
    short: 'pp',
    type: 'string',
    description: 'add parameters to page URL'
  },
  {
    name: 'pageTimeout',
    short: 'pt',
    type: 'timeout',
    description: 'fails a page if it takes longer than this timeout'
  },
  {
    name: 'parallel',
    short: 'p',
    type: 'integer',
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
    type: 'folder-recreate',
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
  parallel: 2,
  reportDir: 'report',
  testsuite: 'test/testsuite.qunit.html',
  ui5: 'https://ui5.sap.com',
  webapp: 'webapp'
} as const;
