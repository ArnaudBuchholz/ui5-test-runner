---
"#type": option
title: coverageCheckLines
type: percent
short: ccl
summary: minimum line coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-check-lines` / `-ccl`

Minimum line coverage threshold (0 = no check).

## Overview

| | |
|---|---|
| Type | [`percent`](types/percent.md) |
| Default | `0` |
| Config key | `coverageCheckLines` |
| Short flag | `-ccl` |

## Details

If greater than 0, the runner fails when line coverage falls below this percentage.

## Example

```bash
ui5-test-runner --coverage --coverage-check-lines 80
ui5-test-runner --coverage -ccl 75
```
