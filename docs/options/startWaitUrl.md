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
# `--start-wait-url`

URL to poll after the start command is executed.

## Overview

| | |
|---|---|
| Type | [`url`](types/url.md) |
| Default | *none* |
| Config key | `startWaitUrl` |

## Details

Once the start command is spawned, the runner polls this URL until it responds with a successful HTTP status (any 2xx, i.e. a `fetch` response whose `ok` flag is true), using the method defined by `startWaitMethod`. The polling continues until success or until `startTimeout` is reached.

Requires `--start` to be configured.

## Example

```bash
ui5-test-runner --start "node server.js" --start-wait-url http://localhost:3000/health
ui5-test-runner --start "node server.js" --start-wait-url http://localhost:3000/ --start-wait-method HEAD --start-timeout 60000
```
