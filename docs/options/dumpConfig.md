---
"#type": option
title: dumpConfig
type: boolean
summary: dump the resolved configuration as JSON and exit
keywords:
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'dumpConfig'"
---
