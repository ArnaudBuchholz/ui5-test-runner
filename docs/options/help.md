---
"#type": option
title: help
type: boolean
summary: display help
keywords:
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'help'"
---
