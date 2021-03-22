# UI5 Test runner

A test runner for UI5 applications enabling parallel execution of tests.

## Documentation

Concept is detailled in the  article [REserve - Testing UI5](https://arnaud-buchholz.medium.com/reserve-testing-ui5-85187d5eb7f1)

## How to install

* `npm install -g ui5-test-runner`

## How to demo

* Clone the project [training-ui5con18-opa](https://github.com/ArnaudBuchholz/training-ui5con18-opa) and run `npm install`
* Inside the project, use `npm run karma` to test with the karma runner
* Inside the project, use `ui5-test-runner -port:8080 -ui5:https://ui5.sap.com/1.87.0/ -cache:.ui5`
* You may follow the progress of the test executions using http://localhost:8080/_/progress.html

## Parameters

| name | default | description |
|---|---|---|
| cwd | `process.cwd()` | Current working directory |
| port | `0` | port to use (`0` to let REserve allocate one) |
| ui5 | `'https://ui5.sap.com/1.87.0'` | UI5 url |
| libs | `''` | Folder containing dependent libraries *(relative to `cwd`)* |
| cache | `''` | Cache UI5 resources locally in the given folder *(empty to disable)* |
| webapp | `'webapp'` | base folder of the web application *(relative to `cwd`)* |
| pageFilter | `''` | [regexp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) to select which pages to execute |
| keepAlive | `false` | Keeps the server alive *(enables debugging)* |
| logServer | `false` | Logs REserve traces |
| browser | *String, see description* | Browser instanciation command, it should point to a node.js script (absolute or relative to `cwd`). By default, a script will instantiate chromium through puppetteer. |
| args | `'__URL__'` | Browser instanciation arguments. The string `'__URL__'` is replaced with the URL to open</li> |
| parallel | `2` | Number of parallel tests executions (`0` to ignore tests) |
| tstReportDir | `'report'` | Directory to output test reports *(relative to `cwd`)* |
| coverage | `true` | Enables code coverage |
| covSettings | *String, see description* | Path to a custom `nyc.json` file providing settings for instrumentation *(relative to `cwd`)*. By default, tests folders are *not* excluded |
| covTempDir | `'.nyc_output'` | Directory to output raw coverage information to *(relative to `cwd`)* |
| covReportDir | `'coverage'` | Where to put the coverage report files *(relative to `cwd`)* |
| covReporters | `'lcov,cobertura'` | Comma separated list of reporters to use |
