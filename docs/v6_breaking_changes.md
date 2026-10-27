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
  - basic authentication
  - credentials
relations:
  requires:
    - options/lib
    - options/log
    - options/screenshotOnFailure
    - options/end
    - options/start
    - options/coverage
    - options/screenshot
    - options/driver
    - options/browser
    - options/browserOptions
    - options/browserDevice
    - options/batchTimeout
    - options/browserVisible
    - options/browserBasicAuthUsername
    - options/browserBasicAuthPassword
  see-also:
    - v5_options
    - report
    - options/junitXmlFilename
---
# version 6 breaking changes

Version 6 is a new major release and even if the best effort was made to keep backward compatibility, it comes with significant breaking changes. Use this guide as a migration guide from version 5.

## How to migrate your configuration

Migrate option by option — do not stop at a general overview. Inventory **every** option the project actually sets, across both its command line (the `ui5-test-runner` invocation in the `package.json` script, or wherever it is launched) and its configuration file (`ui5-test-runner.json`, or the file passed to `--config`). **If the command line contains `--config <file>`, read that file — it is the configuration file for this project, not `ui5-test-runner.json`.** The same option may appear as a CLI flag (kebab-case, e.g. `--report-generator`) or as a configuration-file key (camelCase, e.g. `reportGenerator`) — these are the same option, so translate between the two spellings before looking it up here.

Then, for each option the project sets, determine from the sections below exactly one outcome and state it, naming the option:

* **still supported** — it works unchanged in version 6 (do not flag it as a problem);
* **renamed** — it exists under a new name (give the new name, e.g. `--libs` → [`--lib`](./options/lib.md));
* **default changed** — it still exists but its default behaviour differs (say how, e.g. coverage and screenshots are now off by default);
* **replaced** — it is gone but another option covers the need (name the replacement, e.g. `--browser-args` → [`--browser-options`](./options/browserOptions.md));
* **removed** — it no longer exists and has no replacement.

An option the project sets that is not mentioned anywhere in this guide is **still supported** — keep it as is. A reader must be able to find each option their project currently uses in your answer.

## Drop support of old Node.js versions

Version 6 depends on Node.js 24 (>=24.11.1).

## Drop support of JSOM browser emulation

JSDOM browser emulation is no more supported.

## Drop support of dynamic reporting

In version 5, it was possible to open a browser and monitor the tests execution by visualizing a report being dynamically updated (for instance : http://localhost:8081/_/progress.html).

This feature has been removed and is replaced with the possibility to visualize the traces in real time, see the [`--log`](./options/log.md) option.

## Browser selection

> **⛔ Applicability gate — check first, before reading any further in this section.**
>
> Scan the project's command line and configuration file for any of these options (CLI flag or config key): `--browser` / `browser`, `--browser-args` / `browserArgs`, `--browser-retry` / `browserRetry`, `--browser-close-timeout` / `browserCloseTimeout`. A configuration file uses the camelCase key (e.g. `"browser": "$/puppeteer.js"` in `ui5-test-runner.json` is the `--browser` option).
>
> * **None of them present → STOP.** Browser selection was never configured. Version 6 defaults apply unchanged. **Do not mention browser selection, driver selection, `--driver`, `--browser`, `--browser-options`, `--browser-device`, or `--unsecure` anywhere in your answer.** Skip the rest of this section entirely.
> * **At least one present → continue reading below.**

### Changes for projects that configured browser selection

For projects that did select a browser in version 5: the browser was instantiated through a command script passed to `--browser` (for instance `--browser $/puppeteer.js`), and arguments were forwarded with `--browser-args` (or `browserArgs` in the configuration file).

Version 6 splits this into two options:

* [`--driver`](./options/driver.md) selects the automation engine (`puppeteer`, `playwright`, `webdriverio` or `selenium-webdriver`).
* [`--browser`](./options/browser.md) selects the browser as an enumeration (`chrome`, `chromium`, `firefox`, `webkit`, `edge` or `safari`), validated against the chosen driver.

As a consequence, the following options have been removed:

* `--browser` no more accepts a command script path.
* `--browser-args` (and `browserArgs`) is replaced with [`--browser-options`](./options/browserOptions.md), accepting browser-specific options as JSON.
* `--browser-close-timeout` (`-bt`) is removed.
* `--browser-retry` (`-br`) is removed.
* `--unsecure` (`-u`), typically passed through `--browser-args`/`browserArgs`, is no more needed and must be dropped — do not carry it into `--browser-options`. It existed to relax browser security (e.g. Chrome's local-network-access check) so the test page could reach the runner; with the version 6 agent paradigm the agent is injected into the page and its state is fetched by the runner, so no such relaxation is required.
* Puppeteer's nested `--device <name>` option, typically passed through `--browser-args`/`browserArgs`, is replaced with the dedicated [`--browser-device <name>`](./options/browserDevice.md) option (`browserDevice` config key). It requires the `puppeteer` driver with Chrome.

  **`--browser-device` sets three properties simultaneously: the viewport dimensions, the user agent string, and touch support.** It overrides `--browser-viewport-width` and `--browser-viewport-height` — any viewport flags set alongside it are ignored.

```bash
# v5 (Puppeteer-specific flag, passed after --)
ui5-test-runner --browser $/puppeteer.js -- --device "iPhone X"

# v6: --browser-device sets viewport, user agent, and touch support (overrides --browser-viewport-width and --browser-viewport-height)
ui5-test-runner --driver puppeteer --browser-device "iPhone X"
```

### ⚠️ Implicit Chrome flags from the version 5 default driver

> **Applicability trigger — check this explicitly.** This change applies whenever the project uses (or migrates to) the **puppeteer** driver with Chrome/Chromium. It becomes a **breaking, launch-blocking** problem when the tests run in a **container or restricted CI host** — look for a `Dockerfile`, a `.github/workflows` / CI configuration, a `--ci` flag, or a `--no-sandbox` already appearing anywhere. **If any of these is present, you must surface this topic in your answer** and tell the reader exactly which flags to restore; do not treat it as optional background.

In version 5, the default Puppeteer driver hardcoded a set of Chrome launch flags in its `chromeArgs()` function. Version 6 removed the default-driver layer, so **these flags are no longer applied automatically**. The flags that version 5 applied for you, and that version 6 does not, are:

* `--no-sandbox` — **the critical one.** Chrome refuses to start on a host with no usable user-namespace sandbox (most containers, and Linux CI runners such as Ubuntu 23.10+). A project that ran green in version 5 inside a container will fail to launch the browser in version 6 until this flag is passed explicitly.
* `--disable-gpu`
* `--disable-extensions`
* `--log-level=3`
* `--headless=new` — applied when the browser was not visible.

⚠️ **Because version 6 drops `--no-sandbox`, a containerized or CI run that relied on the version 5 default will now fail to launch the browser** — often with `No usable sandbox!` in the logs. This is the single most likely upgrade breakage for dockerized projects. You must pass the flags your environment needs explicitly, through either surface — the two are additive:

```bash
# via --browser-options (browserOptions config key)
ui5-test-runner --driver puppeteer --browser-options '{"args":["--no-sandbox","--disable-dev-shm-usage"]}'

# or via the UI5TR_CHROME_ARGS environment variable
UI5TR_CHROME_ARGS="--no-sandbox --disable-dev-shm-usage" ui5-test-runner --driver puppeteer
```

When answering a migration question for such a project, name the dropped flags individually (at minimum `--no-sandbox`, `--disable-gpu`, `--disable-extensions`) and give both ways to restore them (`--browser-options` / `browserOptions`, and `UI5TR_CHROME_ARGS`).

## Basic authentication

In version 5, HTTP basic authentication was configured through puppeteer-specific sub-options passed via `--browser-args`:

* `--basic-auth-username <username>`
* `--basic-auth-password <password>`

These are **replaced** in version 6 by two dedicated options that work with both the `puppeteer` and `playwright` drivers:

* [`--browser-basic-auth-username`](./options/browserBasicAuthUsername.md)
* [`--browser-basic-auth-password`](./options/browserBasicAuthPassword.md)

The password is stored as a secret value and is never written to logs, reports, or `--dump-config` output.

```bash
# v5 (puppeteer-specific flags, passed after --)
ui5-test-runner --url http://host/test/testsuite.qunit.html -- --basic-auth-username myuser --basic-auth-password mypassword

# v6
ui5-test-runner --url http://host/test/testsuite.qunit.html --browser-basic-auth-username myuser --browser-basic-auth-password mypassword
```

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

* `--capabilities` (config key `capabilities`) : the browser capabilities tester mode no more exists.
* `--log-server` (`-l`) : inner server traces are now part of the trace logging, see [`--log`](./options/log.md).
* `--env` : environment variables are no more set through the runner as a dedicated option. Instead, [`--start`](./options/start.md) and [`--end`](./options/end.md) both accept `KEY=value` assignments placed before the executable (e.g. `TEST_ENV=production node server.js`), which are injected into the spawned process.
* `--offline` : use [`--no-npm-install`](./options/noNpmInstall.md) to limit NPM usage.
* `--deep-probe` and `--probe-parallel` : the probing mechanism changed with the agent paradigm.
* `--page-close-timeout` : page closing is no more individually timed.
* `--watch-folder` : [`--watch`](./options/watch.md) no more accepts a companion folder option.
* `--coverage-remote-scanner` (`-crs`) : removed together with the experimental coverage proxy.
* `--keep-alive` (`-k`) : became useless, use [`--serve-only`](./options/serveOnly.md) to keep the server running and serve the application without running tests.

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

* coverage is now disabled by default, deprecating `--no-coverage`. The [`--coverage`](./options/coverage.md) option still exists and works as before — a version 5 project that relied on default coverage, or already passed `--coverage`, keeps coverage by passing `--coverage`.
* screenshots are disabled by default, deprecating `--no-screenshot`
* in remote mode, files served under `resources/` and `test-resources/` are no longer instrumented for coverage by default (this avoids busting the browser cache and defeating UI5 preload bundling). Application code is unaffected. When testing a UI5 library whose sources are served under `resources/`, use the new [`--coverage-remote-instrument`](./options/coverageRemoteInstrument.md) option to opt the relevant sub-paths back in.

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

The report-generator mechanism has been removed. The version 5 option — the `--report-generator` CLI flag (short `-rg`), equivalently the `reportGenerator` key in a configuration file — no longer exists in version 6. A project that sets `reportGenerator` must drop it. If post-processing of the report is still needed, use [`--end`](./options/end.md) instead: the end command runs after the test run completes and can post-process the report file.

### Report format

Version 6 introduced a new report format based on the Common Test Report Format specification, see [report](./report.md).

### JUnit XML report

A `junit.xml` file is now **always generated by default** alongside `report.json` and `report.html`. Use [`--junit-xml-filename`](./options/junitXmlFilename.md) to change the filename, or set it to an empty string to disable this output.

## Uncaught errors

In version 6, an **uncaught error** on a test page now **fails that page's tests**. The runner synthesizes a `failed` entry named after the page URL, with the message `Uncaught error(s): N (first: <Name>: <message>), check the logs` and the first error's stack trace attached. See [report](./report.md) for how these entries appear.

This is a deliberate behavior change from version 5. An uncaught error means the test page — or the production code it exercises — is not behaving properly. Failing the test surfaces the problem as early as possible, instead of letting a broken page report green and hiding a real defect until much later.

There is one exception. QUnit occasionally raises `Called start() outside of a test context too many times` from its own source (`qunit-2.js` or `qunit.js`). This is a known-benign QUnit timing artifact rather than a product defect, so the runner logs it as a warning (`uncaught error (expected)`) and does **not** fail the test.
