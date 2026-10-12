---
"#type": option
title: browserOptions
type: json
summary: browser-specific options (JSON)
keywords:
  - browser
  - capabilities
default: "{}"
batchForwarded: yes
---
# `--browser-options`

Browser-specific options (JSON).

## Overview

| | |
|---|---|
| Type | [`json`](types/json.md) |
| Default | `{}` |
| Config key | `browserOptions` |
| Propagates to batch items | yes |

## Details

A JSON object of driver-specific launch options passed directly to the browser driver. Currently, only the `puppeteer` driver reads the `args` array to pass additional flags to the browser process.

## Example

```bash
ui5-test-runner --browser-options '{"args":["--no-sandbox","--disable-dev-shm-usage"]}'
```
