---
"#type": concept
title: Chrome / Chromium specifics
summary: How to pass extra Chrome/Chromium launch arguments via the UI5TR_CHROME_ARGS environment variable and browserOptions
keywords:
  - chrome
  - chromium
  - arguments
  - flags
  - UI5TR_CHROME_ARGS
relations:
  see-also:
    - options/browser
    - options/browserOptions
    - browsers/v6/browser
    - browsers/v6/puppeteer
---

# Chrome / Chromium specifics

Chrome (and its Chromium variant) is the **default browser** for every driver
except [playwright](playwright.md), where the default is `chromium`. It is also
the only browser family that exposes browser-specific tuning today.

## Extra launch arguments — `UI5TR_CHROME_ARGS`

Set the `UI5TR_CHROME_ARGS` environment variable to pass additional command-line
arguments to the Chrome/Chromium process. The value is split on whitespace and
appended to the browser launch arguments.

```bash
UI5TR_CHROME_ARGS="--disable-infobars --lang=fr" ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html
```

This is honored by **all drivers**, but only affects the Chrome/Chromium family:

| Driver | Applies `UI5TR_CHROME_ARGS` |
|---|---|
| [puppeteer](puppeteer.md) | ✔️ only when the target browser is `chrome` |
| [playwright](playwright.md) | ✔️ always (Chromium) |
| [webdriver.io](webdriverio.md) | ✔️ into `goog:chromeOptions` |
| [selenium-webdriver](selenium-webdriver.md) | ✔️ into Chrome `Options` |

## Per-run options — `--browserOptions`

The [`--browserOptions`](../../../options/browserOptions.md) option takes a JSON
object of browser-specific settings. Today the [puppeteer](puppeteer.md) driver
reads its `args` array as extra launch arguments:

```bash
ui5-test-runner --driver puppeteer --browserOptions '{"args":["--disable-infobars"]}' --url http://localhost:8080/test/testsuite.qunit.html
```

`UI5TR_CHROME_ARGS` and `--browserOptions` `args` are additive — both sets of
arguments are passed to the browser.

## Other browsers

`firefox`, `webkit`, `edge`, and `safari` have no browser-specific options at the
moment. See [Browser selection](../../../browser-selection.md) for which drivers
declare support for them, and the per-driver docs for what is actually wired
today.
