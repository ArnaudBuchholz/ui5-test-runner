---
"#type": option
title: junitXmlFilename
type: string
summary: filename for the JUnit XML report saved in the report directory
default: "'junit.xml'"
dependsOn: reportDir
keywords:
  - legacy
  - remote
  - junit
  - xml
  - report
  - filename
relations:
  see-also:
    - options/reportDir
---
# `--junit-xml-filename`

filename for the JUnit XML report saved in the report directory

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | `'junit.xml'` |
| Config key | `junitXmlFilename` |

## Details

A JUnit XML report is always generated alongside `report.json` and `report.html`. This option controls the output filename (relative to [reportDir](./reportDir.md)). Set it to an empty string to disable JUnit XML output.

## Example

```bash
ui5-test-runner --junit-xml-filename results.xml
```
