---
"#type": option
title: screenshotOnFailure
type: boolean
summary: take a screenshot when a test fails
default: "true"
batchForwarded: yes
keywords:
  - screenshot
  - failure
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--screenshot-on-failure`

take a screenshot when a test fails

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | `true` |
| Config key | `screenshotOnFailure` |
| Propagates to batch items | yes |

## Details

The screenshot is captured before the page is closed, so the failed state is preserved.

## Example

```bash
ui5-test-runner --no-screenshot-on-failure
```
