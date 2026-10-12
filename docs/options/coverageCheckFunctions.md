---
"#type": option
title: coverageCheckFunctions
type: percent
short: ccf
summary: minimum function coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-check-functions` / `-ccf`

Minimum function coverage threshold (0 = no check).

## Overview

| | |
|---|---|
| Type | [`percent`](types/percent.md) |
| Default | `0` |
| Config key | `coverageCheckFunctions` |
| Short flag | `-ccf` |

## Details

If greater than 0, the runner fails when function coverage falls below this percentage.

## Example

```bash
ui5-test-runner --coverage --coverage-check-functions 90
ui5-test-runner --coverage -ccf 80
```
