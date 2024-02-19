# 🖥️ How to demo

> ⓘ The repository `training-ui5con18-opa` contains a sample UI5 application with qUnit and OPA tests *(100% coverage)*. The project was modified to support many execution modes, including `@ui5/cli` or a standalone web server (`reserve`).

* Clone the project [`training-ui5con18-opa`](https://github.com/ArnaudBuchholz/training-ui5con18-opa)
* Change the current working directory to the cloned project and run `npm install`
* Install `ui5-test-runner` globally with `npm install ui5-test-runner --global`

## Karma

> ⓘ `Karma` requires configuration files, the execution model is based on sequential execution of all tests in one window. Last but not least, it is [deprecated](https://github.com/karma-runner/karma?tab=readme-ov-file#karma-is-deprecated-and-is-not-accepting-new-features-or-general-bug-fixes).

* Run `npm run karma` to test with the karma runner
  * Browser is visible
  * No coverage

* Run `npm run karma-ci` to test with the karma runner
  * Browser is hidden
  * Coverage is extracted

* Open `webapp\test\testsuite.qunit.html` which defines the test pages

## Legacy mode

> ⓘ The initial version of `ui5-test-runner` was designed to serve the application.

### Serving the application

#### Default UI5 mapping

* Run `ui5-test-runner --port 8080 --serve-only`
* Browse to [http://localhost:8080/](http://localhost:8080/), the application starts
* In the application, use `[CTRL] + [SHIFT] + [P]` to see UI5 version

#### Changing UI5 version

* Browse to [https://ui5.sap.com/neo-app.json](https://ui5.sap.com/neo-app.json), it enumerates the list of available versions
* Pick a version and run `ui5-test-runner --port 8080 --serve-only --ui5 https://ui5.sap.com/<version>`
  * For instance : `ui5-test-runner --port 8080 --serve-only --ui5 https://ui5.sap.com/1.118.1`
* In a new browser window, open the debugger
* Disable the browser cache
* Browse to [http://localhost:8080/](http://localhost:8080/), the application starts
* In the application, use `[CTRL] + [SHIFT] + [P]` to see UI5 version

> ⓘ The switch works because the application does not use a fixed version of UI5. Instead, it loads `/resources/sap-ui-core.js`

* In the debugger, go to the elements tab and expand the `<head>` tag

> ⚠️ The `--cache` option enables the caching of UI5 files locally. It may speed up the tests.

#### Running the tests

* Run `ui5-test-runner --port 8080 --serve-only`
* Browse to [http://localhost:8080/test/testsuite.qunit.html](http://localhost:8080/test/testsuite.qunit.html)

### Testing the application

* Run `ui5-test-runner --port 8080`
* Follow the progress of the tests using [http://localhost:8080/_/progress.html](http://localhost:8080/_/progress.html)
* Open `report\output.txt`, it summarizes the test execution
* Open `report\report.html` in the browser, it details the test execution

> ⓘ The runner logs everything *(depending on the driver)*. Each test page is associated to a folder which name is shown in front of the page URL in the `output.txt`. For instance, `http://localhost:8080/test/unit/unitTests.qunit.html` is associated to the folder `le6KDh_XnDk`. The folder name is a hash based on the test page URL.

* Expand the folder associated to the unit tests (`le6KDh_XnDk`)
  * `done.png` : a screenshot captured after tests completion
  * `console.csv` : the browser console logs
  * `network.csv` : the browser network traces
  * `browser.json` : *(internal)* the browser instantiation file
  * `stdout.txt` : *(internal)* the driver standard output
  * `stderr.txt` : *(internal)* the driver error output
* Expand the folder associated to the `TodoListJourney` journey (`9NHJd7F6A5c`)
  * `<testid>-<elapsed>.png` : a screenshot is captured for every assertion

### Testing the application with coverage

* Run `ui5-test-runner --port 8080 --coverage`
* At the end of the execution, a textual report details the coverage
* Open `coverage\lcov-report\index.html` in the browser

TODO: Use keep alive and show instrumented files

## Remote mode

* *Serving the application with `@ui5/cli`*
  * Use `npm start` to serve the application with `@ui5/cli`
  * `npx ui5-test-runner --port 8081 --url http://localhost:8080/test/testsuite.qunit.html --keep-alive`
  * Follow the progress of the test executions using http://localhost:8081/_/progress.html

### UI5 Sample applications

* Browse to [https://ui5.sap.com/#/demoapps](https://ui5.sap.com/#/demoapps)
* Show the [Browse Orders](https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/mockServer.html?sap-ui-theme=sap_horizon) app and tests links

`ui5-test-runner --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html`


 ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/unitTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/opaTestsComponent.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/unit/unitTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/opaTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/tutorial/testing/14/webapp/test/unit/unitTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/tutorial/testing/14/webapp/test/integration/opaTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/tutorial/worklist/07/webapp/test/testsuite.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/tutorial/walkthrough/37/webapp/test/unit/unitTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/m/demokit/tutorial/walkthrough/37/webapp/test/integration/opaTests.qunit.html ^
  -u https://ui5.sap.com/test-resources/sap/suite/ui/commons/demokit/icecream/webapp/test/unit/unitTests.qunit.html ^  
  -- 

  ### @ui5/cli

  ### Any server

  ## Remote mode & coverage