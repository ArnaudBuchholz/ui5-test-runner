---
"#type": option
title: ignoreUnhandledRejections
type: boolean
summary: do not fail the test when a page raises an unhandled promise rejection
batchForwarded: yes
keywords:
  - unhandled
  - rejection
  - promise
  - ignore
  - tolerate
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/ignoreUncaughtErrors
---
# `--ignore-unhandled-rejections`

Do not fail the test when a page raises an unhandled promise rejection.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `ignoreUnhandledRejections` |
| Propagates to batch items | yes |

## Details

By default, an unhandled promise rejection raised by the tested page fails the page. When this flag is
set, the rejection does not fail the page; it is still logged as a warning.

This option only covers `window` `unhandledrejection` events (promise rejections). Uncaught synchronous
errors (`window` `error` events) are a separate event type and are not affected by this flag — they
continue to fail the page unless [`--ignore-uncaught-errors`](ignoreUncaughtErrors.md) is also set.

## Example

```bash
ui5-test-runner --ignore-unhandled-rejections
```
