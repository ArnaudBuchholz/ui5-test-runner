---
"#type": option
title: llm
type: boolean
summary: forces LLM-friendly output (compact, no color, structured summary)
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

Forces LLM-friendly output (compact, no color, structured summary).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `llm` |
| Propagates to batch items | yes |

## Details

Produces output tailored for consumption by a Large Language Model (for example when the runner is driven through its MCP server). Compared to the default static output, it removes ANSI color codes, suppresses the periodic progress heartbeat and per-page lifecycle lines, annotates each event with its `source` and `pageId`, and ends with a compact pass/fail summary plus a pointer to the trace file for deeper investigation.

Enabling this option implies [`--ci`](./ci.md) (non-interactive output) and [`--no-banner`](./noBanner.md) (no startup logo).

## Example

```bash
ui5-test-runner --llm
```
