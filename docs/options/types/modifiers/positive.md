---
"#type": concept
title: positive modifier
summary: Modifier requiring an integer option value to be zero or greater.
keywords:
  - positive
  - modifier
relations:
  affects:
    - options/types/integer
---
# positive modifier

## Syntax

The value must be zero or greater (negative values are **rejected**).

## Example

The [`port`](../../port.md) option requires a non-negative port number:

```bash
ui5-test-runner --port 8080
```
