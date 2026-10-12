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
# `--log-filter` / `-lf`

JavaScript expression (using punyexpr) to filter logs for dumping with --log-dump

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `logFilter` |
| Short flag | `-lf` |

## Details

A [punyexpr](https://github.com/nicolo-ribaudo/punyexpr) expression evaluated against each log entry. Only entries for which the expression is truthy are included in the output. Requires both [`--log`](./log.md) and [`--log-dump`](./logDump.md).

## Example

```bash
ui5-test-runner --log report/traces-20241101-120000.logz --log-dump --log-filter "entry.type==='error'"
```
