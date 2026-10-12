---
"#type": option
title: mcp
type: boolean
summary: start an MCP server to pilot ui5-test-runner with an MCP client
keywords:
  - ai
  - agent
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'mcp'"
---
# `--mcp`

start an MCP server to pilot ui5-test-runner with an MCP client

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `mcp` |

## Details

Starts the runner in MCP server mode, exposing tools that an MCP-compatible AI client (such as Claude) can call to run and inspect tests. Cannot be combined with other mode options.

## Example

```bash
ui5-test-runner --mcp
```
