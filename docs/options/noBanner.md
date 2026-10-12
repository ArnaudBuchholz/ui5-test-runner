---
"#type": option
title: noBanner
type: boolean
summary: do not display the startup banner (logo) and environment information
keywords:
  - banner
  - logo
  - quiet
---
# `--no-banner`

do not display the startup banner (logo) and environment information

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `noBanner` |

## Details

When enabled, the startup banner — the ASCII logo and the environment information lines (tool version, Node.js version, timestamp and host CPU) — is not written to the terminal or the report output. Useful for clean logs, embedded use and machine consumption.

## Example

```bash
ui5-test-runner --no-banner --url http://localhost:8080/test/testsuite.qunit.html
```
