---
"#type": concept
title: integer type
summary: Option value that must be a whole number, refinable with the positive and non-zero modifiers.
keywords:
  - integer
---
# integer type

Any integer value, type modifiers *may* be used to restrict the list of possible values.

## Syntax

An integer value. It can be refined with modifiers:

* [positive](./modifiers/positive.md)
* [non-zero](./modifiers/non-zero.md)

## Example

The [`browserViewportHeight`](../browserViewportHeight.md) option takes an integer:

```bash
ui5-test-runner --browser-viewport-height 1080
ui5-test-runner -H 1080
```
