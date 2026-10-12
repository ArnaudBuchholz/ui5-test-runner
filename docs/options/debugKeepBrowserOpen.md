---
"#type": option
title: debugKeepBrowserOpen
type: boolean
summary: keeps the browser open after the tests completed
keywords:
  - debug
---
# `--debug-keep-browser-open`

Keeps the browser open after the tests completed.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `debugKeepBrowserOpen` |

## Details

When set, the browser window remains open after the test run finishes instead of being closed automatically. This allows you to inspect the page, open DevTools, and examine the DOM or console output for debugging purposes.

## Example

```bash
ui5-test-runner --debug-keep-browser-open
ui5-test-runner --debug-keep-browser-open --url http://localhost:8080/test/testsuite.qunit.html
```
