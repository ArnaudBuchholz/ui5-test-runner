---
"#type": option
title: watch
type: boolean
summary: watch for file changes and automatically reload
keywords:
  - mcp
validation:
  - message: "this option is valid only for --mcp"
    conditions:
      - "!watch || mode === 'mcp'"
relations:
  see-also:
    - options/mcp
---
When set, the runner monitors relevant files for changes and reloads automatically. Currently used by the MCP server to reindex documentation without requiring a restart.
