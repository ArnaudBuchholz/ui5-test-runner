---
"#type": option
title: cwd
short: c
type: fs-entry
summary: set working directory
default: process.cwd()
defaultLabel: current working directory
keywords:
  - directory
  - folder
  - chdir
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--cwd` / `-c`

Set working directory.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | current working directory |
| Config key | `cwd` |
| Short flag | `-c` |

## Details

Sets the base directory from which ui5-test-runner operates. Most other options that accept file system paths (e.g. `--config`, `--webapp`, `--report-dir`, `--coverage-report-dir`) are resolved relative to this value.

## Example

```bash
ui5-test-runner --cwd /path/to/project
ui5-test-runner -c ./my-app --url http://localhost:8080
```
