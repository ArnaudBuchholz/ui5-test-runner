---
"#type": concept
title: percent type
summary: Option value expressing a percentage, a number from 0 to 100 (integer or decimal) where 0 usually disables the check.
keywords:
  - percent
  - percentage
  - threshold
  - coverage
---
# percent type

A percentage value, expressed as a number between `0` and `100` (integer or decimal, e.g. `80` or `80.5`).

## Syntax

A number from `0` to `100`. Decimal values are accepted using the `%` suffix form (e.g. `80.5%`). Used for coverage thresholds where `0` means the check is disabled and any greater value is the minimum percentage that must be reached.

## Example

The [`coverageCheckBranches`](../coverageCheckBranches.md) option takes a percentage:

```bash
ui5-test-runner --coverage-check-branches 80
```
