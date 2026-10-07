---
"#type": option
title: coverageCheckBranches
type: percent
short: ccb
summary: minimum branch coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
If greater than 0, the runner fails when branch coverage falls below this percentage.
