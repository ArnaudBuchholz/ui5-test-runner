---
"#type": option
title: startTimeout
type: timeout
summary: maximum waiting time for the start command to become ready
default: 30000
validation:
  - message: "requires start and startWaitUrl"
    conditions:
      - "start !== undefined"
      - "startWaitUrl !== undefined"
keywords:
  - timeout
  - setup
  - ready
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/start
    - options/startWaitUrl
---
