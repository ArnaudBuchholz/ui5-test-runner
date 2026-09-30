---
"#type": concept
title: playwright driver
summary: The v6 Playwright driver — an in-process automation library; Chromium is wired today, Firefox and WebKit are declared but not yet launched
keywords:
  - playwright
  - chromium
  - firefox
  - webkit
  - driver
relations:
  see-also:
    - options/driver
    - options/browser
    - browsers/v6/browser
    - browsers/v6/browsers/chrome
    - browser-selection
---

# playwright driver

Select with `--driver playwright`. The
[playwright](https://www.npmjs.com/package/playwright) library is loaded
in-process and drives the browser directly.

## Supported browsers

| `--browser` | Status | Notes |
|---|---|---|
| `chromium` | ✔️ wired today | default when `--browser` is omitted |
| `firefox` | 🚧 declared / not yet launched | in the support matrix, but the driver currently launches Chromium only |
| `webkit` | 🚧 declared / not yet launched | in the support matrix, but the driver currently launches Chromium only |

> The driver **validates** `firefox`/`webkit` as accepted values, but the
> current implementation always launches Chromium. Treat non-Chromium support as
> planned.

## Particularities

* On first use, Playwright may require `npx playwright install chromium`; the
  driver runs it automatically when the browser is missing.
* `UI5TR_CHROME_ARGS` is always applied to the Chromium launch — see
  [Chrome / Chromium specifics](browsers/chrome.md).
