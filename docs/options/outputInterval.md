---
"#type": option
title: outputInterval
short: oi
type: timeout
summary: interval for reporting progress on non interactive output (CI/CD)
batchForwarded: yes
default: 30000
keywords:
  - progress
  - cicd
  - heartbeat
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/ci
---
# `--output-interval` / `-oi`

interval for reporting progress on non interactive output (CI/CD)

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `30000` |
| Config key | `outputInterval` |
| Short flag | `-oi` |
| Propagates to batch items | yes |

## Details

In CI (non-TTY) mode, prints a progress line every N milliseconds so the pipeline log does not appear stalled. Set to a lower value for faster feedback in slow test suites, or increase it to reduce log volume.

## Example

```bash
ui5-test-runner --output-interval 60000
ui5-test-runner -oi 10000
```
