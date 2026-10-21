---
"#type": option
title: screenshot
type: boolean
summary: take a screenshot after every OPA assertion
browserExposed: yes
batchForwarded: yes
keywords:
  - screenshot
  - opa
  - assertion
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

Screenshots only make sense for OPA tests: they capture the UI state driven by an OPA journey. For a plain QUnit test there is no benefit in taking a screenshot — nothing visual is being asserted — so `--screenshot` has no value for QUnit test cases. The only screenshot that still matters for any test is the automatic one taken on failure, see [`--screenshot-on-failure`](./screenshotOnFailure.md).

## Example

```bash
ui5-test-runner --screenshot --url http://localhost:8080/test/testsuite.qunit.html
```
