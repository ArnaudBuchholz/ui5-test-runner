---
"#type": option
title: browserViewportWidth
short: W
type: integer
typeModifiers:
  - positive
  - non-zero
summary: width of the browser viewport in pixels
default: "1920"
keywords:
  - viewport
  - resolution
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--browser-viewport-width` / `-W`

Width of the browser viewport in pixels.

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) |
| Default | `1920` |
| Config key | `browserViewportWidth` |
| Short flag | `-W` |

## Example

```bash
ui5-test-runner --browser-viewport-width 1280
ui5-test-runner -W 1280
```
