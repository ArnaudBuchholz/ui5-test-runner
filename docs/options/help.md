---
"#type": option
title: help
type: boolean
summary: display help
keywords:
  - help
  - usage
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'help'"
---
# `--help`

Display help.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `help` |

## Details

Prints the help text listing all available options and exits immediately. Cannot be combined with other mode options such as `--url`, `--batch`, or `--mcp`.

## Example

```bash
ui5-test-runner --help
```
