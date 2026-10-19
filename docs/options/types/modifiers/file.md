---
"#type": concept
title: file modifier
summary: Modifier indicating that an fs-entry option must point to a file rather than a folder
keywords:
  - file
  - modifier
  - fs-entry
relations:
  affects:
    - options/types/fs-entry
---
# file modifier

## Syntax

This modifier indicates that an [`fs-entry`](../fs-entry.md) option is expected to point to a **file**.

## Example

The [`log`](../../log.md) option requires a file path:

```bash
ui5-test-runner --log ./traces.logz
```
