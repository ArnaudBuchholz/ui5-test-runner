---
"#type": option
type: fs-entry
typeModifiers:
  - file
summary: read and dump log file using jsonl format
dependsOn: cwd
tags:
  - debug
  - mode
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'log'"
---
