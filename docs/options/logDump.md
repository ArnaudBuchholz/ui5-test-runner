---
"#type": "[[option]]"
type: "[[boolean]]"
summary: dump all traces to stdout instead of opening a browser (requires --log)
tags:
  - "#debug"
see:
  - "[[log]]"
validation:
  - message: "requires log"
    conditions:
      - "log !== undefined"
---
