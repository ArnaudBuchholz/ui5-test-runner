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
    - options/logFilter
---
# `--log-dump`

dump all traces to stdout instead of opening a browser (requires --log)

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `logDump` |

## Details

When combined with [`--log`](./log.md), writes all log entries as a JSON array to stdout instead of opening an interactive browser viewer. Useful for scripted trace analysis or piping to other tools.

Requires `--log`. To narrow the output, add [`--log-filter`](./logFilter.md).

## Example

```bash
ui5-test-runner --log report/traces-20241101-120000.logz --log-dump
ui5-test-runner --log report/traces-20241101-120000.logz --log-dump --log-filter "entry.type === 'error'"
```
