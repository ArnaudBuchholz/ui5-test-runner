---
"#type": option
title: agentDetectionTimeout
type: timeout
summary: maximum time to wait for a test framework to be detected after page load
default: "5000"
browserExposed: yes
keywords:
  - agent
---
# `--agent-detection-timeout`

Maximum time to wait for a test framework to be detected after page load.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `5000` |
| Config key | `agentDetectionTimeout` |

## Details

If no test framework is detected within this time budget, the page is considered failed. The polling schedule is controlled by [`--agent-detection-interval`](./agentDetectionInterval.md) and [`--agent-detection-max-interval`](./agentDetectionMaxInterval.md).

## Example

```bash
ui5-test-runner --agent-detection-timeout 10000
ui5-test-runner --agent-detection-timeout 10s
```
