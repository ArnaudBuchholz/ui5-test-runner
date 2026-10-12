---
"#type": option
title: reportDir
short: r
type: fs-entry
typeModifiers:
  - overwrite
summary: directory to output test reports
default: "'report'"
dependsOn: cwd
keywords:
  - report
  - output
  - directory
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/cwd
---
# `--report-dir` / `-r`

directory to output test reports

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) (overwrite) |
| Default | `'report'` |
| Config key | `reportDir` |
| Short flag | `-r` |

## Details

The report directory stores all test execution output: `report.json` (CTRF format), `report.html`, screenshots, and `.logz` trace files. The directory is cleared and recreated at the start of each run.

## Example

```bash
ui5-test-runner --report-dir ./test-results
ui5-test-runner -r ./ci-reports
```