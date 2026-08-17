---
"#type": "[[option]]"
type: "[[fs-entry]]"
short: ctd
typeModifiers:
  - "[[overwrite]]"
summary: temporary directory for coverage data
default: "'.nyc_output'"
dependsOn: "[[cwd]]"
tags:
  - coverage
  - legacy
  - remote
---
Stores instrumented source files and per-page raw coverage JSON files during a run. The directory is wiped at the start of each run and must not contain files you want to keep.
