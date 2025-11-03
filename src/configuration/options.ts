import { Platform } from '../Platform.js';

export const options = [
  {
    name: 'cwd',
    short: 'c',
    description: 'Set working directory',
    type: 'folder',
    default: Platform.cwd(),
    defaultLabel: 'current working directory'
  },
  {
    name: 'version',
    description: 'Shows version',
    type: 'boolean'
  },
  {
    name: 'help',
    description: 'Shows help',
    type: 'boolean'
  },
  {
    name: 'capabilities',
    description: 'Run browser tests',
    type: 'boolean'
  },
  {
    name: 'url',
    short: 'u',
    description: 'URL of the testsuite / page to test',
    type: 'url',
    multiple: true
  },
  {
    name: 'config',
    description: 'Configuration file',
    type: 'file',
    default: 'ui5-test-runner.json'
  },
  {
    name: 'port',
    description: 'Port to use',
    type: 'integer'
  },
  {
    name: 'reportDir',
    short: 'r',
    description: 'Directory to output test reports',
    type: 'folder',
    default: 'report'
  },
  {
    name: 'pageTimeout',
    short: 'pt',
    description: 'Limit the page execution time, fails the page if it takes longer than the timeout',
    type: 'timeout'
  },
  {
    name: 'failFast',
    short: 'f',
    description: 'Stop the execution after the first failing page',
    type: 'boolean'
  },
  {
    name: 'failOpaFast',
    short: 'fo',
    description: 'Stop the OPA page execution after the first failing test',
    type: 'boolean'
  },
  {
    name: 'keepAlive',
    short: 'k',
    description: 'Keep the server alive',
    type: 'boolean'
  },
  {
    name: 'logServer',
    short: 'l',
    description: 'Log inner server traces',
    type: 'boolean'
  },
  {
    name: 'parallel',
    short: 'p',
    description: 'Number of parallel tests executions',
    type: 'integer',
    default: 2
  },
  {
    name: 'browser',
    short: 'b',
    description: 'Browser instantiation command (relative to cwd or use $/ for provided ones)',
    type: 'file',
    default: '$/puppeteer.js'
  },
  {
    name: 'alternateNpmPath',
    description: 'Alternate NPM path to look for packages (priority: local, alternate, global)',
    type: 'folder'
  },
  {
    name: 'noNpmInstall',
    description: 'Prevent any NPM install (execution may fail if a dependency is missing)',
    type: 'boolean'
  },
  {
    name: 'browserCloseTimeout',
    short: 'bt',
    description: 'Maximum waiting time for browser close',
    type: 'timeout',
    default: '2s'
  },
  {
    name: 'browserRetry',
    short: 'br',
    description: 'Browser instantiation retries : if the command fails unexpectedly, it is re-executed',
    type: 'integer',
    default: 1
  },
  {
    name: 'outputInterval',
    short: 'oi',
    description: 'Interval for reporting progress on non interactive output (CI/CD)',
    type: 'timeout',
    default: 3000
  },
  {
    name: 'offline',
    description: 'Limit network usage (implies --no-npm-install)',
    type: 'boolean'
  },
  {
    name: 'env',
    description: 'Set environment variable (syntax: name=value)',
    type: 'string',
    multiple: true
  },
  {
    name: 'localhost',
    description: 'Hostname for legacy URLs and callbacks',
    type: 'string',
    default: 'localhost'
  },
  {
    name: 'ci',
    description: 'CI mode (no interactive output)',
    type: 'boolean'
  },
  {
    name: 'deepProbe',
    description: 'Deep probe (recursive, slower)',
    type: 'boolean'
  },
  {
    name: 'probeParallel',
    description: 'Number of parallel probes (0 to use --parallel)',
    type: 'integer'
  },
  {
    name: 'webapp',
    description: 'Base folder of the web application',
    type: 'folder'
  },
  {
    name: 'pageFilter',
    short: 'pf',
    description: 'Filter out pages not matching the regexp',
    type: 'regexp'
  },
  {
    name: 'pageParams',
    short: 'pp',
    description: 'Add parameters to page URL',
    type: 'string'
  },
  {
    name: 'pageCloseTimeout',
    description: 'Maximum waiting time for page to close',
    type: 'timeout',
    default: 250
  },
  {
    name: 'globalTimeout',
    short: 't',
    description: 'Limit the tests execution time, fail remaining pages if it takes longer than the timeout',
    type: 'timeout'
  },
  {
    name: 'screenshot',
    description: 'Take screenshots during the tests execution (if supported by the browser)',
    type: 'boolean'
  },
  {
    name: 'noScreenshot',
    description: 'Disable screenshots during the tests execution (but not on failure, see --screenshot-on-failure)',
    type: 'boolean'
  },
  {
    name: 'screenshotOnFailure',
    description: 'Take a screenshot when a test fails (even if --screenshot is false)',
    type: 'boolean',
    default: true
  },
  {
    name: 'screenshotTimeout',
    short: 'st',
    description: 'Maximum waiting time for browser screenshot',
    type: 'timeout',
    default: 5000
  },
  {
    name: 'splitOpa',
    short: 'so',
    description: 'Split OPA tests using QUnit modules',
    type: 'boolean'
  },
  {
    name: 'reportGenerator',
    short: 'rg',
    description: 'Report generator paths (relative to cwd or use $/ for provided ones)',
    type: 'file',
    multiple: true,
    default: ['$/report.js'],
    defaultLabel: 'Standard report generator'
  },
  {
    name: 'jest',
    description: 'Simulate jest environment',
    type: 'boolean'
  },
  {
    name: 'qunitBatchSize',
    description: 'QUnit hooks batch size (disables screenshots)',
    type: 'integer'
  },
  {
    name: 'coverage',
    description: 'Enable or disable code coverage',
    type: 'boolean'
  },
  {
    name: 'noCoverage',
    description: 'Disable code coverage',
    type: 'boolean'
  },
  {
    name: 'coverageSettings',
    short: 'cs',
    description: 'Path to a custom .nycrc.json file providing settings for instrumentation',
    type: 'file',
    default: '$/.nycrc.json'
  },
  {
    name: 'coverageTempDir',
    short: 'ctd',
    description: 'Directory to output raw coverage information to',
    type: 'folder',
    default: '.nyc_output'
  },
  {
    name: 'coverageReportDir',
    short: 'crd',
    description: 'Directory to store the coverage report files',
    type: 'folder',
    default: '.coverage'
  },
  {
    name: 'coverageReporters',
    short: 'cr',
    description: 'List of nyc reporters to use (text is always used)',
    type: 'string',
    multiple: true,
    default: ['lcov', 'cobertura']
  },
  {
    name: 'coverageCheckBranches',
    short: 'ccb',
    description: 'What % of branches must be covered',
    type: 'percent'
  },
  {
    name: 'coverageCheckFunctions',
    short: 'ccf',
    description: 'What % of functions must be covered',
    type: 'percent'
  },
  {
    name: 'coverageCheckLines',
    short: 'ccl',
    description: 'What % of lines must be covered',
    type: 'percent'
  },
  {
    name: 'coverageCheckStatements',
    short: 'ccs',
    description: 'What % of statements must be covered',
    type: 'percent'
  },
  {
    name: 'coverageRemoteScanner',
    short: 'crs',
    description: 'Scanner to get source files when all coverage is requested',
    type: 'file',
    default: '$/scan-ui5.js'
  },
  {
    name: 'serveOnly',
    short: 's',
    description: 'Serve only',
    type: 'boolean'
  },
  {
    name: 'watch',
    short: 'w',
    description: 'Monitor the webapp folder (or the one specified with --watch-folder) and re-execute tests on change',
    type: 'boolean'
  },
  {
    name: 'watchFolder',
    description: 'Folder to monitor with watch (enables --watch if not specified)',
    type: 'folder'
  },
  {
    name: 'start',
    description:
      'Start command (might be an NPM script or a shell command) ⚠️ the command is killed on tests completion',
    type: 'string'
  },
  {
    name: 'startWaitUrl',
    description: 'URL to wait for (🔗 defaulted to first url)',
    type: 'url'
  },
  {
    name: 'startWaitMethod',
    description: 'HTTP method to check the waited URL',
    type: 'string',
    default: 'GET'
  },
  {
    name: 'startTimeout',
    description:
      'Maximum waiting time for the start command (based on when the first URL becomes available, also used for termination)',
    type: 'timeout',
    default: 5000
  },
  {
    name: 'end',
    description: 'End script (will receive path to `job.json`)',
    type: 'string'
  },
  {
    name: 'endTimeout',
    description: 'Maximum waiting time for the end script',
    type: 'timeout',
    default: 5000
  },
  {
    name: 'ui5',
    description: 'UI5 url',
    type: 'url',
    default: 'https://ui5.sap.com'
  },
  {
    name: 'disableUi5',
    description: 'Disable UI5 mapping (also disable libs)',
    type: 'boolean'
  },
  {
    name: 'libs',
    description: 'UI5 library mapping (<relative>=<path> or <path>)',
    type: 'ui5Mapping',
    multiple: true
  },
  {
    name: 'mappings',
    description: 'REserve custom mapping (<match>=<file|url>(<config>))',
    type: 'reserveMapping',
    multiple: true
  },
  {
    name: 'cache',
    description: 'Cache UI5 resources locally in the given folder',
    type: 'folder'
  },
  {
    name: 'preload',
    description: 'Preload UI5 libraries in the cache folder (only if --cache is used)',
    type: 'string',
    multiple: true
  },
  {
    name: 'testsuite',
    description: 'Path of the testsuite file (relative to webapp, URL parameters are supported)',
    type: 'file',
    default: 'test/testsuite.qunit.html'
  },
  {
    name: 'coverageProxy',
    short: 'cp',
    description: 'Use internal proxy to instrument remote files',
    type: 'boolean'
  },
  {
    name: 'coverageProxyInclude',
    short: 'cpi',
    description: 'Urls to instrument for coverage',
    type: 'regexp',
    default: '.*'
  },
  {
    name: 'coverageProxyExclude',
    short: 'cpe',
    description: 'Urls to ignore for coverage',
    type: 'regexp',
    default: '/((test-)?resources|tests?)/'
  },
  {
    name: 'batchMode',
    description: 'Changes the way options are defaulted (in particular coverage temporary folders)',
    type: 'boolean'
  },
  {
    name: 'batch',
    description: 'Batch specification',
    type: 'string',
    multiple: true
  },
  {
    name: 'batchId',
    description: 'Batch id (used for naming report folder)',
    type: 'string'
  },
  {
    name: 'batchLabel',
    description: 'Batch label (used while reporting on execution)',
    type: 'string'
  },
  {
    name: 'if',
    description: 'Condition runner execution',
    type: 'string'
  },
  {
    name: 'debugDevMode',
    description: 'Enables development mode in REserve',
    type: 'boolean'
  },
  {
    name: 'debugProbeOnly',
    description: 'Stops after probing pages',
    type: 'boolean'
  },
  {
    name: 'debugKeepBrowserOpen',
    description: 'Keeps the browser open after the test completed',
    type: 'boolean'
  },
  {
    name: 'debugMemory',
    description: 'Collect memory statistics',
    type: 'boolean'
  },
  {
    name: 'debugHandles',
    description: 'Collect handles statistics',
    type: 'boolean'
  },
  {
    name: 'debugKeepReport',
    description: 'Keep report after capabilities succeeded',
    type: 'boolean'
  },
  {
    name: 'debugCapabilitiesTest',
    description: 'Test filter for capabilities',
    type: 'boolean'
  },
  {
    name: 'debugCapabilitiesNoTimeout',
    description: 'Prevents timeout during capabilities',
    type: 'boolean'
  },
  {
    name: 'debugCapabilitiesNoScript',
    description: 'Prevents browser scripts during capabilities',
    type: 'boolean'
  },
  {
    name: 'debugCoverageNoCustomFs',
    description: 'Disable the use of custom file system for coverage',
    type: 'boolean'
  },
  {
    name: 'debugVerbose',
    description: 'Output debug traces',
    type: 'string',
    multiple: true
  }
] as const;

export const defaults = {
  cwd: Platform.cwd(),
  config: 'ui5-test-runner.json',
  reportDir: 'report',
  parallel: 2,
  browser: '$/puppeteer.js',
  browserCloseTimeout: '2s',
  browserRetry: 1,
  outputInterval: 3000,
  localhost: 'localhost',
  pageCloseTimeout: 250,
  screenshotOnFailure: true,
  screenshotTimeout: 5000,
  reportGenerator: ['$/report.js'],
  coverageSettings: '$/.nycrc.json',
  coverageTempDir: '.nyc_output',
  coverageReportDir: '.coverage',
  coverageReporters: ['lcov', 'cobertura'],
  coverageRemoteScanner: '$/scan-ui5.js',
  startWaitMethod: 'GET',
  startTimeout: 5000,
  endTimeout: 5000,
  ui5: 'https://ui5.sap.com',
  testsuite: 'test/testsuite.qunit.html',
  coverageProxyInclude: '.*',
  coverageProxyExclude: '/((test-)?resources|tests?)/'
} as const;
