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
