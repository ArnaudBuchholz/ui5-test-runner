---
"#type": concept
title: overwrite modifier
summary: Modifier allowing an fs-entry option to point to a possibly missing item that will be overwritten if it exists
keywords:
  - overwrite
  - modifier
  - fs-entry
relations:
  affects:
    - options/types/fs-entry
---
# overwrite modifier

## Syntax

By default, an [fs-entry](../fs-entry.md) option points to an existing item.

This modifier indicates that:
- The item entry *may* not exist,
- If it exists, the item will be **overwritten**.

## Example

The [`reportDir`](../../reportDir.md) option points to an output directory that may not yet exist:

```bash
ui5-test-runner --report-dir ./test-results
```
