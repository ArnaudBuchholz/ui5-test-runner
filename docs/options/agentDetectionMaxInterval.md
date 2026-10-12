---
"#type": option
title: agentDetectionMaxInterval
type: timeout
summary: maximum polling interval when detecting a test framework after page load
default: "1000"
browserExposed: yes
keywords:
  - agent
---
# `--agent-detection-max-interval`

Maximum polling interval when detecting a test framework after page load.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `1000` |
| Config key | `agentDetectionMaxInterval` |

## Details

The polling interval for test-framework detection starts at [`--agent-detection-interval`](./agentDetectionInterval.md) and backs off exponentially. This option caps that back-off so the runner never waits longer than this value between polls.

## Example

```bash
ui5-test-runner --agent-detection-max-interval 2000
ui5-test-runner --agent-detection-max-interval 2s
```
