---
"#type": option
title: watch
type: boolean
summary: watch for file changes and automatically reload
keywords:
  - mcp
validation:
  - message: "this option is valid only for --mcp with --debug-mcp-local-docs"
    conditions:
      - "!watch || (mode === 'mcp' && debugMcpLocalDocs)"
relations:
  see-also:
    - options/mcp
---
# `--watch`

Watch for file changes and automatically reload.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `watch` |

## Details

When set, the runner monitors relevant files for changes and reloads automatically. Currently used by the MCP server to reindex documentation without requiring a restart.

Only valid when used with `--mcp` and `--debug-mcp-local-docs`.

## Example

```bash
ui5-test-runner --mcp --watch
```
