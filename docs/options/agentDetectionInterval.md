---
"#type": option
title: agentDetectionInterval
type: timeout
summary: initial polling interval when detecting a test framework after page load
default: "100"
browserExposed: yes
keywords:
  - agent
---
# `--agent-detection-interval`

Initial polling interval when detecting a test framework after page load.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `100` |
| Config key | `agentDetectionInterval` |

## Details

After a page loads, the runner polls at this interval to detect whether a test framework (e.g. QUnit) has initialized. If detection does not succeed immediately, the interval grows exponentially toward [`--agent-detection-max-interval`](./agentDetectionMaxInterval.md). The total time budget is controlled by [`--agent-detection-timeout`](./agentDetectionTimeout.md).

## Example

```bash
ui5-test-runner --agent-detection-interval 200
ui5-test-runner --agent-detection-interval 500ms
```
