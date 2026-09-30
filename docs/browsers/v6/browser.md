---
"#type": concept
title: Drivers and browsers
summary: The v6 model — a driver is an in-process automation library, a browser is the concrete browser it launches. All drivers share one contract and the same base capabilities
keywords:
  - driver
  - browser
  - automation
  - capabilities
  - in-process
relations:
  see-also:
    - options/driver
    - options/browser
    - options/browserOptions
    - browser-selection
    - browsers/v6/puppeteer
    - browsers/v6/playwright
    - browsers/v6/webdriverio
    - browsers/v6/selenium-webdriver
    - browsers/v6/browsers/chrome
---

# Drivers and browsers

`ui5-test-runner` runs tests inside a real browser. Two orthogonal options
control how:

* [`--driver`](../../options/driver.md) selects the automation **library**
  (`puppeteer`, `playwright`, `webdriverio`, `selenium-webdriver`). Default:
  `puppeteer`.
* [`--browser`](../../options/browser.md) selects the concrete **browser** that
  library launches (`chrome`, `chromium`, `firefox`, `webkit`, `edge`,
  `safari`). Optional — each driver has its own default browser.

See [Browser selection](../../browser-selection.md) for how the two combine and
which combinations are valid.

## In-process — no more command file

In v5, a browser was a separate JavaScript "instantiation command" (e.g.
`$/puppeteer.js`) that `ui5-test-runner` **forked** as a child process. That
model is gone.

In v6, drivers are **in-process ES modules** shipped with the runner. The runner
imports the underlying automation library directly and talks to the browser
without a forked helper. If you are migrating a v5 configuration that referenced
a `$/…​.js` command, see [Browser instantiation command (v5)](../v5/browser.md).

## Base capabilities shared by every driver

Every driver implements the same contract, so these work identically regardless
of `--driver`:

* **Screenshots** — `.png`
* **Script injection** — scripts are evaluated before the page loads
* **Console and network traces** — captured uniformly
* **Debug logging and lifecycle** — graceful start-up, abort, and shutdown are
  handled by the runner for all drivers

Capabilities such as video or HAR recording are **not** part of the v6 driver
contract.

## Available drivers

| Driver | Default browser | Details |
|---|---|---|
| [puppeteer](puppeteer.md) | `chrome` | chrome + firefox wired |
| [playwright](playwright.md) | `chromium` | chromium wired |
| [webdriver.io](webdriverio.md) | `chrome` | chrome wired (BiDi) |
| [selenium-webdriver](selenium-webdriver.md) | `chrome` | chrome wired (BiDi) |

Some drivers **declare** support for more browsers than they currently launch —
each driver page marks which browsers are wired today versus planned.

Browser-specific tuning (extra Chrome flags) is documented in
[Chrome / Chromium specifics](browsers/chrome.md).

## jsdom is not supported in v6

The v5 `jsdom` browser has been removed. `--driver jsdom` fails with
`Unknown driver: jsdom`. Migrate to one of the drivers above — `puppeteer`
(the default) is the closest replacement for headless runs.

## Design rationale

The two-flag driver/browser model — automation library versus concrete browser —
is motivated in [ADR-0013: Browser Selection Architecture](../../adr/0013-browser-selection.md).
