---
"#type": concept
title: non-zero modifier
summary: Modifier requiring an integer option value to differ from zero.
keywords:
  - non-zero
  - modifier
relations:
  affects:
    - options/types/integer
---
# non-zero modifier

## Syntax

The value must not be zero.

## Example

The [`parallel`](../../parallel.md) option requires a non-zero integer (at least one page must run at a time):

```bash
ui5-test-runner --parallel 4
```
