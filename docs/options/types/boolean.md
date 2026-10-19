---
"#type": concept
title: boolean type
summary: Option value that is either true or false, accepting several textual forms on the command line
keywords:
  - boolean
  - flag
---
# boolean type

Either `true` or `false`, accepting several textual forms on the command line.

## Syntax

Accepted values for a boolean option are:

* true: `true`, `'true'`, `'on'`, `1`
* false: `false`, `'false'`, `'off'`, `0`

A boolean option is usually `false` by default; just using the option without a value sets it to `true`.

To explicitly set a boolean option to `false`, pass one of the false values after it.

## Example

Using [failFast](../failFast.md) without a value sets it to `true`; pass a false value to force it off:

```bash
ui5-test-runner --fail-fast
ui5-test-runner --ci false
```
