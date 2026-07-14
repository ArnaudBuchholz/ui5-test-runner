---
"#type": "[[option]]"
type: "[[url]]"
summary: URL to poll after the start command is executed
tags:
  - legacy
  - remote
  - batch
see:
  - "[[start]]"
  - "[[startWaitMethod]]"
  - "[[startTimeout]]"
---

Once the start command is spawned, the runner polls this URL until it responds with HTTP 200 (using the method defined by `startWaitMethod`). The polling continues until success or until `startTimeout` is reached.
