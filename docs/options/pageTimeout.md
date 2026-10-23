---
"#type": option
title: pageTimeout
short: pt
type: timeout
summary: fails a page if it takes longer than this timeout
batchForwarded: yes
keywords:
  - timeout
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/globalTimeout
    - options/batchTimeout
---
# `--page-timeout` / `-pt`

fails a page if it takes longer than this timeout

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | *none* |
| Config key | `pageTimeout` |
| Short flag | `-pt` |
| Propagates to batch items | yes |

## Details

Per-page timeout in milliseconds. If a page takes longer than this value it is marked as failed and closed. Distinct from [`--global-timeout`](./globalTimeout.md), which applies to the entire run, and from [`--batch-timeout`](./batchTimeout.md), which bounds a whole batch item in [batch mode](../modes/batch.md). When not set, pages run until they complete or the global timeout fires.

When `--global-timeout` is also set, the effective per-page timeout is capped to the time remaining in the global budget — see [`--global-timeout`](./globalTimeout.md) for how this clamping works.

## Example

```bash
ui5-test-runner --page-timeout 120000
ui5-test-runner -pt 60000
```
