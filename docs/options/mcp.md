---
"#type": "[[option]]"
type: "[[boolean]]"
summary: start an MCP server to pilot ui5-test-runner with an MCP client
tags:
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'mcp'"
---
