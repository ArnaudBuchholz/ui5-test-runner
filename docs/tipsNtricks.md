## Tips & tricks

* `ui5-test-runner` is regularly tested with the latest versions of `puppeteer`, `selenium-webdriver` and other packages. If you face troubles with one of these and you are not using the latest version *(the runner will generate a warning)*, try **upgrading**.

* Because of the asynchronous nature of `sap.ui.define` and `sap.ui.require`, tests are usually loaded *after* the QUnit framework. It is *recommended* to `QUnit.config.autostart = false;` as soon as possible to ensure the test framework waits for the tests to be loaded. `QUnit.start();` must be called once the tests are loaded. If not done properly, the `ui5-test-runner` is capable of running the tests and updates itself *while* the tests are being loaded. However, it might happen that the QUnit framework fails to handle the tests, which may also fail the runner.

* By default QUnit randomizes the unit tests order (not within OPA): use `QUnit.config.reorder = false;` to prevent this behavior. **NOTE**: this does not work if the `autostart` configuration is not done properly.

* The runner takes a screenshot for **every** OPA assertion (`Opa5.assert.ok`)

* To benefit from **parallelization**, split the OPA test pages per journey. Here is an example pattern : **declare** the list of journeys in [`AllJourneys.json`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/integration/AllJourneys.json) file, **enumerate** `AllJourneys.json` in [`testsuite.qunit.html`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/testsuite.qunit.html#L16) to declare as many pages as necessary and **modify** [`AllJourneys.js`](https://github.com/ArnaudBuchholz/training-ui5con18-opa/blob/main/webapp/test/integration/init.js#L22) to support a `journey=` parameter.
