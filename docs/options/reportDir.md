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
The `report/` folder contains test execution results.