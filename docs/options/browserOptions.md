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
relations:
  see-also:
    - v6_breaking_changes
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

A JSON object of driver-specific launch options passed directly to the browser driver.

### `args` (puppeteer and playwright)

An array of additional CLI flags appended to the browser process. Both drivers inject their own flags via `UI5TR_CHROME_ARGS`; `args` lets you append further ones.

### `ignoreDefaultArgs` (puppeteer and playwright)

Controls which default Chrome/Chromium flags the driver injects automatically:

- `true` — suppress **all** default args (bare browser launch, dangerous: may break CDP attachment and screenshots)
- `string[]` — suppress only the listed flags, e.g. `["--enable-automation"]` to hide the automation banner

Security-relaxing flags are not needed here. In version 5 a `--unsecure` flag (passed through `--browser-args`) disabled browser security — e.g. Chrome's local-network-access check — so the test page could reach the runner. Version 6 injects an agent into the page and fetches its state from the runner, so there is nothing to relax: do not add `--unsecure` (or equivalent security-disabling flags) to `args`. See the [version 6 breaking changes](../v6_breaking_changes.md) for the migration detail.

## Examples

```bash
ui5-test-runner --browser-options '{"args":["--no-sandbox","--disable-dev-shm-usage"]}'
```

```bash
ui5-test-runner --browser-options '{"ignoreDefaultArgs":["--enable-automation"]}'
```
