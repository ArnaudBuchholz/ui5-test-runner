---
"#type": option
title: log
type: fs-entry
typeModifiers:
  - file
summary: path to a .logz trace file produced by a previous run; activates log viewer mode
dependsOn: cwd
keywords:
  - debug
  - trace
  - logz
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'log'"
relations:
  see-also:
    - modes/log
    - options/logDump
    - options/logFilter
---
# `--log`

path to a .logz trace file produced by a previous run; activates log viewer mode

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) (file) |
| Default | *none* |
| Config key | `log` |

## Details

Pass the path to a `traces-YYYYMMDD-HHMMSS.logz` file written to `reportDir` by a previous test run. Activates [log viewer mode](../modes/log.md).

In log viewer mode the runner opens a browser to let you inspect traces interactively. Combine with [`--log-dump`](./logDump.md) to write entries as a JSON array to stdout instead.

## Example

```bash
ui5-test-runner --log report/traces-20241101-120000.logz
ui5-test-runner --log report/traces-20241101-120000.logz --log-dump
```
