---
"#type": option
title: coverageReportDir
type: fs-entry
short: crd
typeModifiers:
  - overwrite
summary: directory for the final coverage report
default: "'coverage'"
dependsOn: cwd
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-report-dir` / `-crd`

Directory for the final coverage report.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | `'coverage'` |
| Config key | `coverageReportDir` |
| Short flag | `-crd` |

## Details

Receives the final HTML, LCOV, and Cobertura output produced by istanbul-lib-report. The directory is wiped before each new report is written.

## Example

```bash
ui5-test-runner --coverage --coverage-report-dir reports/coverage
ui5-test-runner --coverage -crd ./output/coverage
```
