---
"#type": option
title: ci
type: boolean
summary: forces CI mode (no interactive output)
batchForwarded: yes
default: "!process.stdout.isTTY"
keywords:
  - cicd
  - noninteractive
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/reportDir
---
# `--ci`

Forces CI mode (no interactive output).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | `!process.stdout.isTTY` |
| Config key | `ci` |
| Propagates to batch items | yes |

## Details

By default, the runner detects when executed in an interactive output. It then renders dynamic progress bars while generating a static output in the [reportDir](./reportDir.md) folder. When executed in a pipeline, the output matches the static one. This option controls this behavior.

## Example

```bash
ui5-test-runner --ci
```
