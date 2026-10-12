---
"#type": option
title: version
type: boolean
summary: display version
keywords:
  - version
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'version'"
---
# `--version`

Display version.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `version` |

## Details

Prints the runner version and exits immediately. Cannot be combined with any other mode option (e.g. `--url`, `--serve-only`, `--mcp`).

## Example

```bash
ui5-test-runner --version
```
