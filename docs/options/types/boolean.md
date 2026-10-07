---
"#type": concept
title: boolean type
summary: Option value that is either true or false, accepting several textual forms on the command line.
keywords:
  - boolean
  - flag
  - true
  - false
---
Either `true` or `false`, accepting several textual forms on the command line.

## Syntax

Accepted values for a boolean option are:

* true: `true`, `'true'`, `'on'`, `1`
* false: `false`, `'false'`, `'off'`, `0`

A boolean option is usually `false` by default; just using the option without a value sets it to `true`.

To explicitly set a boolean option to `false`, pass one of the false values after it.

## Example

Using [failFast](../failFast.md) as `ui5-test-runner --fail-fast` sets `failFast` to `true`.

To force it off, pass a false value: `ui5-test-runner --ci false`.
