---
"#type": option
title: batchId
type: string
summary: identifier for the batch item
keywords:
  - id
relations:
  affects:
    - modes/batch
---
# `--batch-id`

Identifier for the batch item.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `batchId` |

## Details

When not specified, defaults to the basename of the configuration file or folder.

Typically set inside the batch item's own configuration file rather than on the command line, so each item self-describes its identity.

## Example

```json
{
  "batchId": "app1-tests"
}
```
