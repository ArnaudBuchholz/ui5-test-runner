---
"#type": option
title: debugLog
type: string
multiple: yes
summary: output debug logs for given sources
keywords:
  - debug
---
# `--debug-log`

Output debug logs for given sources.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `debugLog` |

## Details

Accepts one or more source names to enable verbose internal tracing for those components. For instance:

- `reserve` — HTTP server traces
- `job` — test job scheduling and execution
- `mcp` — MCP server communication

## Example

```bash
ui5-test-runner --debug-log reserve
ui5-test-runner --debug-log reserve job
```
