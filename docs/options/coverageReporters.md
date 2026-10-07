---
"#type": option
title: coverageReporters
type: string
short: cr
multiple: yes
summary: istanbul-lib-report reporters to use
default: "['lcov', 'cobertura']"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
Each value names an istanbul-lib-report reporter (e.g. `lcov`, `cobertura`, `html`, `json`). The `text` reporter is always appended automatically so a summary is printed to the terminal regardless of this setting.
