# Command line usage

Use `ui5-test-runner --help` to display the list of options. The mapping between v1 options and v2 can be found [here](mapping_v1_v2.md).

Check additional information below.

| Option | Mode | Description | Default Value |
|-|-|-|-|
| -V, --version |  | output the version number| |
| --capabilities | 🧪 | Capabilities tester for browser| |
| -u, --url \<url...> | 🔗 | URL of the testsuite / page to test| |
| -c, --cwd \<path> | 💻🔗🧪 | Set working directory|`current working directory` |
| --config \<json> | 💻🔗🧪 | Configuration file (relative to cwd)|`"ui5-test-runner.json"` |
| --port \<port> | 💻🔗🧪 | Port to use (0 to use any free one)|`0` |
| -r, --report-dir \<path> | 💻🔗🧪 | Directory to output test reports (relative to cwd)|`"report"` |
| -pt, --page-timeout \<timeout> | 🔗 | �🔗🧪📡] Limit the page execution time, fails the page if it takes longer than the timeout (0 means no timeout)|`0` |
| -f, --fail-fast [flag] | 🔗 | �🔗🧪📡] Stop the execution after the first failing page|`false` |
| -fo, --fail-opa-fast [flag] | 🔗 | �🔗📡] Stop the OPA page execution after the first failing test|`false` |
| -k, --keep-alive [flag] | 💻🔗🧪 | Keep the server alive|`false` |
| -l, --log-server [flag] | 🔗 | �🔗🧪📡] Log inner server traces|`false` |
| -p, --parallel \<count> | 💻🔗🧪 | Number of parallel tests executions|`2` |
| -b, --browser \<command> | 🔗 | �🔗🧪📡] Browser instantiation command (relative to cwd or use $/ for provided ones)|`"$/puppeteer.js"` |
| --browser-args \<argument...> | 🔗 | �🔗🧪📡] Browser instantiation command parameters (use -- instead)| |
| --alternate-npm-path \<path> | 🔗 | �🔗📡] Alternate NPM path to look for packages (priority: local, alternate, global)| |
| --no-npm-install | 🔗 | �🔗🧪📡] Prevent any NPM install (execution may fail if a dependency is missing)| |
| -bt, --browser-close-timeout \<timeout> | 🔗 | �🔗🧪📡] Maximum waiting time for browser close|`2000` |
| -br, --browser-retry \<count> | 🔗 | �🔗🧪📡] Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)|`1` |
| -oi, --output-interval \<interval> | 🔗 | �🔗🧪📡] Interval for reporting progress on non interactive output (CI/CD) (0 means no output)|`30000` |
| --offline [flag] | 🔗 | �🔗🧪📡] Limit network usage (implies --no-npm-install)|`false` |
| --webapp \<path> | 💻🔗 | Base folder of the web application (relative to cwd)|`"webapp"` |
| -pf, --page-filter \<regexp> | 🔗 | �🔗📡] Filter out pages not matching the regexp| |
| -pp, --page-params \<params> | 🔗 | �🔗📡] Add parameters to page URL| |
| --page-close-timeout \<timeout> | 🔗 | �🔗📡] Maximum waiting time for page close|`250` |
| -t, --global-timeout \<timeout> | 🔗 | �🔗📡] Limit the pages execution time, fail the page if it takes longer than the timeout (0 means no timeout)|`0` |
| --screenshot [flag] | 🔗 | �🔗📡] Take screenshots during the tests execution (if supported by the browser)|`true` |
| --no-screenshot | 🔗 | �🔗📡] Disable screenshots during the tests execution (but not on failure, see --screenshot-on-failure)| |
| --screenshot-on-failure \<flag> | 🔗 | �🔗📡] Take a screenshot when a test fails (even if --screenshot is false)|`true` |
| -st, --screenshot-timeout \<timeout> | 🔗 | �🔗📡] Maximum waiting time for browser screenshot|`5000` |
| -so, --split-opa [flag] | 🔗 | �🔗📡] Split OPA tests using QUnit modules|`false` |
| -rg, --report-generator \<path...> | 🔗 | �🔗📡] Report generator paths (relative to cwd or use $/ for provided ones)|`["$/report.js"]` |
| --progress-page \<path> | 🔗 | �🔗📡] Progress page path (relative to cwd or use $/ for provided ones)|`"$/report/default.html"` |
| --coverage [flag] | 🔗 | �🔗📡] Enable or disable code coverage| |
| --no-coverage | 🔗 | �🔗📡] Disable code coverage| |
| -cs, --coverage-settings \<path> | 🔗 | �🔗📡] Path to a custom .nycrc.json file providing settings for instrumentation (relative to cwd or use $/ for provided ones)|`"$/.nycrc.json"` |
| -ctd, --coverage-temp-dir \<path> | 🔗 | �🔗📡] Directory to output raw coverage information to (relative to cwd)|`".nyc_output"` |
| -crd, --coverage-report-dir \<path> | 🔗 | �🔗📡] Directory to store the coverage report files (relative to cwd)|`"coverage"` |
| -cr, --coverage-reporters \<reporter...> | 🔗 | �🔗📡] List of nyc reporters to use (text is always used)|`["lcov","cobertura"]` |
| -ccb, --coverage-check-branches \<percent> | 🔗 | �🔗📡] What % of branches must be covered|`0` |
| -ccf, --coverage-check-functions \<percent> | 🔗 | �🔗📡] What % of functions must be covered|`0` |
| -ccl, --coverage-check-lines \<percent> | 🔗 | �🔗📡] What % of lines must be covered|`0` |
| -ccs, --coverage-check-statements \<percent> | 🔗 | �🔗📡] What % of statements must be covered|`0` |
| -crs, --coverage-remote-scanner \<path> | 🔗 | �🔗📡] Scan for files when all coverage is requested|`"$/scan-ui5.js"` |
| -s, --serve-only [flag] | 🔗 | �🔗📡] Serve only|`false` |
| -w, --watch [flag] | 💻🔗 | Monitor the webapp folder (or the one specified with --watch-folder) and re-execute tests on change|`false` |
| --watch-folder \<path> | 💻🔗 | Folder to monitor with watch (enables --watch if not specified)| |
| --start \<command> | 🔗 | �🔗📡] Start command (might be an NPM script or a shell command)| |
| --start-wait-url \<command> | 🔗 | �🔗📡] URL to wait for (🔗 defaulted to first url)| |
| --start-wait-method \<method> | 🔗 | �🔗📡] HTTP method to check the waited URL|`"GET"` |
| --start-timeout \<timeout> | 🔗 | �🔗📡] Maximum waiting time for the start command (based on when the first URL becomes available)|`5000` |
| --end \<command> | 💻🔗 | End script (will receive path to job.js)| |
| --end-timeout \<timeout> | 💻🔗 | Maximum waiting time for the end script|`5000` |
| --ui5 \<url> |  | [💻📡] UI5 url|`"https://ui5.sap.com"` |
| --disable-ui5 [flag] |  | [💻📡] Disable UI5 mapping (also disable libs)|`false` |
| --libs \<lib...> |  | [💻📡] Library mapping (\<relative>=\<path> or \<path>)| |
| --mappings \<mapping...> |  | [💻📡] Custom mapping (\<match>=\<file\|url>(\<config>))| |
| --cache \<path> |  | [💻📡] Cache UI5 resources locally in the given folder (empty to disable)| |
| --preload \<library...> |  | [💻📡] Preload UI5 libraries in the cache folder (only if --cache is used)| |
| --testsuite \<path> |  | [💻📡] Path of the testsuite file (relative to webapp, URL parameters are supported)|`"test/testsuite.qunit.html"` |
| -cp, --coverage-proxy [flag] | 🔗 | [⚠️ experimental] use internal proxy to instrument remote files|`false` |
| -cpi, --coverage-proxy-include \<regexp> | 🔗 | [⚠️ experimental] urls to instrument for coverage|`".*"` |
| -cpe, --coverage-proxy-exclude \<regexp> | 🔗 | [⚠️ experimental] urls to ignore for coverage|`"/((test-)?resources\|tests?)/"` |
| --batch \<specification...> |  | [⚠️ experimental] Batch specification| |
| --batch-id \<id> |  | [⚠️ experimental] Batch id (used for naming report folder)| |
| --batch-label \<label> |  | [⚠️ experimental] Batch label (used while reporting on execution)| |
| --if \<condition> |  | [⚠️ experimental] Condition runner execution| |
| -h, --help |  | display help for command | |
|||||

Meaning of option values :

* `[value]` : value is optional (usually boolean)
* `<value>` : value is expected
* `<value...>` : more than one value can be set
* `<timeout>` : expressed either as a single numeric (ms) or with the following suffixes :
  - `<number>`ms
  - `<number>s` or `<number>sec` for seconds
  - `<number>m` or `<number>min` for minutes

Options availability depends on the mode :

* 💻 when serving and testing (legacy mode)
* 🔗 when testing remote pages (`--url`)
* 🧪 when testing browser capabilities  (`--capabilities`)
* 📡 when using batch mode, the option is transmitted from main to child

For browser arguments, it is recommended to use `--` and pass them after. In the configuration file, use `browserArgs`.
