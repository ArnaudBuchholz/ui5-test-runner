---
"#type": option
title: coverageCheckBranches
type: percent
short: ccb
summary: minimum branch coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-check-branches` / `-ccb`

Minimum branch coverage threshold (0 = no check).

## Overview

| | |
|---|---|
| Type | [`percent`](types/percent.md) |
| Default | `0` |
| Config key | `coverageCheckBranches` |
| Short flag | `-ccb` |

## Details

If greater than 0, the runner fails when branch coverage falls below this percentage.

## Example

```bash
ui5-test-runner --coverage --coverage-check-branches 75
ui5-test-runner --coverage -ccb 80
```
