---
"#type": option
title: batchLabel
type: string
summary: display label for the batch item
keywords:
  - label
  - name
relations:
  affects:
    - modes/batch
---
# `--batch-label`

Display label for the batch item.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `batchLabel` |

## Details

When not specified, defaults to the basename of the configuration file or folder.

Typically set inside the batch item's own configuration file rather than on the command line, so each item self-describes its display name.

## Example

```json
{
  "batchLabel": "Application 1"
}
```
