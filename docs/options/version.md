---
"#type": option
title: version
type: boolean
summary: display version
keywords:
  - version
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'version'"
---
