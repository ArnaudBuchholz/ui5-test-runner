---
"#type": "[[option]]"
type: "[[boolean]]"
summary: dump the resolved configuration as JSON and exit
tags:
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'dumpConfig'"
---
