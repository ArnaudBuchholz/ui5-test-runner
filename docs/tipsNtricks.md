## Tips & tricks

* `ui5-test-runner` is regularly tested with the latest versions of `puppeteer`, `selenium-webdriver` and other packages. If you face troubles with one of these and you are not using the latest version *(the runner will generate a warning)*, try **upgrading**.

* Because of the asynchronous nature of `sap.ui.define` and `sap.ui.require`, tests are usually loaded *after* the QUnit framework. It is *recommended* to execute `QUnit.config.autostart = false;` as soon as possible to ensure the test framework waits for the tests to be loaded and then call `QUnit.start();`. If not done properly, the `ui5-test-runner` is capable of running the tests and updates itself *while* the tests are being loaded. However, it might happen that the QUnit framework fails to handle the tests, which may also fail the runner.

* By default QUnit randomizes the unit tests order (not within OPA): use `QUnit.config.reorder = false;` to prevent this behavior. **NOTE**: this does not work if the `autostart` configuration is not done properly.

* The runner takes a screenshot for **every** OPA assertion (`Opa5.assert.ok`) : disabling screenshots will speed up the tests. Yet, if a test fails, a screenshot is captured after the error.

* To benefit from **parallelization**, use the option `--split-opa` (available from version `4.5.0`) : it automatically splits the OPA journeys into different test pages.

* `ui5-test-runner` runs in [Business Application Studio](https://www.sap.com/products/technology-platform/business-application-studio.html) provided the instance is created with the `Headless Testing Framework` extension. Then configure the runner to use the `webdriverio` browser combined with the `firefox` setting. For instance : `ui5-test-runner --browser $/webdriverio.js -- --browser firefox`.