---
"#type": option
title: failOpaFast
short: fo
type: boolean
summary: stop the OPA page execution after the first failing test
batchForwarded: yes
keywords:
  - opa
  - bail
  - stop
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--fail-opa-fast` / `-fo`

Stop the OPA page execution after the first failing test.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `failOpaFast` |
| Short flag | `-fo` |
| Propagates to batch items | yes |

## Details

When set, the runner stops executing the current OPA test page as soon as the first test fails. Other pages that are queued or already running are not affected — only the failing page is aborted early.

## Example

```bash
ui5-test-runner --fail-opa-fast
ui5-test-runner -fo --parallel 2
```
