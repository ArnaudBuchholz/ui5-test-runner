---
"#type": option
title: dumpConfig
type: boolean
summary: dump the resolved configuration as JSON and exit
keywords:
  - config
  - json
  - resolved
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'dumpConfig'"
---
# `--dump-config`

Dump the resolved configuration as JSON and exit.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `dumpConfig` |

## Details

Prints the fully-resolved configuration as JSON to stdout and exits without running any tests. Useful for debugging option precedence — shows the merged result of config file, environment, and CLI arguments.

## Example

```bash
ui5-test-runner --dump-config
ui5-test-runner --config my-runner.json --dump-config
```
