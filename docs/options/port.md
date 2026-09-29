---
"#type": option
title: port
type: integer
typeModifiers:
  - positive
summary: port to use
keywords:
  - legacy
---
Sets the port the local server listens on.

When set to `0`, the runner allocates a free port automatically. If
[url](./url.md) contains port `0` (for example `http://localhost:0`), that `0`
is replaced with the port the runner allocated.