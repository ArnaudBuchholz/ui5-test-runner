---
"#type": option
title: startTimeout
type: timeout
summary: maximum waiting time for the start command to become ready
default: 30000
keywords:
  - legacy
  - remote
  - batch
validation:
  - message: "requires start and startWaitUrl"
    conditions:
      - "start !== undefined"
      - "startWaitUrl !== undefined"
relations:
  see-also:
    - options/start
    - options/startWaitUrl
---
