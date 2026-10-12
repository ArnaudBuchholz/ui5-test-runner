---
"#type": option
title: endTimeout
type: timeout
summary: maximum waiting time for the end command to execute
keywords:
  - timeout
  - teardown
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/end
---
# `--end-timeout`

Maximum waiting time for the end command to execute.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | *none* |
| Config key | `endTimeout` |

## Details

Sets a time limit for the [`--end`](./end.md) command. If the command does not complete within the given timeout, the runner terminates it and proceeds to exit.

## Example

```bash
ui5-test-runner --end "node scripts/teardown.js" --end-timeout 30000
ui5-test-runner --end "npm run cleanup" --end-timeout 60000
```
