# Introduction

## What is ui5-test-runner?

ui5-test-runner is a command-line test runner built specifically for UI5 applications. It runs your QUnit and OPA5 test pages in parallel across real browsers and produces a consolidated report of every test result — without requiring any changes to your existing tests.

## The problem it solves

If you work on a UI5 application with a large test suite, you may have hit this wall:

> Some UI5 applications have so many tests that when you run them in a browser, it ends up crashing. The main reason is memory consumption: the browser process goes up to 2 GB and it blows up. JavaScript is based on garbage collecting but it needs time to operate and the stress caused by executing the tests as well as the use of iframes do not let enough bandwidth for the browser to free up the memory.

The traditional approach — running tests through Karma in a single browser instance — hits a hard limit at scale. Karma loads every test module into the same page context; as the suite grows, so does memory pressure, until the browser crashes or the run becomes unreliable.

ui5-test-runner solves this by running each test page in its own **dedicated browser context**. No test page shares memory or global state with another. When a page's tests are complete, that slot is freed for the next pending page. The result is a run that is both more reliable (no accumulated state between pages) and faster (pages execute in parallel).

## How it works

When you run ui5-test-runner it:

1. Discovers the list of test pages from your QUnit test suite definition
2. Opens a configurable number of browser tabs in parallel (controlled by `--parallel`, default: `2`)
3. Injects a lightweight agent into each tab to detect the test framework and collect results
4. Polls each tab until its tests complete, then frees that slot for the next pending page
5. Assembles all results into a consolidated report

Nothing in your test files needs to change. The runner works with your existing QUnit and OPA5 pages as-is.

## The three modes

### Remote mode — test an already-running application

The simplest entry point. Your application is served by any means (`@ui5/cli`, a custom server, a corporate environment), and you point the runner at its test suite URL.

```bash
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html
```

This mode imposes the fewest constraints: the runner does not need access to your source files and is agnostic to how the application is served. It is the recommended starting point for most projects.

Code coverage is also available in remote mode when your application server pre-instruments the source files — for example using `@ui5/middleware-code-coverage` with `@ui5/cli`.

→ [Testing a running application](testing.md) — remote mode options, coverage configuration, and usage examples.

### Legacy mode — serve and test in one step

The runner acts as the web server for your application. This unlocks additional features: automatic source file instrumentation for coverage, the ability to select a specific UI5 version, and custom resource mappings.

```bash
ui5-test-runner --port 8081 --libs mylib=src
```

Use this mode when you do not have a separate serve step or when you need the runner to control how files are served.

→ [Legacy mode](modes/legacy.md) — serving options, resource mappings, and automatic coverage instrumentation.

### Batch mode — test multiple projects in one run

Runs several applications in a single invocation. Accepts a folder, a configuration file, or a regular expression to discover projects. Each project runs as an independent child process; a failure in one does not abort the others.

```bash
ui5-test-runner --batch apps/
```

Batch mode is useful for monorepos and CI pipelines that own multiple UI5 applications.

→ [Batch mode](modes/batch.md) — configuration, conditional execution, and report structure.

## Supported test frameworks

ui5-test-runner works with:

- **QUnit** — unit tests; the agent auto-detects QUnit on the page
- **OPA5** — integration tests; optionally split per QUnit module (`--split-opa`) for additional parallelism

No changes to your test files are required in either case.

## Browser support

The automation library is configurable. ui5-test-runner ships with built-in adapters for the most common browser automation libraries:

| Adapter | Browsers |
|---|---|
| `puppeteer` *(default)* | Chrome, Firefox |
| `playwright` | Chrome, Firefox, WebKit |
| `selenium-webdriver` | Chrome, Firefox, Edge |
| `webdriverio` | Chrome, Firefox |

The default is `puppeteer`. Switch with `--browser playwright` or the equivalent key in your configuration file.

→ [Browser adapters](browsers/browser.md) — full comparison of adapter capabilities, setup instructions, and selection guidance.

## Quickstart

The following assumes your UI5 application is already running locally (remote mode).

```bash
# 1. Install
npm install -g ui5-test-runner

# 2. Run your test suite
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html
```

When the run finishes, the report is available at `report/report.html` in your current working directory.

→ [Command line usage](usage.md) — all options, the configuration file format, and advanced usage.

## Compatibility

| | |
|---|---|
| **Node.js** | Node.js 18 or later; version 6 requires Node.js 24 |
| **UI5** | A broad range of UI5 versions is supported |
| **Operating systems** | Linux, macOS, Windows |
| **Test frameworks** | QUnit, OPA5 |

## Exploring the documentation

### Running tests

- [Command line usage](usage.md) — complete options reference and configuration file format
- [Testing a running application](testing.md) — remote mode in depth, including coverage setup
- [Legacy mode](modes/legacy.md) — when the runner serves the application itself
- [Batch mode](modes/batch.md) — running multiple projects in one invocation

### Browsers

- [Browser adapters](browsers/browser.md) — how to select and configure an automation library
- [Puppeteer](browsers/puppeteer.md) · [Playwright](browsers/playwright.md) · [Selenium WebDriver](browsers/selenium-webdriver.md) · [WebdriverIO](browsers/webdriverio.md) · [jsdom](browsers/jsdom.md)

### Results and coverage

- [Code coverage](coverage.md) — extracting coverage in both legacy and remote mode
- [Report output](report-output.md) — report structure, the CTRF format, and CI integration
- [Warnings reference](warnings.md) — what each warning code means and how to resolve it

### Operations

- [CI/CD integration](ci.md) — exit codes, GitHub Actions and Azure DevOps pipeline examples
- [Troubleshooting](debug.md) — diagnosing common problems step by step
- [Tips and tricks](tipsNtricks.md) — performance tuning, debugging, and IDE integration

### Migration and releases

- [What's new in v6](v6.md) — architecture changes, new features, and performance improvements
- [Migrating to v6](migration_v5_v6.md) — breaking changes and updated option names
