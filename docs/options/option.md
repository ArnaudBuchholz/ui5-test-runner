Options can be used in different places :
* on the [[cli]] : the name of the option is either :
	* `-<s>`  where *s* is the short name
	* `--<kebab>` where kebab is the [kebab case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case) version of the option (for instance : [[failOpaFast]] becomes `--fail-opa-fast`)
* in a configuration file (see [[config]])

## Options

| name                     | short | description                                                                              | type            | multiple | default                     | defaultLabel              | flags      |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------- | --------------- | -------- | --------------------------- | ------------------------- | ---------- |
| [[cwd]]                  | c     | Set working directory                                                                    | folder          |          | process.cwd()               | current working directory | 💻🔗🧪     |
| [[version]]              |       | Shows version                                                                            | boolean         |          |                             |                           |            |
| [[help]]                 |       | Shows help                                                                               | boolean         |          |                             |                           |            |
| [[log]]                  |       | Read and dump log file (using jsonl format)                                              | file            |          |                             |                           | 🐞         |
| [[capabilities]]         |       | Run browser tests                                                                        | boolean         |          |                             |                           | 🧪         |
| [[url]]                  | u     | URL of the testsuite / page to test                                                      | url             | ✅        |                             |                           | 🔗         |
| [[config]]               |       | Configuration file                                                                       | file            |          | 'ui5-test-runner.json'      |                           | 💻🔗🧪     |
| [[port]]                 |       | Port to use                                                                              | integer         |          |                             |                           | 💻🔗🧪     |
| [[reportDir]]            | r     | Directory to output test reports                                                         | folder-recreate |          | 'report'                    |                           | 💻🔗🧪     |
| [[pageTimeout]]          | pt    | Limit the page execution time, fails the page if it takes longer than the timeout        | timeout         |          |                             |                           | 💻🔗🧪📡   |
| [[failFast]]             | f     | Stop the execution after the first failing page                                          | boolean         |          |                             |                           | 💻🔗🧪📡   |
| [[failOpaFast]]          | fo    | Stop the OPA page execution after the first failing test                                 | boolean         |          |                             |                           | 💻🔗🧪📡   |
| [[keepAlive]]            | k     | Keep the server alive                                                                    | boolean         |          |                             |                           | 💻🔗🧪📡   |
| [[logServer]]            | l     | Log inner server traces                                                                  | boolean         |          |                             |                           | 💻🔗🧪📡   |
| [[parallel]]             | p     | Number of parallel tests executions                                                      | integer         |          | 2                           |                           | 💻🔗🧪📡   |
| [[browser]]              | b     | Browser instantiation command (relative to cwd or use $/ for provided ones)              | file            |          | '$/puppeteer.js'            |                           | 💻🔗🧪📡   |
| [[alternateNpmPath]]     |       | Alternate NPM path to look for packages (priority: local, alternate, global)             | folder          |          |                             |                           | 💻🔗📡     |
| [[noNpmInstall]]         |       | Prevent any NPM install (execution may fail if a dependency is missing)                  | boolean         |          |                             |                           | 💻🔗🧪📡   |
| [[outputInterval]]       | oi    | Interval for reporting progress on non interactive output (CI/CD)                        | timeout         |          | 3000                        |                           | 💻🔗🧪📡   |
| [[localhost]]            |       | Hostname for legacy URLs and callbacks                                                   | string          |          | 'localhost'                 |                           | 💣💻🔗🧪📡 |
| [[ci]]                   |       | CI mode (no interactive output)                                                          | boolean         |          | !process.stdout.isTTY       |                           | 💻🔗🧪📡   |
| [[webapp]]               |       | Base folder of the web application                                                       | folder          |          |                             |                           | 💻🔗       |
| [[pageFilter]]           | pf    | Filter out pages not matching the regexp                                                 | regexp          |          |                             |                           | 💻🔗📡     |
| [[pageParams]]           | pp    | Add parameters to page URL                                                               | string          |          |                             |                           | 💻🔗📡     |
| [[globalTimeout]]        | t     | Limit the tests execution time, fail remaining pages if it takes longer than the timeout | timeout         |          |                             |                           | 💻🔗📡     |
| [[serveOnly]]            | s     | Serve only                                                                               | boolean         |          |                             |                           | 💻🔗       |
| [[ui5]]                  |       | UI5 url                                                                                  | url             |          | 'https://ui5.sap.com'       |                           | 💻📡       |
| [[testsuite]]            |       | Path of the testsuite file (relative to webapp, URL parameters are supported)            | file            |          | 'test/testsuite.qunit.html' |                           | 💻         |
| [[debugKeepBrowserOpen]] |       | Keeps the browser open after the test completed                                          | boolean         |          |                             |                           | 🐞         |
