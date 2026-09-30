---
"#type": option
title: logFilter
type: string
short: lf
summary: JavaScript expression (using punyexpr) to filter logs for dumping with --log-dump
keywords:
  - debug
  - trace
validation:
  - message: "requires log and logDump"
    conditions:
      - "log !== undefined"
      - "logDump !== undefined"
relations:
  see-also:
    - options/log
    - options/logDump
---