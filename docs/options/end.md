---
"#type": option
title: end
type: string
summary: command to be executed after the tests
keywords:
  - hook
  - teardown
relations:
  affects:
    - modes/legacy
    - modes/remote
  see-also:
    - options/cwd
    - options/endOverrideExitCode
---
# `--end`

Command to be executed after the tests.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `end` |

## Details

The command string accepts `{{optionName}}` placeholders, which are expanded at runtime using the value of the corresponding configuration option (e.g. `cwd`, `reportDir`). The command executes with `cwd` as its working directory.

In addition to configuration options, the following extra placeholders are available:

| Placeholder | Value |
|---|---|
| `{{exitCode}}` | The runner's exit code at the time the end command is invoked |

Environment variables and full command syntax are documented in [start](./start.md).

> **Note:** By default the end command can only **fail** the run — a non-zero exit code (or a timeout)
> fails it, but a successful (`0`) end command never clears an existing test failure. This keeps
> `--end` safe for report generation and cleanup. To let the end command override the runner's result
> in **both** directions (bless a failure or taint a success), set
> [`--end-override-exit-code`](./endOverrideExitCode.md).

## Example

```bash
ui5-test-runner --end "node scripts/cleanup.js"
ui5-test-runner --end "echo Tests finished with exit code {{exitCode}}"
```
