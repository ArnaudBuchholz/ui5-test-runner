---
"#type": option
title: coverageSourceDir
type: fs-entry
typeModifiers:
  - safe-default
summary: directory containing the source files used for coverage reporting
dependsOn: cwd
keywords:
  - coverage
  - source
relations:
  affects:
    - modes/remote
  see-also:
    - options/webapp
    - options/coverageSettings
---
# `--coverage-source-dir`

Directory containing the source files used for coverage reporting.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | *none* |
| Config key | `coverageSourceDir` |

## Details

When set, this directory is used as the `cwd` for nyc reporting instead of [`webapp`](./webapp.md), and local instrumentation is skipped. Use this when source files are served by an external server with its own instrumentation (e.g. `@ui5/middleware-code-coverage`) but are still accessible locally for coverage reporting.

## Example

```bash
ui5-test-runner --coverage --coverage-source-dir ./src
ui5-test-runner --url http://localhost:8080 --coverage --coverage-source-dir ./webapp
```
