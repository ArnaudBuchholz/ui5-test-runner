---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[overwrite]]"
summary: directory for the final coverage report
default: "'coverage'"
dependsOn: "[[cwd]]"
tags:
  - coverage
  - legacy
  - remote
---
Receives the final HTML, LCOV, and Cobertura output produced by istanbul-lib-report. The directory is wiped before each new report is written.
