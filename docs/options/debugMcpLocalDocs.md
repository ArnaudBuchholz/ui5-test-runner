---
"#type": "[[option]]"
type: "[[boolean]]"
summary: use local docs/ directory instead of fetching from GitHub (development only)
default: "false"
see:
  - "[[mcp]]"
validation:
  - message: "this option requires --mcp"
    conditions:
      - "!debugMcpLocalDocs || mode === 'mcp'"
---
When set, the MCP server reads documentation from the local `docs/` directory instead of fetching from GitHub. Intended for development use only — allows testing doc changes without publishing.
