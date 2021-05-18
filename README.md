# UI5 Test runner

[![Package Quality](https://npm.packagequality.com/shield/ui5-test-runner.svg)](https://packagequality.com/#?package=ui5-test-runner)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner?targetFile=package.json)
[![dependencies Status](https://david-dm.org/ArnaudBuchholz/ui5-test-runner/status.svg)](https://david-dm.org/ArnaudBuchholz/ui5-test-runner)
[![devDependencies Status](https://david-dm.org/ArnaudBuchholz/ui5-test-runner/dev-status.svg)](https://david-dm.org/ArnaudBuchholz/ui5-test-runner?type=dev)
[![ui5-test-runner](https://badge.fury.io/js/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![ui5-test-runner](http://img.shields.io/npm/dm/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![install size](https://packagephobia.now.sh/badge?p=ui5-test-runner)](https://packagephobia.now.sh/result?p=ui5-test-runner)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
| pageParams | `''` | Parameters added to each page URL.<br/>For instance : `'sap-ui-theme=sap_belize&sap-ui-debug=true'` |
| pageTimeout | `0` | Limit the page execution time, fails the page if it takes longer than the timeout (`0` to disable the timeout) |
| globalTimeout | `0` | Limit the pages execution time, fails the execution if it takes longer than the timeout (`0` to disable the timeout) |
| keepAlive | `false` | Keeps the server alive *(enables debugging)* |
| watch | `false` | Monitors the webapp folder and re-execute tests on change |
| logServer | `false` | Logs REserve traces |
| browser | *String, see description* | Browser instanciation command, it should point to a node.js script (absolute or relative to `cwd`).<br/>By default, a script will instantiate chromium through puppetteer |
| args | `'__URL__ __REPORT__'` | Browser instanciation arguments :<ul><li>`'__URL__'` is replaced with the URL to open</li><li>`'__REPORT__'` is replaced with a folder path that is associated with the current URL <i>(can be used to store additional traces such as console logs or screenshots)</i></li></ul> |
| parallel | `2` | Number of parallel tests executions (`0` to ignore tests and keep alive) |
| tstReportDir | `'report'` | Directory to output test reports *(relative to `cwd`)* |
| coverage | `true` | Enables code coverage |
| covSettings | *String, see description* | Path to a custom `nyc.json` file providing settings for instrumentation *(relative to `cwd`)* |
| covTempDir | `'.nyc_output'` | Directory to output raw coverage information to *(relative to `cwd`)* |
| covReportDir | `'coverage'` | Where to put the coverage report files *(relative to `cwd`)* |
| covReporters | `'lcov,cobertura'` | Comma separated list of reporters to use |
