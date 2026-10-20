---
"#type": option
title: batchOutput
type: boolean
summary: print output.txt for every batch item after execution
keywords:
  - batch
  - output
  - logs
relations:
  affects:
    - modes/batch
---
# `--batch-output`

Print each batch item's `output.txt` after all batch items have settled.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `batchOutput` |

## Details

The output is printed in alphabetical `batchId` order, with a heading for each item. This includes
the child's plain-text test summary, failures, and coverage output. Items with no resolved
`reportDir` (e.g. skipped items) are silently skipped; items whose `reportDir` is set but whose
`output.txt` cannot be read produce a warning.

When a batch-item configuration does not set `reportDir`, its child receives an isolated fallback
directory under the parent report directory, including when the parent uses the default `report`
location. A batch-item configuration that explicitly sets `reportDir` keeps that value. The child
sends its resolved directory back to the main process, which then reads its `output.txt`.

## Example

```bash
ui5-test-runner --batch apps/ --report-dir report --batch-output
```
