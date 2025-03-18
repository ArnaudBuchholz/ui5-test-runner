# Command line usage

Use `ui5-test-runner --help` to display the list of options. The mapping between v1 options and v2 can be found [here](mapping_v1_v2.md).

Check additional information below.

| Parameter | Mode | Description | Default Value |
|-|-|-|-|
| -V, --version |  | output the version number| |
| --capabilities | 🧪 | Capabilities tester for browser| |
| -u, --url &lt;url...> | 🔗 | URL of the testsuite / page to test| |
| -c, --cwd &lt;path> | 💻🔗🧪 | Set working directory|`current working directory` |
| --config &lt;json> | 💻🔗🧪 | Configuration file (relative to cwd)|`"ui5-test-runner.json"` |
| --port &lt;port> | 💻🔗🧪 | Port to use (0 to use any free one)|`0` |
| -r, --report-dir &lt;path> | 💻🔗🧪 | Directory to output test reports (relative to cwd)|`"report"` |
| -pt, --page-timeout &lt;timeout> | 💻🔗🧪📡 | Limit the page execution time, fails the page if it takes longer than the timeout (0 means no timeout)|`0` |
| -f, --fail-fast [flag] | 💻🔗🧪📡 | Stop the execution after the first failing page|`false` |
| -fo, --fail-opa-fast [flag] | 💻🔗📡 | Stop the OPA page execution after the first failing test|`false` |
| -k, --keep-alive [flag] | 💻🔗🧪 | Keep the server alive|`false` |
| -l, --log-server [flag] | 💻🔗🧪📡 | Log inner server traces|`false` |
| -p, --parallel &lt;count> | 💻🔗🧪 | Number of parallel tests executions|`2` |
| -b, --browser &lt;command> | 💻🔗🧪📡 | Browser instantiation command (relative to cwd or use $/ for provided ones)|`"$/puppeteer.js"` |
| --browser-args &lt;argument...> | 💻🔗🧪📡 | Browser instantiation command parameters (use -- instead)| |
| --alternate-npm-path &lt;path> | 💻🔗📡 | Alternate NPM path to look for packages (priority: local, alternate, global)| |
| --no-npm-install | 💻🔗🧪📡 | Prevent any NPM install (execution may fail if a dependency is missing)| |
| -bt, --browser-close-timeout &lt;timeout> | 💻🔗🧪📡 | Maximum waiting time for browser close|`2000` |
| -br, --browser-retry &lt;count> | 💻🔗🧪📡 | Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)|`1` |
| -oi, --output-interval &lt;interval> | 💻🔗🧪📡 | Interval for reporting progress on non interactive output (CI/CD) (0 means no output)|`30000` |
| --offline [flag] | 💻🔗🧪📡 | Limit network usage (implies --no-npm-install)|`false` |
| --env &lt;name=value...> | 💻🔗🧪📡 | Set environment variable| |
| --webapp &lt;path> | 💻🔗 | Base folder of the web application (relative to cwd)|`"webapp"` |
| -pf, --page-filter &lt;regexp> | 💻🔗📡 | Filter out pages not matching the regexp| |
| -pp, --page-params &lt;params> | 💻🔗📡 | Add parameters to page URL| |
| --page-close-timeout &lt;timeout> | 💻🔗📡 | Maximum waiting time for page close|`250` |
| -t, --global-timeout &lt;timeout> | 💻🔗📡 | Limit the pages execution time, fail the page if it takes longer than the timeout (0 means no timeout)|`0` |
| --screenshot [flag] | 💻🔗📡 | Take screenshots during the tests execution (if supported by the browser)|`true` |
| --no-screenshot | 💻🔗📡 | Disable screenshots during the tests execution (but not on failure, see --screenshot-on-failure)| |
| --screenshot-on-failure &lt;flag> | 💻🔗📡 | Take a screenshot when a test fails (even if --screenshot is false)|`true` |
| -st, --screenshot-timeout &lt;timeout> | 💻🔗📡 | Maximum waiting time for browser screenshot|`5000` |
| -so, --split-opa [flag] | 💻🔗📡 | Split OPA tests using QUnit modules|`false` |
| -rg, --report-generator &lt;path...> | 💻🔗📡 | Report generator paths (relative to cwd or use $/ for provided ones)|`["$/report.js"]` |
| --progress-page &lt;path> | 💻🔗📡 | Progress page path (relative to cwd or use $/ for provided ones)|`"$/report/default.html"` |
| --coverage [flag] | 💻🔗📡 | Enable or disable code coverage| |
| --no-coverage | 💻🔗📡 | Disable code coverage| |
| -cs, --coverage-settings &lt;path> | 💻🔗📡 | Path to a custom .nycrc.json file providing settings for instrumentation (relative to cwd or use $/ for provided ones)|`"$/.nycrc.json"` |
| -ctd, --coverage-temp-dir &lt;path> | 💻🔗 | Directory to output raw coverage information to (relative to cwd)|`".nyc_output"` |
| -crd, --coverage-report-dir &lt;path> | 💻🔗 | Directory to store the coverage report files (relative to cwd)|`"coverage"` |
| -cr, --coverage-reporters &lt;reporter...> | 💻🔗📡 | List of nyc reporters to use (text is always used)|`["lcov","cobertura"]` |
| -ccb, --coverage-check-branches &lt;percent> | 💻🔗📡 | What % of branches must be covered|`0` |
| -ccf, --coverage-check-functions &lt;percent> | 💻🔗📡 | What % of functions must be covered|`0` |
| -ccl, --coverage-check-lines &lt;percent> | 💻🔗📡 | What % of lines must be covered|`0` |
| -ccs, --coverage-check-statements &lt;percent> | 💻🔗📡 | What % of statements must be covered|`0` |
| -crs, --coverage-remote-scanner &lt;path> | 💻🔗📡 | Scan for files when all coverage is requested|`"$/scan-ui5.js"` |
| -s, --serve-only [flag] | 💻🔗 | Serve only|`false` |
| -w, --watch [flag] | 💻🔗 | Monitor the webapp folder (or the one specified with --watch-folder) and re-execute tests on change|`false` |
| --watch-folder &lt;path> | 💻🔗 | Folder to monitor with watch (enables --watch if not specified)| |
| --start &lt;command> | 💻🔗 | Start command (might be an NPM script or a shell command)| |
| --start-wait-url &lt;command> | 💻🔗 | URL to wait for (🔗 defaulted to first url)| |
| --start-wait-method &lt;method> | 💻🔗 | HTTP method to check the waited URL|`"GET"` |
| --start-timeout &lt;timeout> | 💻🔗 | Maximum waiting time for the start command (based on when the first URL becomes available)|`5000` |
| --end &lt;script> | 💻🔗 | End script (will receive path to `job.js`)| |
| --end-timeout &lt;timeout> | 💻🔗 | Maximum waiting time for the end script|`5000` |
| --ui5 &lt;url> | 💻📡 | UI5 url|`"https://ui5.sap.com"` |
| --disable-ui5 [flag] | 💻📡 | Disable UI5 mapping (also disable libs)|`false` |
| --libs &lt;lib...> | 💻📡 | Library mapping (&lt;relative>=&lt;path> or &lt;path>)| |
| --mappings &lt;mapping...> | 💻📡 | Custom mapping (&lt;match>=&lt;file\|url>(&lt;config>))| |
| --cache &lt;path> | 💻📡 | Cache UI5 resources locally in the given folder (empty to disable)| |
| --preload &lt;library...> | 💻📡 | Preload UI5 libraries in the cache folder (only if --cache is used)| |
| --testsuite &lt;path> | 💻 | Path of the testsuite file (relative to webapp, URL parameters are supported)|`"test/testsuite.qunit.html"` |
| -cp, --coverage-proxy [flag] | 🔗 | [⚠️ experimental] use internal proxy to instrument remote files|`false` |
| -cpi, --coverage-proxy-include &lt;regexp> | 🔗 | [⚠️ experimental] urls to instrument for coverage|`".*"` |
| -cpe, --coverage-proxy-exclude &lt;regexp> | 🔗 | [⚠️ experimental] urls to ignore for coverage|`"/((test-)?resources\|tests?)/"` |
| --batch &lt;specification...> |  | Batch specification| |
| --batch-id &lt;id> |  | Batch id (used for naming report folder)| |
| --batch-label &lt;label> |  | Batch label (used while reporting on execution)| |
| --if &lt;condition> |  | Condition runner execution| |
| -h, --help |  | display help for command | |
|||||

Meaning of parameter values :

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
* 📡 when using batch mode, the parameter is transmitted from main command to batch item

For browser arguments, it is recommended to use `--` and pass them after. In the configuration file, use `browserArgs`.
