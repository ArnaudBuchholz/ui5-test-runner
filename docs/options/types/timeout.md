---
"#type": concept
title: timeout type
summary: Option value representing a maximum delay, expressed in milliseconds, seconds or minutes with unit suffixes.
keywords:
  - timeout
  - delay
  - duration
  - milliseconds
  - seconds
  - minutes
---
Represents a maximum delay.

## Syntax

Can be expressed using different suffixes:

* `123`: number of milliseconds
* `123ms`: number of milliseconds
* `123s`: number of seconds
* `123sec`: number of seconds
* `123m`: number of minutes
* `123min`: number of minutes

## Example

The [`agentDetectionInterval`](../agentDetectionInterval.md) option takes a timeout: `--agent-detection-interval 100` (100 milliseconds) or `--agent-detection-interval 2s` (2 seconds).
