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

Per-page timeout in milliseconds. If a page takes longer than this value it is marked as failed and closed. Distinct from `--global-timeout`, which applies to the entire run. When not set, pages run until they complete or the global timeout fires.

## Example

```bash
ui5-test-runner --page-timeout 120000
ui5-test-runner -pt 60000
```
