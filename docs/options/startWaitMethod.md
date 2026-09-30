---
"#type": option
title: startWaitMethod
type: string
summary: HTTP method used when polling the startWaitUrl
default: "'GET'"
validation:
  - message: "requires start and startWaitUrl"
    conditions:
      - "start !== undefined"
      - "startWaitUrl !== undefined"
keywords:
  - http
  - poll
  - healthcheck
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/start
    - options/startWaitUrl
---
