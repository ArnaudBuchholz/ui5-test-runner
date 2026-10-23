---
"#type": option
title: browserDevice
type: string
summary: emulate a Puppeteer-known device — sets the viewport, user agent, and touch support, overriding browser viewport width and height
keywords:
  - browser
  - device
  - emulation
  - puppeteer
batchForwarded: yes
relations:
  see-also:
    - options/browserViewportWidth
    - options/browserViewportHeight
    - options/driver
validation:
  - message: "browserDevice is only supported with the puppeteer driver"
    conditions:
      - "driver === 'puppeteer'"
  - message: "browserDevice requires the chrome browser"
    conditions:
      - "browser === undefined || browser === 'chrome'"
---
# `--browser-device`

Emulate a [Puppeteer-known device](https://pptr.dev/api/puppeteer.knowndevices),
such as `iPhone X`. Device emulation sets the viewport, user agent, and touch
support. It overrides `--browser-viewport-width` and
`--browser-viewport-height`.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `browserDevice` |
| Propagates to batch items | yes |
| Supported driver/browser | `puppeteer` / `chrome` |

## Details

Device emulation sets three things simultaneously: the **viewport** dimensions, the **user agent** string, and **touch support**. Because it controls the viewport, it overrides [`--browser-viewport-width`](./browserViewportWidth.md) and [`--browser-viewport-height`](./browserViewportHeight.md) — any viewport flags set alongside `--browser-device` are ignored.

Only works with `--driver puppeteer` and the `chrome` browser.

## Example

```bash
ui5-test-runner --driver puppeteer --browser-device "iPhone X"
```

In `ui5-test-runner.json`:

```json
{
  "browserDevice": "iPhone X"
}
```
