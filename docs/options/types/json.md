---
"#type": concept
title: json type
summary: Option value provided as a JSON-encoded string and parsed into an object.
keywords:
  - json
  - object
  - configuration
---
A JSON-encoded string that is parsed into an object.

## Syntax

Any valid JSON object, provided as a string. It is parsed into an object.

## Example

The [`browserOptions`](../browserOptions.md) option takes JSON: `--browser-options '{}'` for an empty object, or `--browser-options '{"headless":true}'` to pass structured options.
