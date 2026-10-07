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
