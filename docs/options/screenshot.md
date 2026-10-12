---
"#type": option
title: screenshot
type: boolean
summary: take a screenshot after every OPA assertion
browserExposed: yes
batchForwarded: yes
keywords:
  - agent
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
# `--screenshot`

take a screenshot after every OPA assertion

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `screenshot` |
| Propagates to batch items | yes |

## Details

When enabled, a screenshot is captured after every OPA assertion and saved in the report directory. Enabling this option keeps the agent polling interval fast regardless of the OPA detection setting.

## Example

```bash
ui5-test-runner --screenshot --url http://localhost:8080/test/testsuite.qunit.html
```
