---
"#type": concept
title: selenium-webdriver driver
summary: The v6 Selenium WebDriver driver — an in-process automation library using WebDriver BiDi; Chrome is wired today, Firefox/Edge/Safari are declared but not yet launched
keywords:
  - selenium
  - selenium-webdriver
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

# selenium-webdriver driver

Select with `--driver selenium-webdriver`. The
[selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) library is
loaded in-process and drives the browser over the WebDriver protocol.

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

* Uses WebDriver **BiDi** (BiDi log inspector, browsing-context, script and
  network modules) for console and network capture.
* Chrome arguments (`UI5TR_CHROME_ARGS`) are passed into the Chrome `Options` —
  see [Chrome / Chromium specifics](browsers/chrome.md).
* Requires a matching browser driver binary installed locally; see the
  [selenium-webdriver installation notes](https://www.npmjs.com/package/selenium-webdriver#installation).
