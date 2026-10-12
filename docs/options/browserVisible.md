---
"#type": option
title: browserVisible
short: V
type: boolean
summary: control if the browser should be visible during the tests
keywords:
  - headless
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--browser-visible` / `-V`

Control if the browser should be visible during the tests.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `browserVisible` |
| Short flag | `-V` |

## Details

By default the browser runs in headless mode. Pass this flag to make the browser window visible, which is useful for debugging failing tests.

## Example

```bash
ui5-test-runner --browser-visible
ui5-test-runner -V
```
