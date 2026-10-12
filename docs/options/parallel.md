---
"#type": option
title: parallel
short: p
type: integer
typeModifiers:
  - positive
  - non-zero
summary: number of parallel executions
batchForwarded: yes
default: "2"
browserExposed: yes
keywords:
  - concurrency
  - workers
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--parallel` / `-p`

number of parallel executions

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) (positive, non-zero) |
| Default | `2` |
| Config key | `parallel` |
| Short flag | `-p` |
| Propagates to batch items | yes |

## Details

Controls how many parallel executions can occur inside the runner. For instance, when dealing with multiple pages to test, this determines how many pages are run simultaneously.

When running in batch mode the multiplier effect applies: 2 batch items each running with `--parallel 2` results in up to 4 browser instances open at once. Size this according to available system resources.

## Example

```bash
ui5-test-runner --parallel 4
ui5-test-runner -p 1
```
