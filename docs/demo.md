---
"#type": task
title: How to demo
summary: Guided demo walking through legacy, remote, and capabilities modes with a sample UI5 app
keywords:
  - demo
  - walkthrough
  - legacy
  - remote
  - capabilities
relations:
  requires:
    - options/port
    - options/serveOnly
    - options/ui5
    - options/coverage
    - options/parallel
    - options/keepAlive
    - options/url
  see-also:
    - modes/legacy
    - modes/remote
---

# 🖥️ How to demo

> ⓘ The repository `training-ui5con18-opa` contains a sample UI5 application with qUnit and OPA tests. The project was modified to support many execution modes, including [online](https://arnaudbuchholz.github.io/training-ui5con18-opa/webapp/), local with `@ui5/cli` or with a standalone web server (`reserve`).

* Clone the project [`training-ui5con18-opa`](https://github.com/ArnaudBuchholz/training-ui5con18-opa)
* Change the current working directory to the cloned project and run `npm install`
* Install `ui5-test-runner` globally with `npm install ui5-test-runner --global`

## Testing with Karma

> ⓘ `Karma` requires configuration files, the execution model is based on sequential execution of all tests in one window. Last but not least, it is [deprecated](https://github.com/karma-runner/karma?tab=readme-ov-file#karma-is-deprecated-and-is-not-accepting-new-features-or-general-bug-fixes).

* Run `npm run karma` to test with the karma runner
  * Browser is visible
  * No coverage

* Run `npm run karma-ci` to test with the karma runner
  * Browser is hidden
  * Coverage is extracted

* Open `webapp\test\testsuite.qunit.html` which defines the test pages

## ui5-test-runner

* Run `ui5-test-runner --help`, the list of available options is displayed
* Open [`https://arnaudbuchholz.github.io/ui5-test-runner/`](https://arnaudbuchholz.github.io/ui5-test-runner/) to access complete documentation

## 💻 Legacy mode

> ⓘ The initial version of `ui5-test-runner` was designed to serve the application **and** run the tests.

### Serving the application

#### Default UI5 mapping

* Run `ui5-test-runner --port 8081 --serve-only`
* Browse to [`http://localhost:8081/`](http://localhost:8081/), the application starts
* In the application, use `[CTRL] + [SHIFT] + [P]` to see UI5 version

#### Changing UI5 version

* Browse to [`https://ui5.sap.com/neo-app.json`](https://ui5.sap.com/neo-app.json), it enumerates the list of available versions
* Pick a version and run `ui5-test-runner --port 8081 --serve-only --ui5 https://ui5.sap.com/<version>`
  * For instance : `ui5-test-runner --port 8081 --serve-only --ui5 https://ui5.sap.com/1.118.1`
* In a new browser window, open the debugger
* Disable the browser cache
* Browse to [`http://localhost:8081/`](http://localhost:8081/), the application starts
* In the application, use `[CTRL] + [SHIFT] + [P]` to see UI5 version

> ⓘ The switch works because the application does not use a fixed version of UI5. Instead, it loads a relative URL (`./resources/sap-ui-core.js`).

* In the debugger, go to the elements tab and expand the `<head>` tag

> ⚠️ By default, [`http://localhost:8081/resources/sap-ui-core.js`](http://localhost:8081/resources/sap-ui-core.js) redirects to [`https://ui5.sap.com/resources/sap-ui-core.js`](https://ui5.sap.com/resources/sap-ui-core.js). 

#### Running the qUnit and OPA tests

* Run `ui5-test-runner --port 8081 --serve-only`
* Browse to [`http://localhost:8081/test/testsuite.qunit.html`](http://localhost:8081/test/testsuite.qunit.html)

### Testing the application

* Run `ui5-test-runner --port 8081`
* Open `report/output.txt`, it summarizes the tests execution
* Open `report/report.html` in the browser, it details the tests execution

> ⓘ The runner logs everything: the `report/` contains a log file (extension `.log.gz`) which can be viewed using `ui5-test-runner --log <the log file path>.

### "Faster" testing

> ⓘ Performance is impacted by a variety of factors, augmenting the number of workers does not guarantee faster execution.

* Run `ui5-test-runner --port 8081 --parallel 4`
* Follow the progress of the tests using [`http://localhost:8081/_/progress.html`](http://localhost:8081/_/progress.html)

### Code coverage

* Run `ui5-test-runner --port 8081 --coverage`
* At the end of the execution, a textual report summarizes the coverage
* Open `coverage/lcov-report/index.html` in the browser
* Open `coverage/lcov.info` for raw coverage information

> ⓘ Thresholds can be defined to **fail** the command line if the coverage is below the expected ratio, see `--coverage-check-branches`, ` --coverage-check-functions`, `--coverage-check-lines`, `--coverage-check-statement`.

> ⓘ Coverage instrumentation is based on [`nyc`](https://www.npmjs.com/package/nyc), the process can be customized with a [configuration file](https://www.npmjs.com/package/nyc#configuration-files) and the option `--coverage-settings`.

* Run `ui5-test-runner --port 8081 --coverage --keep-alive`
* Browse to [`http://localhost:8081/component.js`](http://localhost:8081/component.js) to see instrumentated version

## 🔗 Remote mode

> ⓘ Starting with version 2, `ui5-test-runner` can execute UI5 tests even when the application is served externally.

### UI5 sample applications

* Browse to [https://ui5.sap.com/#/demoapps](https://ui5.sap.com/#/demoapps)
* Open the [Browse Orders](https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/mockServer.html?sap-ui-theme=sap_horizon) application
* The demo page also document tests links :
  * [Run Unit Tests](https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html)
  * [Run Integration Tests](https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html)
* Run `ui5-test-runner --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html`

### UI5 tooling

> ⓘ The [UI5 tooling](https://sap.github.io/ui5-tooling/stable/) is the **recommended** way to develop UI5 applications.

* Run `npm start`
* Browse to [`http://localhost:8080`](http://localhost:8080)
* Navigate to [`test/`](http://localhost:8080/test)
* Run `ui5-test-runner --port 8081 --url http://localhost:8080/test/testsuite.qunit.html`

#### Coverage with `@ui5/middleware-code-coverage`

* Run `npm start`
* Open `ui5.yaml`
* The `@ui5/middleware-code-coverage` can instrument files on the fly
* Open [`http://localhost:8080/component.js`](http://localhost:8080/component.js) in a new browser window
* Open [`http://localhost:8080/component.js?instrumented=true`](http://localhost:8080/component.js?instrumented=true) in a new browser window
* Run `ui5-test-runner --port 8081 --url http://localhost:8080/test/testsuite.qunit.html --coverage`

### Any server

* Run `npm run reserve`
* Browse to [`http://localhost:8080`](http://localhost:8080), the application starts
* Run `ui5-test-runner --port 8081 --url http://localhost:8080/test/testsuite.qunit.html`
