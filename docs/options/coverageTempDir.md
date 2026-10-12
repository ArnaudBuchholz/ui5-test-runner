---
"#type": option
title: coverageTempDir
type: fs-entry
short: ctd
typeModifiers:
  - overwrite
summary: temporary directory for coverage data
default: "'.nyc_output'"
dependsOn: cwd
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-temp-dir` / `-ctd`

Temporary directory for coverage data.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | `'.nyc_output'` |
| Config key | `coverageTempDir` |
| Short flag | `-ctd` |

## Details

Stores instrumented source files and per-page raw coverage JSON files during a run. The directory is wiped at the start of each run and must not contain files you want to keep.

## Example

```bash
ui5-test-runner --coverage --coverage-temp-dir .nyc_output
ui5-test-runner --coverage -ctd /tmp/coverage-data
```
