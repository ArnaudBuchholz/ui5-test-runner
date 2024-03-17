# Command line usage

Use `ui5-test-runner --help` to display the list of options. The mapping between v1 options and v2 can be found [here](mapping_v1_v2.md).

Check additional information below.

```text
  -V, --version                                output the version number
  --capabilities                               🧪 Capabilities tester for browser
  -u, --url <url...>                           🔗 URL of the testsuite / page to test
  -c, --cwd <path>                             [💻🔗🧪] Set working directory (default: current working directory)
  --port <port>                                [💻🔗🧪] Port to use (0 to use any free one) (default: 0)
  -r, --report-dir <path>                      [💻🔗🧪] Directory to output test reports (relative to cwd) (default:
                                               "report")
  -pt, --page-timeout <timeout>                [💻🔗🧪] Limit the page execution time, fails the page if it takes
                                               longer than the timeout (0 means no timeout) (default: 0)
  -f, --fail-fast [flag]                       [💻🔗🧪] Stop the execution after the first failing page (default:
                                               false)
  -fo, --fail-opa-fast [flag]                  [💻🔗] Stop the OPA page execution after the first failing test
                                               (default: false)
  -k, --keep-alive [flag]                      [💻🔗🧪] Keep the server alive (default: false)
  -l, --log-server [flag]                      [💻🔗🧪] Log inner server traces (default: false)
  -p, --parallel <count>                       [💻🔗🧪] Number of parallel tests executions (default: 2)
  -b, --browser <command>                      [💻🔗🧪] Browser instantiation command (relative to cwd or use $/ for
                                               provided ones) (default: "$/puppeteer.js")
  --browser-args <argument...>                 [💻🔗🧪] Browser instantiation command parameters (use -- instead)
  --alternate-npm-path <path>                  [💻🔗] Alternate NPM path to look for packages (priority: local,
                                               alternate, global)
  --no-npm-install                             [💻🔗🧪] Prevent any NPM install (execution may fail if a dependency is
                                               missing)
  -bt, --browser-close-timeout <timeout>       [💻🔗🧪] Maximum waiting time for browser close (default: 2000)
  -br, --browser-retry <count>                 [💻🔗🧪] Browser instantiation retries : if the command fails
                                               unexpectedly, it is re-executed (0 means no retry) (default: 1)
  -oi, --output-interval <interval>            [💻🔗🧪] Interval for reporting progress on non interactive output
                                               (CI/CD) (0 means no output) (default: 30000)
  --offline                                    [💻🔗🧪] Limit network usage (implies --no-npm-install) (default: false)
  --webapp <path>                              [💻🔗] Base folder of the web application (relative to cwd) (default:
                                               "webapp")
  -pf, --page-filter <regexp>                  [💻🔗] Filter out pages not matching the regexp
  -pp, --page-params <params>                  [💻🔗] Add parameters to page URL
  --page-close-timeout <timeout>               [💻🔗] Maximum waiting time for page close (default: 250)
  -t, --global-timeout <timeout>               [💻🔗] Limit the pages execution time, fail the page if it takes longer
                                               than the timeout (0 means no timeout) (default: 0)
  --screenshot [flag]                          [💻🔗] Take screenshots during the tests execution (if supported by the
                                               browser) (default: true)
  --no-screenshot                              [💻🔗] Disable screenshots
  -st, --screenshot-timeout <timeout>          [💻🔗] Maximum waiting time for browser screenshot (default: 5000)
  -rg, --report-generator <path...>            [💻🔗] Report generator paths (relative to cwd or use $/ for provided
                                               ones) (default: ["$/report.js"])
  --progress-page <path>                       [💻🔗] progress page path (relative to cwd or use $/ for provided ones)
                                               (default: "$/report/default.html")
  --coverage [flag]                            [💻🔗] Enable or disable code coverage
  --no-coverage                                [💻🔗] Disable code coverage
  -cs, --coverage-settings <path>              [💻🔗] Path to a custom nyc.json file providing settings for
                                               instrumentation (relative to cwd or use $/ for provided ones) (default:
                                               "$/nyc.json")
  -ctd, --coverage-temp-dir <path>             [💻🔗] Directory to output raw coverage information to (relative to cwd)
                                               (default: ".nyc_output")
  -crd, --coverage-report-dir <path>           [💻🔗] Directory to store the coverage report files (relative to cwd)
                                               (default: "coverage")
  -cr, --coverage-reporters <reporter...>      [💻🔗] List of nyc reporters to use (text is always used) (default:
                                               ["lcov","cobertura"])
  -ccb, --coverage-check-branches <percent>    [💻🔗] What % of branches must be covered (default: 0)
  -ccf, --coverage-check-functions <percent>   [💻🔗] What % of functions must be covered (default: 0)
  -ccl, --coverage-check-lines <percent>       [💻🔗] What % of lines must be covered (default: 0)
  -ccs, --coverage-check-statements <percent>  [💻🔗] What % of statements must be covered (default: 0)
  -s, --serve-only [flag]                      [💻🔗] Serve only (default: false)
  --ui5 <url>                                  [💻] UI5 url (default: "https://ui5.sap.com")
  --disable-ui5                                [💻] Disable UI5 mapping (also disable libs) (default: false)
  --libs <lib...>                              [💻] Library mapping (<relative>=<path> or <path>)
  --mappings <mapping...>                      [💻] Custom mapping (<match>=<file|url>(<config>))
  --cache <path>                               [💻] Cache UI5 resources locally in the given folder (empty to disable)
  --preload <library...>                       [💻] Preload UI5 libraries in the cache folder (only if --cache is used)
  --testsuite <path>                           [💻] Path of the testsuite file (relative to webapp, URL parameters are
                                               supported) (default: "test/testsuite.qunit.html")
  -w, --watch [flag]                           [💻] Monitor the webapp folder and re-execute tests on change (default:
                                               false)
  -cp, --coverage-proxy [flag]                 [🔗] [⚠️ experimental] use internal proxy to instrument remote files
                                               (default: false)
  -cpi, --coverage-proxy-include <regexp>      [🔗] [⚠️ experimental] urls to instrument for coverage (default: {})
  -cpe, --coverage-proxy-exclude <regexp>      [🔗] [⚠️ experimental] urls to ignore for coverage (default: {})
  -h, --help                                   display help for command
```

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

For browser arguments, it is recommended to use `--` and pass them after. In the configuration file, use `browserArgs`.
