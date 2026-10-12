---
"#type": option
title: screenshotTimeout
type: timeout
summary: maximum time allowed to take a screenshot
default: "5000"
batchForwarded: yes
keywords:
  - screenshot
  - timeout
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--screenshot-timeout`

maximum time allowed to take a screenshot

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `5000` |
| Config key | `screenshotTimeout` |
| Propagates to batch items | yes |

## Details

Maximum time in milliseconds that the runner waits for a screenshot capture to complete. If a screenshot takes longer, it is abandoned and the test run continues.

## Example

```bash
ui5-test-runner --screenshot-timeout 10000
```
