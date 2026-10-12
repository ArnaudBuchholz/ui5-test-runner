---
"#type": mode
title: Log viewer mode
summary: open a .logz log file produced by a previous test run in an interactive browser-based viewer, or dump filtered log entries to stdout
keywords:
  - log
  - viewer
  - trace
  - debug
  - logDump
  - logFilter
  - logz
relations:
  requires:
    - options/log
  see-also:
    - options/logDump
    - options/logFilter
    - debug
---
# Log viewer mode

## Overview

This mode is activated when `--log <file>` is passed. It reads a `.logz` log file produced by a previous test run and either opens an interactive browser-based viewer or dumps the entries to stdout.

## Log file naming

Every test run automatically writes a compressed log file to `<reportDir>/` named:

```
traces-YYYYMMDD-HHMMSS.logz
```

For example: `report/traces-20251030-215600.logz`. The file is a framed, deflate-compressed stream of JSONL entries.

## Interactive viewer (`--log <file>`)

The runner starts a local web server, opens a browser window pointing at it, and streams the log entries from the file into the UI. Use CTRL+C to exit.

```bash
ui5-test-runner --log report/traces-20251030-215600.logz
```

## Stdout dump (`--log <file> --log-dump`)

Instead of opening a browser, the runner writes every log entry as a JSON array to stdout. Combine with `--log-filter` to select a subset.

```bash
ui5-test-runner --log report/traces-20251030-215600.logz --log-dump
ui5-test-runner --log report/traces-20251030-215600.logz --log-dump --log-filter "source === 'job'"
```

`--log-filter` accepts a [`punyexpr`](https://www.npmjs.com/package/punyexpr) expression evaluated against each log entry's attributes. Only entries where the expression is truthy are emitted.

## Constraints

- `--log` cannot be combined with other mode options (e.g. `--url`, `--batch`, `--mcp`).
- `--log-dump` and `--log-filter` require `--log`.
