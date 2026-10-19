---
"#type": concept
title: json type
summary: Option value provided as a JSON-encoded string and parsed into an object
keywords:
  - json
  - configuration
---
# json type

A JSON-encoded string that is parsed into an object.

## Syntax

Any valid JSON object, provided as a string. It is parsed into an object.

## Example

The [`browserOptions`](../browserOptions.md) option takes JSON:

```bash
ui5-test-runner --browser-options '{}'
ui5-test-runner --browser-options '{"headless":true}'
```
