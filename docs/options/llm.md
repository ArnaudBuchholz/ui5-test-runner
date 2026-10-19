---
"#type": option
title: llm
type: boolean
summary: forces LLM-friendly output (compact, no color, severity-tagged)
batchForwarded: yes
implies:
  - when: llm
    set:
      ci: true
      noBanner: true
keywords:
  - cicd
  - noninteractive
relations:
  see-also:
    - options/ci
    - options/noBanner
    - options/reportDir
---
# `--llm`

Forces LLM-friendly output (compact, no color, severity-tagged).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `llm` |
| Propagates to batch items | yes |

## Details

Produces output tailored for consumption by a Large Language Model (for example when the runner is driven through its MCP server). Compared to the default static output, it removes ANSI color codes, drops the elapsed-time prefix, and suppresses the periodic progress heartbeat and the per-page lifecycle lines (those remain in the report's `output.txt`). Each event is printed on a single line annotated with its `source` (and `pageId` when page-scoped), e.g. `[page#2] navigation failed`; warnings and above are tagged with a severity word (`WARN`, `ERROR`, `FATAL`). Final counts come from the run's own completion log, and the trace file path is logged so it can be inspected afterwards (see [reportDir](./reportDir.md)).

Enabling this option implies [`--ci`](./ci.md) (non-interactive output) and [`--no-banner`](./noBanner.md) (no startup logo).

## Example

```bash
ui5-test-runner --llm
```
