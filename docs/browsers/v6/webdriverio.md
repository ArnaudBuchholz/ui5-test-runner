---
"#type": concept
title: webdriver.io driver
summary: The v6 WebdriverIO driver — an in-process automation library using WebDriver BiDi; Chrome is wired today, Firefox/Edge/Safari are declared but not yet launched
keywords:
  - webdriverio
  - webdriver
  - chrome
  - bidi
  - driver
relations:
  see-also:
    - options/driver
    - options/browser
    - browsers/v6/browser
    - browsers/v6/browsers/chrome
    - browser-selection
---

# webdriver.io driver

Select with `--driver webdriverio`. The
[webdriverio](https://www.npmjs.com/package/webdriverio) library is loaded
in-process and drives the browser over the WebDriver protocol.

## Supported browsers

| `--browser` | Status | Notes |
|---|---|---|
| `chrome` | ✔️ wired today | default when `--browser` is omitted |
| `firefox` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |
| `edge` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |
| `safari` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |

> The driver **validates** `firefox`/`edge`/`safari` as accepted values, but the
> current implementation always launches Chrome. Treat those as planned.

## Particularities

* Uses WebDriver **BiDi** (`webSocketUrl: true`, browsing-context
  subscriptions) for console and network capture.
* Writes a driver log to `<reportDir>/wdio.log`.
* Chrome arguments (`UI5TR_CHROME_ARGS`) are passed into `goog:chromeOptions` —
  see [Chrome / Chromium specifics](browsers/chrome.md).
