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
Receives the final HTML, LCOV, and Cobertura output produced by istanbul-lib-report. The directory is wiped before each new report is written.
