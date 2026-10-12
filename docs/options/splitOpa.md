---
"#type": option
title: splitOpa
short: so
type: boolean
summary: split OPA tests by QUnit module, creating one test page per module
batchForwarded: yes
browserExposed: yes
keywords:
  - opa
  - qunit
  - module
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--split-opa` / `-so`

Split OPA tests by QUnit module, creating one test page per module.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `splitOpa` |
| Short flag | `-so` |
| Propagates to batch items | yes |

## Details

When enabled, OPA test pages are automatically split into individual test pages — one per QUnit module — enabling parallel execution without changing the OPA bootstrap page.

## Example

```bash
ui5-test-runner --split-opa
ui5-test-runner --split-opa --url http://localhost:8080/test/opaTests.qunit.html
```
