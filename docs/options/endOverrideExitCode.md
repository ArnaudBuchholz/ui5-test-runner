---
"#type": option
title: endOverrideExitCode
type: boolean
summary: let the end command exit code override the runner result in both directions
keywords:
  - hook
  - teardown
  - exit code
  - ci
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
  see-also:
    - options/end
    - options/endTimeout
---
# `--end-override-exit-code`

Let the [end](./end.md) command's exit code override the runner's result in **both** directions.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* (off) |
| Config key | `endOverrideExitCode` |

## Details

By default, the end command can only ever make the run **fail** — it never clears an existing test
failure:

| Tests | End command exits | Default (this option off) | `--end-override-exit-code` |
|---|---|---|---|
| failed | `0` | run stays **failed** (result preserved) | run becomes **success** |
| passed | non-zero | run becomes **failed** | run becomes **failed** |
| passed | `0` | run stays **success** | run stays **success** |

This default keeps `--end` safe for report generation and cleanup: a reporter that exits `0`
because *report generation* succeeded does not silently turn a failing test run into a green one.
A failing end command (or an end command that exceeds [`--end-timeout`](./endTimeout.md)) still
fails the run.

Enable `--end-override-exit-code` when the end command is meant to be the authority on the final
result — for example a post-test script that blesses a known-flaky failure, or one that taints a
passing run because a coverage threshold or artefact validation failed. With this option set, the
end command's exit code replaces the runner's exit code whenever the command produces a defined
code, and the transition is logged in either direction.

## Example

```bash
# Default: a passing reporter cannot hide failing tests
ui5-test-runner --end "node scripts/report.js"

# Opt in: let the end command decide the final exit code (bless or taint the run)
ui5-test-runner --end "node scripts/validate.js" --end-override-exit-code
```
