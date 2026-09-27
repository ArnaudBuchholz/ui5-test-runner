---
"#type": option
title: version
type: boolean
summary: display version
keywords:
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'version'"
---
