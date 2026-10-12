---
"#type": option
title: browser
short: b
type: enumeration
summary: browser selection (per driver)
keywords:
  - browser
  - capabilities
batchForwarded: yes
typeModifiers:
  - chrome
  - chromium
  - firefox
  - webkit
  - edge
  - safari
validation:
  - message: "browser is not supported by puppeteer (chrome, firefox)"
    conditions:
      - "driver !== 'puppeteer' || browser === 'chrome' || browser === 'firefox'"
  - message: "browser is not supported by playwright (chromium, firefox, webkit)"
    conditions:
      - "driver !== 'playwright' || browser === 'chromium' || browser === 'firefox' || browser === 'webkit'"
  - message: "browser is not supported by webdriverio (chrome, firefox, edge, safari)"
    conditions:
      - "driver !== 'webdriverio' || browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'safari'"
  - message: "browser is not supported by selenium-webdriver (chrome, firefox, edge, safari)"
    conditions:
      - "driver !== 'selenium-webdriver' || browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'safari'"
---
# `--browser` / `-b`

Browser selection (per driver).

## Overview

| | |
|---|---|
| Type | [`enumeration`](types/enumeration.md) |
| Values | `chrome` \| `chromium` \| `firefox` \| `webkit` \| `edge` \| `safari` |
| Default | *none* |
| Config key | `browser` |
| Short flag | `-b` |
| Propagates to batch items | yes |

## Supported browsers per driver

| Driver | Supported values |
|---|---|
| `puppeteer` | `chrome`, `firefox` |
| `playwright` | `chromium`, `firefox`, `webkit` |
| `webdriverio` | `chrome`, `firefox`, `edge`, `safari` |
| `selenium-webdriver` | `chrome`, `firefox`, `edge`, `safari` |

## Example

```bash
ui5-test-runner --driver playwright --browser firefox
ui5-test-runner -b chrome
```
