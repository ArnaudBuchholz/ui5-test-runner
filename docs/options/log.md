---
"#type": option
title: log
type: fs-entry
typeModifiers:
  - file
summary: read and dump log file using jsonl format
dependsOn: cwd
keywords:
  - debug
  - trace
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'log'"
---
