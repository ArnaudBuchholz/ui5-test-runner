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
# `--start-timeout`

Maximum waiting time for the start command to become ready.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `30000` |
| Config key | `startTimeout` |

## Details

After spawning the `--start` command, the runner polls `--start-wait-url` repeatedly. If no successful response is received within this duration (in milliseconds), the runner aborts with an error.

Requires both `--start` and `--start-wait-url` to be configured.

## Example

```bash
ui5-test-runner --start "node server.js" --start-wait-url http://localhost:3000/ --start-timeout 60000
```
