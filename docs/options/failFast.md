---
"#type": option
title: failFast
short: f
type: boolean
summary: stop the whole execution after the first failing page
batchForwarded: yes
keywords:
  - bail
  - abort
  - stop
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
This option does not ripple across batch instances.