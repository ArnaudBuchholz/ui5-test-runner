---
"#type": option
title: batchTimeout
short: bt
type: timeout
summary: fails a batch item if it takes longer than this timeout
keywords:
  - timeout
relations:
  affects:
    - modes/batch
  see-also:
    - options/globalTimeout
    - options/pageTimeout
---
# `--batch-timeout` / `-bt`

Fails a batch item if it takes longer than this timeout.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | *none* |
| Config key | `batchTimeout` |
| Short flag | `-bt` |

## Details

When set, any batch item that exceeds this duration is forcibly terminated and marked as failed. Without this option, batch items can run indefinitely.

When `--global-timeout` is also set, the effective batch-item timeout is capped to the time remaining in the global budget — see [`--global-timeout`](./globalTimeout.md) for how this clamping works.

## Example

```bash
ui5-test-runner --batch-timeout 300000
ui5-test-runner -bt 5m
```
