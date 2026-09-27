---
"#type": option
title: startWaitUrl
type: url
summary: URL to poll after the start command is executed
keywords:
  - legacy
  - remote
  - batch
validation:
  - message: "requires start"
    conditions:
      - "start !== undefined"
relations:
  see-also:
    - options/start
    - options/startWaitMethod
    - options/startTimeout
---

Once the start command is spawned, the runner polls this URL until it responds with HTTP 200 (using the method defined by `startWaitMethod`). The polling continues until success or until `startTimeout` is reached.
