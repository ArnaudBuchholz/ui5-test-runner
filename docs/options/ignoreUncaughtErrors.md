---
"#type": option
title: ignoreUncaughtErrors
type: boolean
summary: do not fail the test when a page raises an uncaught error
batchForwarded: yes
keywords:
  - uncaught
  - error
  - ignore
  - tolerate
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/ignoreUnhandledRejections
---
# `--ignore-uncaught-errors`

Do not fail the test when a page raises an uncaught error.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `ignoreUncaughtErrors` |
| Propagates to batch items | yes |

## Details

By default, an uncaught error raised by the tested page fails the page. When this flag is
set, the error does not fail the page; it is still logged as a warning.

This option only covers `window` `error` events (synchronous uncaught errors). Unhandled promise
rejections (`window` `unhandledrejection` events) are a separate event type and are not affected
by this flag — they continue to fail the page unless
[`--ignore-unhandled-rejections`](ignoreUnhandledRejections.md) is also set. That option works the
same way: the rejection is logged as a warning rather than failing the page.

## Example

```bash
ui5-test-runner --ignore-uncaught-errors
```
