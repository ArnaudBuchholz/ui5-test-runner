---
"#type": option
title: coverageCheckLines
type: percent
short: ccl
summary: minimum line coverage threshold (0 = no check)
default: "0"
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
If greater than 0, the runner fails when line coverage falls below this percentage.
