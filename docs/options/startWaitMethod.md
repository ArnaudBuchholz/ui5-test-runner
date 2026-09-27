---
"#type": option
title: startWaitMethod
type: string
summary: HTTP method used when polling the startWaitUrl
default: "'GET'"
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
