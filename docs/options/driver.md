---
"#type": option
title: driver
short: d
type: enumeration
summary: driver selection
keywords:
  - browser
  - capabilities
batchForwarded: yes
default: "'puppeteer'"
browserExposed: yes
typeModifiers:
  - puppeteer
  - playwright
  - webdriverio
  - selenium-webdriver
---
# `--driver` / `-d`

Driver selection.

## Overview

| | |
|---|---|
| Type | [`enumeration`](types/enumeration.md) |
| Values | `puppeteer` \| `playwright` \| `webdriverio` \| `selenium-webdriver` |
| Default | `'puppeteer'` |
| Config key | `driver` |
| Short flag | `-d` |
| Propagates to batch items | yes |

## Details

Selects the browser automation driver used to open and control test pages. Supported values: `puppeteer`, `playwright`, `webdriverio`, `selenium-webdriver`. See [browser selection](../browser_selection.md) for driver-specific configuration and capabilities.

## Example

```bash
ui5-test-runner --driver playwright
ui5-test-runner -d webdriverio
```
