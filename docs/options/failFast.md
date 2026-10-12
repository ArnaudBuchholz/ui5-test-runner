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

Stop the whole execution after the first failing page.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `failFast` |
| Short flag | `-f` |
| Propagates to batch items | yes |

## Details

When set, the runner stops as soon as any test page reports a failure. Remaining queued pages are skipped.

This option does not ripple across batch instances.

## Example

```bash
ui5-test-runner --fail-fast
ui5-test-runner -f --parallel 4
```
