---
"#type": option
title: coverageReporters
type: string
short: cr
multiple: yes
summary: istanbul-lib-report reporters to use
default: "['lcov', 'cobertura']"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-reporters` / `-cr`

Istanbul-lib-report reporters to use.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Multiple | yes |
| Default | `['lcov', 'cobertura']` |
| Config key | `coverageReporters` |
| Short flag | `-cr` |

## Details

Each value names an istanbul-lib-report reporter (e.g. `lcov`, `cobertura`, `html`, `json`). The `text` reporter is always appended automatically so a summary is printed to the terminal regardless of this setting.

## Example

```bash
ui5-test-runner --coverage --coverage-reporters lcov html
ui5-test-runner --coverage -cr json cobertura
```
