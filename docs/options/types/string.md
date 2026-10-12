---
"#type": concept
title: string type
summary: Option value accepting any textual value.
keywords:
  - string
---
# string type

Any textual value.

## Syntax

Any string is accepted, with no further constraint.

## Example

The [`pageParams`](../pageParams.md) option takes an arbitrary string appended to the page URL:

```bash
ui5-test-runner --page-params foo=bar&debug=true
ui5-test-runner -pp foo=bar&debug=true
```
