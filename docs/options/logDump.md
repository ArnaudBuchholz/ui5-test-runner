---
"#type": option
title: logDump
type: boolean
summary: dump all traces to stdout instead of opening a browser (requires --log)
keywords:
  - debug
validation:
  - message: "requires log"
    conditions:
      - "log !== undefined"
relations:
  see-also:
    - options/log
---
