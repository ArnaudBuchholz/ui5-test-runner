---
"#type": option
title: agentScreenshotTimeout
type: timeout
summary: maximum time OPA waits for a pending screenshot before continuing
default: "10000"
browserExposed: yes
keywords:
  - agent
---
# `--agent-screenshot-timeout`

Maximum time OPA waits for a pending screenshot before continuing.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `10000` |
| Config key | `agentScreenshotTimeout` |

## Details

When OPA triggers a screenshot (e.g. on assertion failure), the agent waits up to this duration for the screenshot to complete before continuing test execution. If the screenshot takes longer, it is abandoned and execution proceeds.

## Example

```bash
ui5-test-runner --agent-screenshot-timeout 15000
ui5-test-runner --agent-screenshot-timeout 15s
```
