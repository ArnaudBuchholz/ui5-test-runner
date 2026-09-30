---
"#type": concept
title: puppeteer driver
summary: The v6 Puppeteer driver — an in-process automation library driving Chrome (wired) and Firefox
keywords:
  - puppeteer
  - chrome
  - firefox
  - driver
  - bidi
relations:
  see-also:
    - options/driver
    - options/browser
    - browsers/v6/browser
    - browsers/v6/browsers/chrome
    - browser-selection
---

# `puppeteer` driver

Select with `--driver puppeteer` (this is the **default driver**). The
[puppeteer](https://www.npmjs.com/package/puppeteer) library is loaded in-process
and drives the browser directly.

## Supported browsers

| `--browser` | Status | Notes |
|---|---|---|
| `chrome` | ✔️ wired today | default when `--browser` is omitted |
| `firefox` | ✔️ wired today | passed through to `puppeteer.launch({ browser: 'firefox' })` |

## Particularities

* Reads [`--browserOptions`](../../options/browserOptions.md) `args` as extra
  launch arguments (the only driver that does so today).
* If Chrome is missing, the driver installs it on demand
  (`npx puppeteer browsers install …`).
* Extra Chrome arguments from `UI5TR_CHROME_ARGS` are applied only when the
  target browser is `chrome` — see [Chrome / Chromium specifics](browsers/chrome.md).
* If you hit `ERROR: Failed to set up Chrome …`, define
  `PUPPETEER_SKIP_DOWNLOAD=true`.
