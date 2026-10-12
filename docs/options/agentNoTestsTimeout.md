---
"#type": option
title: agentNoTestsTimeout
type: timeout
summary: time to wait after QUnit.done fires with no tests before declaring the page done
default: "5000"
browserExposed: yes
keywords:
  - agent
---
# `--agent-no-tests-timeout`

Time to wait after QUnit.done fires with no tests before declaring the page done.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `5000` |
| Config key | `agentNoTestsTimeout` |

## Details

When `QUnit.done` fires but reports zero tests, the runner waits this long before treating the page as finished. This handles pages that load tests asynchronously after the initial `QUnit.done` event.

## Example

```bash
ui5-test-runner --agent-no-tests-timeout 8000
ui5-test-runner --agent-no-tests-timeout 8s
```
