---
"#type": option
title: pageFilter
short: pf
type: regexp
summary: filter pages to execute
batchForwarded: yes
keywords:
  - filter
  - select
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--page-filter` / `-pf`

filter pages to execute

## Overview

| | |
|---|---|
| Type | [`regexp`](types/regexp.md) |
| Default | *none* |
| Config key | `pageFilter` |
| Short flag | `-pf` |
| Propagates to batch items | yes |

## Details

A regular expression matched against each page URL. Only pages whose URL matches are executed; non-matching pages are skipped entirely. Useful for debugging a single failing test page without running the full suite.

## Example

```bash
ui5-test-runner --page-filter "MyComponent"
ui5-test-runner -pf "integration/opaTests"
```
