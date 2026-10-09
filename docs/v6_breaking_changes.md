---
"#type": task
title: Version 6 breaking changes
summary: Migrate from version 5 to version 6, covering dropped features, removed options, and new defaults
keywords:
  - migration
  - breaking changes
  - v6
  - upgrade
  - deprecation
  - removed options
relations:
  requires:
    - options/lib
    - options/log
    - options/screenshotOnFailure
    - options/end
    - options/coverage
    - options/screenshot
    - options/driver
    - options/browser
    - options/browserOptions
    - options/batchTimeout
    - options/browserVisible
  see-also:
    - v5_options
    - report
---

# version 6 breaking changes

Version 6 is a new major release and even if the best effort was made to keep backward compatibility, it comes with significant breaking changes. Use this guide as a migration guide from version 5.

## Drop support of old Node.js versions

Version 6 depends on Node.js 24 (>=24.11.1).

## Drop support of JSOM browser emulation

JSDOM browser emulation is no more supported.

## Drop support of dynamic reporting

In version 5, it was possible to open a browser and monitor the tests execution by visualizing a report being dynamically updated (for instance : http://localhost:8081/_/progress.html).

This feature has been removed and is replaced with the possibility to visualize the traces in real time, see the [`--log`](./options/log.md) option.

## Browser selection

In version 5, the browser was instantiated through a command script passed to `--browser` (for instance `--browser $/puppeteer.js`), and arguments were forwarded with `--browser-args` (or `browserArgs` in the configuration file).

Version 6 splits this into two options:

* [`--driver`](./options/driver.md) selects the automation engine (`puppeteer`, `playwright`, `webdriverio` or `selenium-webdriver`).
* [`--browser`](./options/browser.md) selects the browser as an enumeration (`chrome`, `chromium`, `firefox`, `webkit`, `edge` or `safari`), validated against the chosen driver.

As a consequence, the following options have been removed:

* `--browser` no more accepts a command script path.
* `--browser-args` (and `browserArgs`) is replaced with [`--browser-options`](./options/browserOptions.md), accepting browser-specific options as JSON.
* `--browser-close-timeout` (`-bt`) is removed.
* `--browser-retry` (`-br`) is removed.

## Options

### Drop of experimental options

In version 5, some options were developped but *flagged* as experimental :

* `--jest`
* `--qunit-batch-size`
* `--coverage-proxy`
* `--coverage-proxy-include`
* `--coverage-proxy-exclude`

They are **not** maintained in version 6.

### Removed options

Beside the browser options described above, the following version 5 options have been removed with no direct replacement:

* `--capabilities` : the browser capabilities tester mode no more exists.
* `--log-server` (`-l`) : inner server traces are now part of the trace logging, see [`--log`](./options/log.md).
* `--env` : environment variables are no more set through the runner.
* `--offline` : use [`--no-npm-install`](./options/noNpmInstall.md) to limit NPM usage.
* `--deep-probe` and `--probe-parallel` : the probing mechanism changed with the agent paradigm.
* `--page-close-timeout` : page closing is no more individually timed.
* `--watch-folder` : [`--watch`](./options/watch.md) no more accepts a companion folder option.
* `--coverage-remote-scanner` (`-crs`) : removed together with the experimental coverage proxy.

### `--localhost`

Because of the paradigm shift, the test page does not have to post feedback to the runner anymore (instead, an agent is injected in the test page and its state is fetched by the runner).
As a consequence, the `--localhost` option is no more needed and has been removed.

### UI5 caching

By default, only one browser is created to test all pages in parallel. This generates several benefits :

* Faster bootstrap to allocate a new test page
* Native caching of UI5 resources

The `--cache` and `--preload` options have been removed.

### UI5 mapping

The following version 5 UI5 mapping options have been removed:

* `--disable-ui5` : the UI5 mapping is no more disabled this way.
* `--mappings` : custom mappings are no more supported, use [`--lib`](./options/lib.md) for library mapping.

### New defaults

* coverage is disabled by default, deprecating `--no-coverage` 
* screenshots are disabled by default, deprecating `--no-screenshot`

### Renaming

To maintain consistency with other multiple options (like `--url`), `--libs` is renamed to [`--lib`](./options/lib.md).

### Reused short flags

⚠️ Some single-letter short flags now point to a different option than in version 5. Scripts relying on them must be reviewed:

* `-V` was `--version` in version 5, it is now [`--browser-visible`](./options/browserVisible.md) (`--version` has no short flag anymore).
* `-bt` was `--browser-close-timeout` in version 5, it is now [`--batch-timeout`](./options/batchTimeout.md).

## Screenshots

### Screenshots scope

Screenshots are only taken for OPA test cases, there is no benefit to capture screenshot on QUnit test cases.

### Screenshot on failure

By default, a screenshot is always captured if a test fails within the page. It does not depend anymore on `--screenshot`. See [`--screenshot-on-failure`](./options/screenshotOnFailure.md).

## Reports

### Report generators

The option `--repoort-generators` does not exist anymore. If needed, use the end command (see [`--end`](./options/end.md)).

### Report format

Version 6 introduced a new report format based on the Common Test Report Format specification, see [report](./report.md).
