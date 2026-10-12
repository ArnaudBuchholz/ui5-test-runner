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
# `--start-wait-method`

HTTP method used when polling the startWaitUrl.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | `'GET'` |
| Config key | `startWaitMethod` |

## Details

Determines the HTTP method the runner uses when polling `--start-wait-url` to check whether the started process is ready. The default `GET` works for most servers. Change this only if the server requires a different method (e.g. `HEAD` or `POST`) for its health-check endpoint.

Requires both `--start` and `--start-wait-url` to be configured.

## Example

```bash
ui5-test-runner --start "node server.js" --start-wait-url http://localhost:3000/health --start-wait-method HEAD
```
