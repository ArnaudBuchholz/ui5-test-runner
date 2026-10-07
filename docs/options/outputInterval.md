---
"#type": option
title: outputInterval
short: oi
type: timeout
summary: interval for reporting progress on non interactive output (CI/CD)
batchForwarded: yes
default: 30000
keywords:
  - progress
  - cicd
  - heartbeat
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/ci
---
