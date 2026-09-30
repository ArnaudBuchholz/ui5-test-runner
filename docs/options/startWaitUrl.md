---
"#type": option
title: startWaitUrl
type: url
summary: URL to poll after the start command is executed
validation:
  - message: "requires start"
    conditions:
      - "start !== undefined"
keywords:
  - poll
  - healthcheck
  - ready
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/start
    - options/startWaitMethod
    - options/startTimeout
---
Once the start command is spawned, the runner polls this URL until it responds with a successful HTTP status (any 2xx, i.e. a `fetch` response whose `ok` flag is true), using the method defined by `startWaitMethod`. The polling continues until success or until `startTimeout` is reached.
