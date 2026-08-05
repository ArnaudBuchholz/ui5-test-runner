---
"#type": "[[option]]"
type: "[[string]]"
short: lf
summary: JavaScript expression (using punyexpr) to filter logs for dumping with --log-dump
see:
  - "[[log]]"
  - "[[logDump]]"
tags:
  - "#debug"
validation:
  - message: "requires log and logDump"
    conditions:
      - "isSet(log)"
      - "isSet(logDump)"
---