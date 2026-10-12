---
"#type": task
title: Tips & tricks
summary: Practical tips for troubleshooting, performance tuning, and IDE integration
keywords:
  - tips
  - tricks
  - performance
  - troubleshooting
  - ide
  - parallelism
relations:
  requires:
    - options/parallel
    - options/pageFilter
    - options/browserVisible
    - options/debugKeepBrowserOpen
    - options/splitOpa
    - options/screenshotOnFailure
    - options/pageParams
    - options/browser
  see-also:
    - debug
---
# Tips & tricks

## 🐞 Troubleshooting

> When the tests are *timing out* or generate *unexpected* results, the following options might help to gather more information.

* Lower the parallelism (`--parallel 1`) and focus on the failing test page (`--page-filter`).

* Use `--browser-visible` (for instance: `ui5-test-runner --browser-visible`) to display the browser while running the tests.

* When the browser is visible, use the option `--debug-keep-browser-open` to prevent the browser closing when the tests are completed: it gives access to the console log and the network traces.

## ⛑ Problems

* Since version 17, node prefers IP v6 over IP v4. This may **prevent** the process to properly connect to `localhost`. Either prefer url with `http://127.0.0.1` or use the environment variable `NODE_OPTIONS=--dns-result-order=ipv4first`.

* `ui5-test-runner` is regularly tested with the latest versions of `puppeteer`, `selenium-webdriver` and other packages. If you face troubles with one of these and you are not using the latest version *(the runner will generate the PKGVRS warning)*, try **upgrading**.

* Because of the asynchronous nature of `sap.ui.define` and `sap.ui.require`, tests are usually loaded *after* the QUnit framework. It is *recommended* to execute `QUnit.config.autostart = false;` as soon as possible to ensure the test framework waits for the tests to be loaded and then call `QUnit.start();`. If not done properly, the `ui5-test-runner` is capable of running the tests and updates itself *while* the tests are being loaded. However, it might happen that the QUnit framework fails to handle the tests, which may also fail the runner.

* By default QUnit randomizes the unit tests order (not within OPA): use `QUnit.config.reorder = false;` to prevent this behavior. **NOTE**: this does not work if the `autostart` configuration is not done properly.

* For language testing, it is recommended to use `--page-params` with `sap-ui-language=DE` (for instance).

## 👟 Performances

* Screenshots per OPA assertion are **disabled by default**. Enable them with `--screenshot` if you want a snapshot after every `Opa5.assert.ok` call. By default, a screenshot is only captured when a test fails (`--screenshot-on-failure`, which is on by default).

* To benefit from **parallelization**, use the option `--split-opa` (available from version `4.5.0`) : it automatically splits the OPA journeys into different test pages.

## ✍ IDEs

* `ui5-test-runner` runs in [Business Application Studio](https://www.sap.com/products/technology-platform/business-application-studio.html) provided the instance is created with the `Headless Testing Framework` extension. Then configure the runner to use the `webdriverio` driver combined with the `firefox` browser. For instance: `ui5-test-runner --driver webdriverio --browser firefox`.

> ⚠️ As of March 2025, it is recommended to install `webdriverio@8` first as it works better than the latest one.
