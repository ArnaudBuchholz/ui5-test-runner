---
"#type": option
title: mcp
type: boolean
summary: start a documentation-only MCP server that lets an MCP client answer questions about ui5-test-runner
keywords:
  - ai
  - agent
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'mcp'"
---
# `--mcp`

start a documentation-only MCP server that lets an MCP client answer questions about ui5-test-runner

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `mcp` |

## Details

Starts the runner in MCP server mode, exposing its documentation to an MCP-compatible AI client (such as Claude) so it can answer questions about the tool. The server is **documentation-only**: it exposes two tools — `list_topics` (a catalog of documentation entities) and `get_topic` (the markdown for one entity) — and does **not** drive, monitor, or cancel test runs. Cannot be combined with other mode options.

## Example

```bash
ui5-test-runner --mcp
```
