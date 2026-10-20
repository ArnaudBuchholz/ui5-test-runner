---
"#type": option
title: failFast
short: f
type: boolean
summary: stop the whole execution after the first failing page
batchForwarded: yes
keywords:
  - bail
  - abort
  - stop
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--fail-fast` / `-f`

Stop the whole execution after the first failure (page / batch item).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `failFast` |
| Short flag | `-f` |
| Propagates to batch items | yes |

## Details

When set, the runner stops scheduling new work after a failure. Remaining queued pages or items are skipped.

In batch mode, a failed batch item prevents further batch items from being started. Batch items that
were already running are allowed to complete so their reports and logs are preserved.

## Example

```bash
ui5-test-runner --fail-fast
ui5-test-runner -f --parallel 4
```
