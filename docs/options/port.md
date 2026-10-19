---
"#type": option
title: port
type: integer
typeModifiers:
  - positive
summary: Port the local web server listens on; 0 allocates a free port automatically
keywords:
  - server
  - http
relations:
  affects:
    - modes/legacy
---
# `--port`

port to use

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) (positive) |
| Default | *none* |
| Config key | `port` |

## Details

Sets the port the local server listens on.

When set to `0`, the runner allocates a free port automatically. If [`url`](./url.md) contains port `0` (for example `http://localhost:0`), that `0` is replaced with the port the runner allocated.

## Example

```bash
ui5-test-runner --port 8080
ui5-test-runner --port 0
```