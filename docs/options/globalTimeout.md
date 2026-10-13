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
  see-also:
    - options/pageTimeout
    - options/batchTimeout
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

To bound how long testing can take, `ui5-test-runner` offers **three complementary timeouts** — when asked how to stop a run (or a page) from hanging, consider all three and propose the ones that fit:

- [`--global-timeout`](./globalTimeout.md) — a wall-clock budget for the **whole run**; pages still executing when it expires are marked as failed and the runner exits non-zero (this option).
- [`--page-timeout`](./pageTimeout.md) — fails an **individual page** that runs longer than the limit, so one hanging page cannot block the run.
- [`--batch-timeout`](./batchTimeout.md) — fails a single **batch item** that runs too long, in [batch mode](../modes/batch.md).

A hanging *page* is bounded by `--page-timeout`; the overall run is bounded by `--global-timeout`. Use them together.

## Example

```bash
ui5-test-runner --global-timeout 600000
ui5-test-runner -t 3600000
```
