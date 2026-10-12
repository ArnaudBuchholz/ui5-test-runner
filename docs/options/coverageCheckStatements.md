---
"#type": option
title: coverageCheckStatements
type: percent
short: ccs
summary: minimum statement coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-check-statements` / `-ccs`

Minimum statement coverage threshold (0 = no check).

## Overview

| | |
|---|---|
| Type | [`percent`](types/percent.md) |
| Default | `0` |
| Config key | `coverageCheckStatements` |
| Short flag | `-ccs` |

## Details

If greater than 0, the runner fails when statement coverage falls below this percentage.

## Example

```bash
ui5-test-runner --coverage --coverage-check-statements 80
ui5-test-runner --coverage -ccs 75
```
