---
"#type": option
title: testsuite
type: string
summary: path of the testsuite file
default: "'test/testsuite.qunit.html'"
keywords:
  - suite
  - qunit
relations:
  affects:
    - modes/legacy
---
# `--testsuite`

Path of the testsuite file.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | `'test/testsuite.qunit.html'` |
| Config key | `testsuite` |

## Details

Relative URL of the UI5 testsuite file, resolved against the served
[webapp](./webapp.md).

This option is a fallback for [url](./url.md): at the start of a test run, if no
`url` is provided, the runner builds a single starting URL from `testsuite`
(against the local server it just started) and loads it. If `url` is given,
`testsuite` is ignored.

## Example

```bash
ui5-test-runner --testsuite test/testsuite.qunit.html
ui5-test-runner --testsuite test/allTests.qunit.html --webapp src
```
