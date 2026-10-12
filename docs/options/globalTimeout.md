---
"#type": option
title: globalTimeout
short: t
type: timeout
summary: limit the tests execution time, fail remaining pages if it takes longer than the timeout
keywords:
  - timeout
  - deadline
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--global-timeout` / `-t`

Limit the tests execution time, fail remaining pages if it takes longer than the timeout.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | *none* |
| Config key | `globalTimeout` |
| Short flag | `-t` |

## Details

Sets a wall-clock budget for the entire run. Pages still executing when the timeout expires are marked as failed, and the runner exits with a non-zero exit code.

## Example

```bash
ui5-test-runner --global-timeout 600000
ui5-test-runner -t 3600000
```
