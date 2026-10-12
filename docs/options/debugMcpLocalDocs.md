---
"#type": option
title: debugMcpLocalDocs
type: boolean
summary: use local docs/ directory instead of fetching from GitHub (development only)
keywords:
  - debug
  - mcp
validation:
  - message: "this option requires --mcp"
    conditions:
      - "!debugMcpLocalDocs || mode === 'mcp'"
relations:
  see-also:
    - options/mcp
---
# `--debug-mcp-local-docs`

Use local docs/ directory instead of fetching from GitHub (development only).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `debugMcpLocalDocs` |

## Details

When set, the MCP server reads documentation from the local `docs/` directory instead of fetching from GitHub. Intended for development use only — allows testing doc changes without publishing.

## Example

```bash
ui5-test-runner --mcp --debug-mcp-local-docs
```
