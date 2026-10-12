---
"#type": option
title: serveOnly
type: boolean
short: s
summary: start the legacy web server and serve the application without running any tests
keywords:
  - serve
  - server
  - webapp
relations:
  affects:
    - modes/legacy
---
# `--serve-only` / `-s`

Start the legacy web server and serve the application without running any tests.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `serveOnly` |
| Short flag | `-s` |

## Details

When set, the runner starts its internal web server (legacy mode) and serves the application at `http://localhost:<port>/`, but no browser is launched and no tests are executed. The server keeps running until CTRL+C.

This is useful to:
- Browse the application manually at a specific UI5 version or with custom library mappings
- Inspect the instrumented source files when coverage is enabled
- Verify the server configuration before running the full test suite

The `--port` and `--lib` options work normally alongside `--serve-only`. The `--start` command (if configured) is still executed before the server starts.

## Example

```bash
ui5-test-runner --serve-only
ui5-test-runner --serve-only --port 8080 --lib mylib=./libs/mylib
```
