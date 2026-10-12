---
"#type": option
title: browserViewportHeight
short: H
type: integer
typeModifiers:
  - positive
  - non-zero
summary: height of the browser viewport in pixels
default: "1080"
keywords:
  - viewport
  - resolution
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--browser-viewport-height` / `-H`

Height of the browser viewport in pixels.

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) |
| Default | `1080` |
| Config key | `browserViewportHeight` |
| Short flag | `-H` |

## Example

```bash
ui5-test-runner --browser-viewport-height 768
ui5-test-runner -H 768
```
