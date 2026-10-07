---
"#type": concept
title: percent type
summary: Option value expressing a percentage, an integer from 0 to 100 where 0 usually disables the check.
keywords:
  - percent
  - percentage
  - threshold
  - coverage
---
A percentage value, expressed as an integer between `0` and `100`.

## Syntax

An integer from `0` to `100`. Used for coverage thresholds where `0` means the check is disabled and any greater value is the minimum percentage that must be reached.

## Example

The [`coverageCheckBranches`](../coverageCheckBranches.md) option takes a percentage: `--coverage-check-branches 80` requires at least 80% branch coverage.
